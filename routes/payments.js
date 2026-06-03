const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");
const {
  createCheckoutSession,
  verifyCheckoutSession,
} = require("../Controllers/paymentController");

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/verify-session/:sessionId", protect, verifyCheckoutSession);

module.exports = router;
