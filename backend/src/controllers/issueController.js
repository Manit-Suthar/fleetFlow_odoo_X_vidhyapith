const issueModel = require("../models/issueModel");

// GET /api/issues
const getAllIssues = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            severity: req.query.severity,
            type: req.query.type,
            driver_id: req.query.driver_id,
        };
        const issues = await issueModel.getAll(filters);
        res.json(issues);
    } catch (err) {
        console.error("Error fetching issues:", err);
        res.status(500).json({ error: "Failed to fetch issues" });
    }
};

// POST /api/issues
const createIssue = async (req, res) => {
    try {
        const { driver_id, issue_type, severity, occurred_at, description } = req.body;
        if (!driver_id || !issue_type || !severity || !occurred_at || !description) {
            return res.status(400).json({ error: "Driver, type, severity, date, and description are required" });
        }
        const issue = await issueModel.create(req.body);
        res.status(201).json(issue);
    } catch (err) {
        console.error("Error creating issue:", err);
        res.status(500).json({ error: "Failed to create issue" });
    }
};

// PATCH /api/issues/:id/status
const updateIssueStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: "Status is required" });
        const issue = await issueModel.updateStatus(req.params.id, status);
        if (!issue) return res.status(404).json({ error: "Issue not found" });
        res.json(issue);
    } catch (err) {
        console.error("Error updating issue:", err);
        res.status(500).json({ error: "Failed to update issue status" });
    }
};

// DELETE /api/issues/:id
const deleteIssue = async (req, res) => {
    try {
        await issueModel.remove(req.params.id);
        res.json({ message: "Issue deleted" });
    } catch (err) {
        console.error("Error deleting issue:", err);
        res.status(500).json({ error: "Failed to delete issue" });
    }
};

module.exports = { getAllIssues, createIssue, updateIssueStatus, deleteIssue };
