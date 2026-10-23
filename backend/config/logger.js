const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },
});

module.exports = logger;
