
// Backend/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.js");
const sequelize = require("./config/db.js");
const uploadRoutes = require("./routes/upload.js");
const Job = require("./models/Job.js");
const jobRoutes = require("./routes/jobs.js");
const recruiterRoutes = require("./routes/recruiter.js");
const applicationsRoutes = require("./routes/applications.js");
const adminRoutes = require("./routes/adminRoutes.js");
const studentRoutes = require("./routes/student.js");
const studentApplicationsRoutes = require("./routes/studentApplications.js");
const path = require("path");




dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();


app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

// Serve static files
const frontendPath = path.resolve(__dirname, '../Frontend');

console.log(`Serving Frontend from: ${frontendPath}`);

app.use(express.static(frontendPath)); // Serve Frontend at root

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/student", studentApplicationsRoutes);
app.use("/apply-job", applicationsRoutes);

// Start server after syncing DB
const PORT = process.env.PORT || 5001;
(async () => {
  try {
    await sequelize.sync(); // ✅ Sync database without forcing alterations
    console.log("✅ Database synced successfully.");
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Unable to start server:", err);
  }
})();
