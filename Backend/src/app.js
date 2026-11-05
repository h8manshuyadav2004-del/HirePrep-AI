const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const jobRouter = require("./routes/job.routes");

const app = express();

const allowedOrigins = new Set([
    process.env.FRONTEND_URL,
    "https://hire-prepr-ai.vercel.app",
    "http://localhost:5173"
].filter(Boolean).map((origin) => origin.replace(/\/$/, "")));

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
            return callback(null, true);
        }
        return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
}));

// Use the real client IP behind Render's load balancer.
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/jobs", jobRouter);

// CORS middleware runs before this JSON fallback for unknown paths.
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found." });
});

module.exports = app;
