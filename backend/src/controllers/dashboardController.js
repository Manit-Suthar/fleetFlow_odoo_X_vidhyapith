const pool = require("../config/db");

// GET /api/dashboard/stats
const getStats = async (req, res) => {
    try {
        const [vehicles, drivers, trips, revenue, recentTrips, maintenance] = await Promise.all([
            // Total vehicles + status breakdown
            pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'available') as available,
          COUNT(*) FILTER (WHERE status = 'in-trip') as in_trip,
          COUNT(*) FILTER (WHERE status = 'maintenance') as in_maintenance
        FROM vehicles
      `),

            // Total drivers + status breakdown
            pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'available') as available,
          COUNT(*) FILTER (WHERE status = 'on-trip') as on_trip,
          COUNT(*) FILTER (WHERE status = 'off-duty') as off_duty
        FROM drivers
      `),

            // Trips today + total
            pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE DATE(start_date) = CURRENT_DATE) as today,
          COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM trips
      `),

            // Total revenue from paid invoices
            pool.query(`
        SELECT COALESCE(SUM(total), 0) as total_revenue
        FROM invoices
        WHERE status = 'paid'
      `),

            // Recent 5 trips
            pool.query(`
        SELECT t.id, t.origin, t.destination, t.start_date, t.end_date,
               t.status, t.distance_km,
               v.vehicle_name, v.license_plate,
               d.name as driver_name
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `),

            // Upcoming maintenance
            pool.query(`
        SELECT ml.id, ml.service_type, ml.next_service, ml.cost,
               v.vehicle_name, v.license_plate
        FROM maintenance_logs ml
        JOIN vehicles v ON ml.vehicle_id = v.id
        WHERE ml.next_service >= CURRENT_DATE
        ORDER BY ml.next_service ASC
        LIMIT 5
      `)
        ]);

        res.json({
            vehicles: vehicles.rows[0],
            drivers: drivers.rows[0],
            trips: trips.rows[0],
            revenue: revenue.rows[0],
            recentTrips: recentTrips.rows,
            maintenance: maintenance.rows
        });
    } catch (err) {
        console.error("Dashboard stats error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { getStats };
