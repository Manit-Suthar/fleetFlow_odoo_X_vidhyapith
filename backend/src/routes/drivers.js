const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/driverController");

router.get("/", ctrl.getAllDrivers);
router.get("/:id", ctrl.getDriver);
router.post("/", ctrl.createDriver);
router.put("/:id", ctrl.updateDriver);
router.patch("/:id/status", ctrl.updateDriverStatus);
router.delete("/:id", ctrl.deleteDriver);
router.get("/:id/performance", ctrl.getPerformance);

module.exports = router;
