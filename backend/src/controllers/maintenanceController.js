const pool = require("../config/db");

// GET /api/maintenance — all maintenance logs
exports.getAll = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM maintenance_logs ORDER BY id DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching maintenance:", err);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/maintenance/vehicles — list vehicles for dropdown
exports.getVehicles = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, vehicle_name, status FROM vehicles ORDER BY id"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching vehicles:", err);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/maintenance — create
exports.create = async (req, res) => {
    const { vehicle_id, service_type, description, cost, service_date, next_service } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, service_date, next_service, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled') RETURNING *`,
            [vehicle_id, service_type, description, cost, service_date || null, next_service || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating maintenance:", err);
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/maintenance/:id — update
exports.update = async (req, res) => {
    const { id } = req.params;
    const { vehicle_id, service_type, description, cost, service_date, next_service } = req.body;
    try {
        const result = await pool.query(
            `UPDATE maintenance_logs 
       SET vehicle_id=$1, service_type=$2, description=$3, cost=$4, service_date=$5, next_service=$6
       WHERE id=$7 RETURNING *`,
            [vehicle_id, service_type, description, cost, service_date || null, next_service || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating maintenance:", err);
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/maintenance/:id
exports.remove = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM maintenance_logs WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting maintenance:", err);
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/maintenance/:id/status
exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const completedDate = status === "Completed" ? new Date().toISOString() : null;
        const result = await pool.query(
            `UPDATE maintenance_logs SET status=$1, completed_date=$2 WHERE id=$3 RETURNING *`,
            [status, completedDate, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating status:", err);
        res.status(500).json({ error: err.message });
    }
};
