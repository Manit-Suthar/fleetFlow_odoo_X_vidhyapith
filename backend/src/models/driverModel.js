const pool = require("../config/db");

// Get all drivers with optional filters
const getAll = async (filters = {}) => {
    let query = `
    SELECT d.*,
           v.vehicle_name AS assigned_vehicle,
           v.license_plate AS vehicle_plate,
           (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.id) AS trip_count,
           (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.id AND t.status = 'completed') AS completed_trips,
           (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.id AND t.status = 'completed' AND t.is_late = false) AS ontime_trips,
           (SELECT COUNT(*) FROM driver_issues di WHERE di.driver_id = d.id) AS issue_count,
           (SELECT COUNT(*) FROM driver_issues di WHERE di.driver_id = d.id AND di.issue_type IN ('Accident', 'Traffic Violation')) AS violation_count
    FROM drivers d
    LEFT JOIN vehicles v ON v.id = (
      SELECT t2.vehicle_id FROM trips t2 WHERE t2.driver_id = d.id ORDER BY t2.start_date DESC LIMIT 1
    )
    WHERE 1=1
  `;
    const params = [];

    if (filters.status && filters.status !== "all") {
        params.push(filters.status);
        query += ` AND d.status = $${params.length}`;
    }

    if (filters.search) {
        params.push(`%${filters.search}%`);
        query += ` AND (d.name ILIKE $${params.length} OR d.license_number ILIKE $${params.length} OR v.vehicle_name ILIKE $${params.length})`;
    }

    if (filters.license === "expiring") {
        query += ` AND d.license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`;
    } else if (filters.license === "expired") {
        query += ` AND d.license_expiry < CURRENT_DATE`;
    }

    query += ` ORDER BY d.id`;

    const result = await pool.query(query, params);
    return result.rows;
};

// Get single driver by ID
const getById = async (id) => {
    const result = await pool.query(
        `SELECT d.*,
            v.vehicle_name AS assigned_vehicle,
            v.license_plate AS vehicle_plate
     FROM drivers d
     LEFT JOIN vehicles v ON v.id = (
       SELECT t2.vehicle_id FROM trips t2 WHERE t2.driver_id = d.id ORDER BY t2.start_date DESC LIMIT 1
     )
     WHERE d.id = $1`,
        [id]
    );
    return result.rows[0];
};

// Create driver
const create = async (data) => {
    const { name, phone, license_number, license_expiry, status } = data;
    const result = await pool.query(
        `INSERT INTO drivers (name, phone, license_number, license_expiry, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, phone, license_number, license_expiry, status || "available"]
    );
    return result.rows[0];
};

// Update driver
const update = async (id, data) => {
    const { name, phone, license_number, license_expiry, status } = data;
    const result = await pool.query(
        `UPDATE drivers SET name=$1, phone=$2, license_number=$3, license_expiry=$4, status=$5, updated_at=CURRENT_TIMESTAMP
     WHERE id=$6 RETURNING *`,
        [name, phone, license_number, license_expiry, status, id]
    );
    return result.rows[0];
};

// Update status only
const updateStatus = async (id, status) => {
    const result = await pool.query(
        `UPDATE drivers SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
        [status, id]
    );
    return result.rows[0];
};

// Delete driver
const remove = async (id) => {
    await pool.query("DELETE FROM drivers WHERE id=$1", [id]);
};

// Get driver performance data
const getPerformance = async (id, from, to) => {
    const dateFilter = from && to ? `AND t.start_date BETWEEN $2 AND $3` : "";
    const params = from && to ? [id, from, to] : [id];

    // Summary stats
    const stats = await pool.query(
        `SELECT
       COUNT(*) AS total_trips,
       COUNT(*) FILTER (WHERE status = 'completed') AS completed_trips,
       COUNT(*) FILTER (WHERE status = 'completed' AND is_late = false) AS ontime_trips,
       COUNT(*) FILTER (WHERE status = 'completed' AND is_late = true) AS late_trips,
       COALESCE(SUM(distance_km), 0) AS total_distance
     FROM trips t WHERE t.driver_id = $1 ${dateFilter}`,
        params
    );

    // Issues count
    const issues = await pool.query(
        `SELECT
       COUNT(*) AS total_issues,
       COUNT(*) FILTER (WHERE severity = 'high' OR severity = 'critical') AS severe_issues
     FROM driver_issues WHERE driver_id = $1`,
        [id]
    );

    // Monthly trip trends
    const trends = await pool.query(
        `SELECT
       TO_CHAR(start_date, 'YYYY-MM') AS month,
       COUNT(*) AS trips,
       COUNT(*) FILTER (WHERE is_late = true) AS late_trips
     FROM trips WHERE driver_id = $1 AND start_date IS NOT NULL
     GROUP BY TO_CHAR(start_date, 'YYYY-MM')
     ORDER BY month`,
        [id]
    );

    // Trip history
    const tripHistory = await pool.query(
        `SELECT id, start_date AS date, origin, destination, status, distance_km, is_late
     FROM trips WHERE driver_id = $1 ORDER BY start_date DESC LIMIT 50`,
        [id]
    );

    const s = stats.rows[0];
    const totalTrips = parseInt(s.total_trips) || 0;
    const completedTrips = parseInt(s.completed_trips) || 0;
    const ontimeTrips = parseInt(s.ontime_trips) || 0;
    const totalIssues = parseInt(issues.rows[0].total_issues) || 0;
    const severeIssues = parseInt(issues.rows[0].severe_issues) || 0;

    const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
    const ontimeRate = completedTrips > 0 ? Math.round((ontimeTrips / completedTrips) * 100) : 0;

    // Safety score: base 100, -5 per issue, -15 per severe issue, +bonus for ontime
    let safetyScore = 100 - (totalIssues * 5) - (severeIssues * 10) + Math.round(ontimeRate * 0.1);
    safetyScore = Math.max(0, Math.min(100, safetyScore));

    return {
        totalTrips,
        completedTrips,
        ontimeTrips,
        lateTrips: parseInt(s.late_trips) || 0,
        totalDistance: parseFloat(s.total_distance) || 0,
        completionRate,
        ontimeRate,
        safetyScore,
        totalIssues,
        severeIssues,
        trends: trends.rows,
        tripHistory: tripHistory.rows,
    };
};

module.exports = { getAll, getById, create, update, updateStatus, remove, getPerformance };
