const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "FleetFlow API is running 🚀" });
});

// Import routes here
// app.use("/api/auth", require("./src/routes/auth"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
