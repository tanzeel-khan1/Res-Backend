import express from "express";
import {
  addRestaurantReview,
  getAllRestaurantReviews,
  getReviewsByUser,
  deleteRestaurantReview,
} from "../Controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:orderId", protect, addRestaurantReview);
router.get("/", getAllRestaurantReviews);
router.get("/my", protect, getReviewsByUser);
router.delete("/:reviewId", protect, deleteRestaurantReview);

export default router;
