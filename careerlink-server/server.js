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

app.use(cors());
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

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
