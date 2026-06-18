require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const { ensureSchema } = require("./utils/schema");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim());

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Not allowed by CORS"));
    },
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("CareerLink API Running");
});

async function startServer() {
    await new Promise((resolve, reject) => {
        db.connect((err) => err ? reject(err) : resolve());
    });
    console.log("Database connected successfully");
    await ensureSchema(db);
    console.log("Database schema ready");
    return app.listen(port, () => console.log(`Server running on port ${port}`));
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error("Server startup failed", error);
        process.exitCode = 1;
    });
}

module.exports = { app, startServer };

app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
});
