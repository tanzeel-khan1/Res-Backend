const express = require("express");
const {
  getAllUsers,
  deleteUser,
  updateUser,
} = require("../Controllers/adminController");
const { verifyToken, requireAdmin } = require("../Middleware/verifyAdmin");

const router = express.Router();

router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.delete("/users/:id", verifyToken, requireAdmin, deleteUser);
router.patch("/users/:id", verifyToken, requireAdmin, updateUser);

module.exports = router;
