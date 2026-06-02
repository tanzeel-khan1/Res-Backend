const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");

const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  getOrdersByUserID,
  deleteOrder,
  markOrderAsCompleted,
  getIncompleteOrders,
  getOrdersByUserName,
  getOrdersByUserNameAndDate,
} = require("../Controllers/orderController");

router.get("/incomplete", protect, getIncompleteOrders);
router.put("/complete/:id", protect, markOrderAsCompleted);

router.get("/", protect, getOrders);
router.post("/", protect, createOrder);
router.post("/getname", getOrdersByUserNameAndDate);

router.get("/user/:userId", protect, getOrdersByUserID);
router.get("/by-id/:id", protect, getOrderById);
router.get("/by-username/:name", getOrdersByUserName);

router.put("/:id", protect, updateOrder);
router.delete("/:id", protect, deleteOrder);

module.exports = router;
