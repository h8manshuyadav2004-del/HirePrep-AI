const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const { searchJobsController } = require("../controllers/job.controller");

const createAdaptiveRateLimiter = require("../config/adaptiveRateLimiter");

const router = express.Router();

// --- Define the Job API Rate Limiter ---
const jobRateLimiter = createAdaptiveRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Allow 20 searches per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false, default: false },

    message: { 
        message: "You are searching too fast! Please wait a few minutes before trying again." 
    }
});

/**
 * @route GET /api/jobs/search?location=London&title=Software%20Engineer
 * @description search for jobs
 * @access private
 */

// 🔒 Apply the authentication AND the rate limiter
router.get("/search", authUser, jobRateLimiter, searchJobsController);

module.exports = router;
