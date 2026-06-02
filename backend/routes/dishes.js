const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
} = require("../controllers/dishController");

router.get("/", protect, getDishes);
router.get("/:id", protect, getDishById);
router.post("/", protect, createDish);
router.put("/:id", protect, updateDish);
router.delete("/:id", protect, deleteDish);

module.exports = router;
