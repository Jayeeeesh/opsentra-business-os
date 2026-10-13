const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const validateRequest = require("../middleware/validateRequest");
const { registerSchema, loginSchema } = require("../validation/authValidation");

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  registerUser,
);

router.post("/login", authLimiter, validateRequest(loginSchema), loginUser);
router.get("/me", protect, getCurrentUser);
router.post("/logout", logoutUser);
module.exports = router;
