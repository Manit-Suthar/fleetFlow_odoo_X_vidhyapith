const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/issueController");

router.get("/", ctrl.getAllIssues);
router.post("/", ctrl.createIssue);
router.patch("/:id/status", ctrl.updateIssueStatus);
router.delete("/:id", ctrl.deleteIssue);

module.exports = router;
