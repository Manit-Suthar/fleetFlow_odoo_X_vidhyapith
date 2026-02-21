const pool = require("../config/db");

// Summary KPIs
const getSummary = async (from, to) => {
    const result = await pool.query(
        `SELECT
       COALESCE(SUM(t.estimated_cost), 0) AS total_revenue,
       COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE date BETWEEN $1 AND $2), 0) AS total_fuel_cost,
       COALESCE((SELECT SUM(cost) FROM service_logs WHERE date BETWEEN $1 AND $2), 0) AS total_maintenance_cost,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date BETWEEN $1 AND $2), 0) AS total_expenses,
       (SELECT COUNT(*) FROM vehicles) AS total_vehicles,
       (SELECT COUNT(DISTINCT vehicle_id) FROM trips WHERE start_date BETWEEN $1 AND $2) AS active_vehicles
     FROM trips t
     WHERE t.start_date BETWEEN $1 AND $2 AND t.status = 'completed'`,
        [from, to]
    );
    return result.rows[0];
};

// Revenue trend by month
const getRevenueTrend = async (from, to) => {
    const result = await pool.query(
        `SELECT TO_CHAR(start_date, 'YYYY-MM') AS month,
            SUM(estimated_cost) AS revenue
     FROM trips
     WHERE start_date BETWEEN $1 AND $2 AND status = 'completed'
     GROUP BY TO_CHAR(start_date, 'YYYY-MM')
     ORDER BY month`,
        [from, to]
    );
    return result.rows;
};

// Fuel cost trend by month
const getFuelTrend = async (from, to) => {
    const result = await pool.query(
        `SELECT TO_CHAR(date, 'YYYY-MM') AS month,
            SUM(cost) AS fuel_cost,
            SUM(liters) AS total_liters
     FROM fuel_logs
     WHERE date BETWEEN $1 AND $2
     GROUP BY TO_CHAR(date, 'YYYY-MM')
     ORDER BY month`,
        [from, to]
    );
    return result.rows;
};

// Expense breakdown
const getExpenseBreakdown = async (from, to) => {
    const result = await pool.query(
        `SELECT category, SUM(amount) AS total
     FROM expenses
     WHERE expense_date BETWEEN $1 AND $2
     GROUP BY category
     ORDER BY total DESC`,
        [from, to]
    );
    return result.rows;
};

// Top 5 costliest vehicles
const getTopVehicles = async (from, to) => {
    const result = await pool.query(
        `SELECT v.id, v.vehicle_name, v.license_plate,
            COALESCE(f.fuel_total, 0) AS fuel_cost,
            COALESCE(s.service_total, 0) AS maintenance_cost,
            COALESCE(f.fuel_total, 0) + COALESCE(s.service_total, 0) AS total_cost
     FROM vehicles v
     LEFT JOIN (
       SELECT vehicle_id, SUM(cost) AS fuel_total FROM fuel_logs WHERE date BETWEEN $1 AND $2 GROUP BY vehicle_id
     ) f ON f.vehicle_id = v.id
     LEFT JOIN (
       SELECT vehicle_id, SUM(cost) AS service_total FROM service_logs WHERE date BETWEEN $1 AND $2 GROUP BY vehicle_id
     ) s ON s.vehicle_id = v.id
     ORDER BY total_cost DESC
     LIMIT 5`,
        [from, to]
    );
    return result.rows;
};

// Monthly profit (revenue - fuel - maintenance - expenses)
const getMonthlyProfit = async (from, to) => {
    const result = await pool.query(
        `SELECT m.month,
            COALESCE(r.revenue, 0) AS revenue,
            COALESCE(f.fuel, 0) AS fuel,
            COALESCE(s.maintenance, 0) AS maintenance,
            COALESCE(e.expenses, 0) AS other_expenses,
            COALESCE(r.revenue, 0) - COALESCE(f.fuel, 0) - COALESCE(s.maintenance, 0) - COALESCE(e.expenses, 0) AS net_profit
     FROM (
       SELECT DISTINCT TO_CHAR(d, 'YYYY-MM') AS month
       FROM generate_series($1::date, $2::date, '1 month') d
     ) m
     LEFT JOIN (
       SELECT TO_CHAR(start_date, 'YYYY-MM') AS month, SUM(estimated_cost) AS revenue
       FROM trips WHERE status='completed' GROUP BY 1
     ) r ON r.month = m.month
     LEFT JOIN (
       SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(cost) AS fuel FROM fuel_logs GROUP BY 1
     ) f ON f.month = m.month
     LEFT JOIN (
       SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(cost) AS maintenance FROM service_logs GROUP BY 1
     ) s ON s.month = m.month
     LEFT JOIN (
       SELECT TO_CHAR(expense_date, 'YYYY-MM') AS month, SUM(amount) AS expenses FROM expenses GROUP BY 1
     ) e ON e.month = m.month
     ORDER BY m.month`,
        [from, to]
    );
    return result.rows;
};

// Fleet utilization
const getUtilization = async (from, to) => {
    const total = await pool.query("SELECT COUNT(*) AS count FROM vehicles");
    const active = await pool.query(
        `SELECT COUNT(DISTINCT vehicle_id) AS count
     FROM trips WHERE start_date BETWEEN $1 AND $2`,
        [from, to]
    );
    const totalCount = parseInt(total.rows[0].count) || 1;
    const activeCount = parseInt(active.rows[0].count) || 0;
    return {
        total_vehicles: totalCount,
        active_vehicles: activeCount,
        utilization_rate: Math.round((activeCount / totalCount) * 100),
    };
};

module.exports = {
    getSummary,
    getRevenueTrend,
    getFuelTrend,
    getExpenseBreakdown,
    getTopVehicles,
    getMonthlyProfit,
    getUtilization,
};
