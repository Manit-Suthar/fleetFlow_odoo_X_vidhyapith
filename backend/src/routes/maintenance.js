const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/maintenanceController");

router.get("/", ctrl.getAll);
router.get("/vehicles", ctrl.getVehicles);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.patch("/:id/status", ctrl.updateStatus);

module.exports = router;
