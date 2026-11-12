const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const validateOrigin = (req, res, next) => {
  if (!unsafeMethods.has(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  // Requests without Origin need separate security handling.
  if (!origin) {
    // Block login requests without a trusted Origin.
    if (req.method === "POST" && req.path === "/api/auth/login") {
      return res.status(403).json({
        message: "Request origin required",
      });
    }
    const fetchSite = req.get("Sec-Fetch-Site");

    if (fetchSite === "cross-site") {
      return res.status(403).json({
        message: "Cross-site request blocked",
      });
    }

    if (req.cookies?.token) {
      return res.status(403).json({
        message: "Request origin required",
      });
    }

    return next();
  }

  const allowedOrigin = new URL(
    process.env.CLIENT_URL || "http://localhost:5173",
  ).origin;

  if (origin !== allowedOrigin) {
    return res.status(403).json({
      message: "Untrusted request origin",
    });
  }

  next();
};

module.exports = validateOrigin;
