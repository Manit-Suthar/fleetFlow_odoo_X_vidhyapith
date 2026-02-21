const analyticsModel = require("../models/analyticsModel");

const getDefaultDates = (query) => {
    const to = query.to || new Date().toISOString().split("T")[0];
    const from = query.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return { from, to };
};

// GET /api/analytics/summary
const getSummary = async (req, res) => {
    try {
        const { from, to } = getDefaultDates(req.query);
        const summary = await analyticsModel.getSummary(from, to);
        const revenue = parseFloat(summary.total_revenue) || 0;
        const fuel = parseFloat(summary.total_fuel_cost) || 0;
        const maintenance = parseFloat(summary.total_maintenance_cost) || 0;
        const expenses = parseFloat(summary.total_expenses) || 0;
        const totalVehicles = parseInt(summary.total_vehicles) || 1;
        const activeVehicles = parseInt(summary.active_vehicles) || 0;

        res.json({
            total_revenue: revenue,
            total_fuel_cost: fuel,
            total_maintenance_cost: maintenance,
            total_expenses: expenses,
            net_profit: revenue - fuel - maintenance - expenses,
            utilization_rate: Math.round((activeVehicles / totalVehicles) * 100),
            fuel_cost_per_km: 0, // could compute if distance data available
        });
    } catch (err) {
        console.error("Error fetching summary:", err);
        res.status(500).json({ error: "Failed to fetch summary" });
    }
};

// GET /api/analytics/revenue-trend
const getRevenueTrend = async (req, res) => {
    try {
        const { from, to } = getDefaultDates(req.query);
        const data = await analyticsModel.getRevenueTrend(from, to);
        res.json(data);
    } catch (err) {
        console.error("Error fetching revenue trend:", err);
        res.status(500).json({ error: "Failed to fetch revenue trend" });
    }
};

// GET /api/analytics/fuel-trend
const getFuelTrend = async (req, res) => {
    try {
        const { from, to } = getDefaultDates(req.query);
        const data = await analyticsModel.getFuelTrend(from, to);
        res.json(data);
    } catch (err) {
        console.error("Error fetching fuel trend:", err);
        res.status(500).json({ error: "Failed to fetch fuel trend" });
    }
};

// GET /api/analytics/expense-breakdown
const getExpenseBreakdown = async (req, res) => {
    try {
        const { from, to } = getDefaultDates(req.query);
        const data = await analyticsModel.getExpenseBreakdown(from, to);
        res.json(data);
    } catch (err) {
        console.error("Error fetching expense breakdown:", err);
        res.status(500).json({ error: "Failed to fetch expense breakdown" });
    }
};

// GET /api/analytics/top-vehicles
const getTopVehicles = async (req, res) => {
    try {
        const { from, to } = getDefaultDates(req.query);
        const data = await analyticsModel.getTopVehicles(from, to);
        res.json(data);
    } catch (err) {
        console.error("Error fetching top vehicles:", err);
        res.status(500).json({ error: "Failed to fetch top vehicles" });
    }
};

// GET /api/analytics/monthly-profit
const getMonthlyProfit = async (req, res) => {
    try {
        const { from, to } = getDefaultDates(req.query);
        const data = await analyticsModel.getMonthlyProfit(from, to);
        res.json(data);
    } catch (err) {
        console.error("Error fetching monthly profit:", err);
        res.status(500).json({ error: "Failed to fetch monthly profit" });
    }
};

// GET /api/analytics/utilization
const getUtilization = async (req, res) => {
    try {
        const { from, to } = getDefaultDates(req.query);
        const data = await analyticsModel.getUtilization(from, to);
        res.json(data);
    } catch (err) {
        console.error("Error fetching utilization:", err);
        res.status(500).json({ error: "Failed to fetch utilization" });
    }
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
