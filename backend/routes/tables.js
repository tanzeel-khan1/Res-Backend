const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");
const {
  getTables,
  getTableById,
  getTablesByUserId,
  createTable,
  updateTable,
  deleteTable,
  cancelReservation,
  reserveTable,
} = require("../Controllers/tableController");

// Specific routes first
router.get("/user/:userId", protect, getTablesByUserId);

// General routes last
router.get("/", protect, getTables);
router.get("/:id", protect, getTableById);
router.post("/", protect, createTable);
router.post("/reserve", protect,reserveTable);

router.put("/:id", protect, updateTable);
router.delete("/:id", protect, deleteTable);
router.delete("/cancel/:id", protect, cancelReservation);

module.exports = router;
