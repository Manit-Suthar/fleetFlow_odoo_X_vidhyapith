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
  res.json({ message: "FleetFlow API is running 🚀" });
});

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/dashboard", require("./src/routes/dashboardRoutes"));

// Future routes (teammates will tell you what to add)
// app.use("/api/vehicles", require("./src/routes/vehicleRoutes"));
// app.use("/api/trips", require("./src/routes/tripRoutes"));
// app.use("/api/drivers", require("./src/routes/driverRoutes"));
// app.use("/api/invoices", require("./src/routes/invoiceRoutes"));
// app.use("/api/expenses", require("./src/routes/expenseRoutes"));
// app.use("/api/maintenance", require("./src/routes/maintenanceRoutes"));
// app.use("/api/reports", require("./src/routes/reportRoutes"));
// app.use("/api/settings", require("./src/routes/settingsRoutes"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
