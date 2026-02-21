const driverModel = require("../models/driverModel");
const issueModel = require("../models/issueModel");

// GET /api/drivers
const getAllDrivers = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            search: req.query.search,
            license: req.query.license,
        };
        const drivers = await driverModel.getAll(filters);

        // Compute performance metrics for each driver
        const enriched = drivers.map((d) => {
            const totalTrips = parseInt(d.trip_count) || 0;
            const completedTrips = parseInt(d.completed_trips) || 0;
            const ontimeTrips = parseInt(d.ontime_trips) || 0;
            const issueCount = parseInt(d.issue_count) || 0;
            const violationCount = parseInt(d.violation_count) || 0;

            const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
            const ontimeRate = completedTrips > 0 ? Math.round((ontimeTrips / completedTrips) * 100) : 0;
            let safetyScore = 100 - (issueCount * 5) - (violationCount * 10) + Math.round(ontimeRate * 0.1);
            safetyScore = Math.max(0, Math.min(100, safetyScore));

            return {
                ...d,
                total_trips: totalTrips,
                completed_trips: completedTrips,
                completion_rate: completionRate,
                ontime_rate: ontimeRate,
                safety_score: safetyScore,
                issue_count: issueCount,
                violation_count: violationCount,
            };
        });

        res.json(enriched);
    } catch (err) {
        console.error("Error fetching drivers:", err);
        res.status(500).json({ error: "Failed to fetch drivers" });
    }
};

// GET /api/drivers/:id
const getDriver = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid driver ID" });

        const driver = await driverModel.getById(id);
        if (!driver) return res.status(404).json({ error: "Driver not found" });

        // Fetch performance metrics and issues
        const [perf, issues] = await Promise.all([
            driverModel.getPerformance(id),
            issueModel.getAll({ driver_id: id })
        ]);

        // Consolidated object with normalization and defensive defaults
        const consolidated = {
            ...driver,
            total_trips: parseInt(perf.totalTrips) || 0,
            completion_rate: parseInt(perf.completionRate) || 0,
            ontime_rate: parseInt(perf.ontimeRate) || 0,
            safety_score: parseInt(perf.safetyScore) || 0,
            issue_count: parseInt(perf.totalIssues) || 0,
            late_count: parseInt(perf.lateTrips) || 0,

            monthly_trips: (perf.trends || []).map(t => ({
                month: t.month || 'N/A',
                count: parseInt(t.trips) || 0
            })),
            monthly_late: (perf.trends || []).map(t => ({
                month: t.month || 'N/A',
                count: parseInt(t.late_trips) || 0
            })),
            trips: (perf.tripHistory || []).map(t => ({
                id: t.id,
                start_date: t.date,
                origin: t.origin,
                destination: t.destination,
                status: t.status,
                distance_km: t.distance_km,
                is_late: t.is_late
            })),
            issues: issues || []
        };

        res.json(consolidated);
    } catch (err) {
        console.error("Error in getDriver controller:", err);
        res.status(500).json({ error: "Failed to fetch consolidated driver data" });
    }
};

// POST /api/drivers
const createDriver = async (req, res) => {
    try {
        const { name, phone, license_number, license_expiry } = req.body;
        if (!name || !license_number) {
            return res.status(400).json({ error: "Name and license number are required" });
        }
        const driver = await driverModel.create(req.body);
        res.status(201).json(driver);
    } catch (err) {
        console.error("Error creating driver:", err);
        if (err.code === "23505") {
            return res.status(409).json({ error: "License number already exists" });
        }
        res.status(500).json({ error: "Failed to create driver" });
    }
};

// PUT /api/drivers/:id
const updateDriver = async (req, res) => {
    try {
        const driver = await driverModel.update(req.params.id, req.body);
        if (!driver) return res.status(404).json({ error: "Driver not found" });
        res.json(driver);
    } catch (err) {
        console.error("Error updating driver:", err);
        res.status(500).json({ error: "Failed to update driver" });
    }
};

// PATCH /api/drivers/:id/status
const updateDriverStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: "Status is required" });
        const driver = await driverModel.updateStatus(req.params.id, status);
        if (!driver) return res.status(404).json({ error: "Driver not found" });
        res.json(driver);
    } catch (err) {
        console.error("Error updating driver status:", err);
        res.status(500).json({ error: "Failed to update status" });
    }
};

// DELETE /api/drivers/:id
const deleteDriver = async (req, res) => {
    try {
        await driverModel.remove(req.params.id);
        res.json({ message: "Driver deleted" });
    } catch (err) {
        console.error("Error deleting driver:", err);
        res.status(500).json({ error: "Failed to delete driver" });
    }
};

// GET /api/drivers/:id/performance
const getPerformance = async (req, res) => {
    try {
        const { from, to } = req.query;
        const perf = await driverModel.getPerformance(req.params.id, from, to);
        res.json(perf);
    } catch (err) {
        console.error("Error fetching performance:", err);
        res.status(500).json({ error: "Failed to fetch performance" });
    }
};

module.exports = {
    getAllDrivers,
    getDriver,
    createDriver,
    updateDriver,
    updateDriverStatus,
    deleteDriver,
    getPerformance,
};
