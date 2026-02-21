const express = require("express");
const tripsController = require("../controllers/trips.controller");

const router = express.Router();

router.get("/", tripsController.getTrips);
router.post("/", tripsController.createTrip);
router.post("/:id/transition", tripsController.transitionTrip);

module.exports = router;
