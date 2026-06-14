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
app.use("/uploads", express.static("uploads"));

db.connect((err) => {
    if (err) {
        console.log("Database connection failed");
        console.log(err);
    } else {
        console.log("Database connected successfully");
        ensureSchema(db)
            .then(() => console.log("Database schema ready"))
            .catch((schemaErr) => {
                console.log("Database schema setup failed");
                console.log(schemaErr);
            });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
    res.send("CareerLink API Running");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
