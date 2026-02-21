const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "FleetFlow API is running" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes - Team shared
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/dashboard", require("./src/routes/dashboardRoutes"));

// Routes - Page 7 & 8 (Manasvi)
app.use("/api/drivers", require("./src/routes/drivers"));
app.use("/api/issues", require("./src/routes/issues"));
app.use("/api/analytics", require("./src/routes/analytics"));

// Routes - Page 3 & 4 (Fenil)
app.use("/api/v1/vehicles", require("./src/routes/vehicles.routes"));
app.use("/api/v1/trips", require("./src/routes/trips.routes"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
