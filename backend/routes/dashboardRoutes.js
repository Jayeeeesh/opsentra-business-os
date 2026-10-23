const express = require("express");
const protect = require("../middleware/authMiddleware");

const { getDashboardSummary } = require("../controllers/dashboardController");

const router = express.Router();

router.use(protect);

router.get("/summary", getDashboardSummary);

module.exports = router;
