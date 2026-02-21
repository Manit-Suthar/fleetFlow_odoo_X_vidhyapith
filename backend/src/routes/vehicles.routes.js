const express = require("express");
const vehiclesController = require("../controllers/vehicles.controller");

const router = express.Router();

router.get("/", vehiclesController.getVehicles);
router.get("/:id", vehiclesController.getVehicleById);
router.post("/", vehiclesController.createVehicle);
router.put("/:id", vehiclesController.updateVehicle);
router.patch("/:id/status", vehiclesController.updateVehicleStatus);

module.exports = router;
