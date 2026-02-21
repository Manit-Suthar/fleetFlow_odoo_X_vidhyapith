const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/analyticsController");

router.get("/summary", ctrl.getSummary);
router.get("/revenue-trend", ctrl.getRevenueTrend);
router.get("/fuel-trend", ctrl.getFuelTrend);
router.get("/expense-breakdown", ctrl.getExpenseBreakdown);
router.get("/top-vehicles", ctrl.getTopVehicles);
router.get("/monthly-profit", ctrl.getMonthlyProfit);
router.get("/utilization", ctrl.getUtilization);

module.exports = router;
