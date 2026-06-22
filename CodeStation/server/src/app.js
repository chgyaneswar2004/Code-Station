const express = require("express");
const cors = require("cors");
const { securityHeaders } = require("./middleware/security.middleware");
const routes = require("./routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Apply security headers
app.use(securityHeaders);

// Parse JSON request bodies
app.use(express.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Mount central routing system
app.use("/", routes);

// Centralized error handling middleware must be attached last
app.use(errorHandler);

module.exports = app;
