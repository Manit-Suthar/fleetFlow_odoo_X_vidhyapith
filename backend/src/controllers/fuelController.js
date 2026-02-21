const pool = require("../config/db");

// GET /api/fuel — all fuel logs
exports.getFuelLogs = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM fuel_logs ORDER BY fueled_at DESC NULLS LAST, id DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching fuel logs:", err);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/fuel — create
exports.createFuelLog = async (req, res) => {
    const { vehicle_id, fuel_type, quantity_liters, cost_per_liter, odometer_km, fueled_at } = req.body;
    const total_cost = (Number(quantity_liters) * Number(cost_per_liter)).toFixed(2);
    try {
        const result = await pool.query(
            `INSERT INTO fuel_logs (vehicle_id, fuel_type, quantity_liters, cost_per_liter, total_cost, odometer_km, fueled_at, liters, cost, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $3, $5, COALESCE($7::date, CURRENT_DATE)) RETURNING *`,
            [vehicle_id, fuel_type || 'diesel', quantity_liters, cost_per_liter, total_cost, odometer_km || null, fueled_at || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating fuel log:", err);
        res.status(500).json({ error: err.message });
    }
};
