const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoose = require("mongoose");

const pinoHttp = require("pino-http");
const logger = require("./config/logger");

const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const dashboardRoutes = require("./routes/dashboardRoutes");
const validateOrigin = require("./middleware/validateOrigin");
const path = require("path");

const app = express();

app.use(
  pinoHttp({
    logger,
    autoLogging: process.env.NODE_ENV !== "test",
  }),
);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(express.json());
app.use(cookieParser());

const isLocalHttp = CLIENT_URL.startsWith("http://localhost:");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: isLocalHttp ? null : [],
      },
    },
    strictTransportSecurity: isLocalHttp ? false : undefined,
  }),
);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(validateOrigin);

app.use("/api/projects", projectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Serve React production files
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(frontendPath));

  // Return React app for frontend routes
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res, next) => {
    if (!req.accepts("html")) return next();

    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.get("/", (req, res) => {
  res.json({ message: "Opsentra API is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.get("/api/ready", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ready" : "not_ready",
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
