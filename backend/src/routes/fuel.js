const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuelController');
const { requireRole } = require('../middleware/roleAuth');

router.post('/', requireRole('admin', 'manager', 'driver'), fuelController.createFuelLog);
router.get('/', fuelController.getFuelLogs);

module.exports = router;
