const pool = require("../config/db");

// Get all issues with filters
const getAll = async (filters = {}) => {
    let query = `
    SELECT di.*, d.name AS driver_name
    FROM driver_issues di
    JOIN drivers d ON d.id = di.driver_id
    WHERE 1=1
  `;
    const params = [];

    if (filters.status && filters.status !== "all") {
        params.push(filters.status);
        query += ` AND di.status = $${params.length}`;
    }
    if (filters.severity && filters.severity !== "all") {
        params.push(filters.severity);
        query += ` AND di.severity = $${params.length}`;
    }
    if (filters.type && filters.type !== "all") {
        params.push(filters.type);
        query += ` AND di.issue_type = $${params.length}`;
    }
    if (filters.driver_id) {
        params.push(filters.driver_id);
        query += ` AND di.driver_id = $${params.length}`;
    }

    query += ` ORDER BY di.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

// Create issue
const create = async (data) => {
    const { driver_id, trip_id, issue_type, severity, occurred_at, location, description, attachment_url, status } = data;
    const result = await pool.query(
        `INSERT INTO driver_issues (driver_id, trip_id, issue_type, severity, occurred_at, location, description, attachment_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [driver_id, trip_id || null, issue_type, severity, occurred_at, location || null, description, attachment_url || null, status || "open"]
    );
    return result.rows[0];
};

// Update issue status
const updateStatus = async (id, status) => {
    const result = await pool.query(
        `UPDATE driver_issues SET status=$1 WHERE id=$2 RETURNING *`,
        [status, id]
    );
    return result.rows[0];
};

// Delete issue
const remove = async (id) => {
    await pool.query("DELETE FROM driver_issues WHERE id=$1", [id]);
};

module.exports = { getAll, create, updateStatus, remove };
