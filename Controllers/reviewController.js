import RestaurantReview from "../models/Review.js";
import Order from "../models/Order.js";

export const addRestaurantReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.userId) {
      return res.status(400).json({ message: "Order has no user assigned" });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const existingReview = await RestaurantReview.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({
        message: "You already reviewed this order",
      });
    }

    // ✅ USER NAME AUTO PICK
    const userName = req.user.name || req.user.fullName || "Anonymous User";

    const review = await RestaurantReview.create({
      user: req.user._id,
      userName: userName,
      restaurant: order.tableId,
      order: orderId,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllRestaurantReviews = async (req, res) => {
  try {
    const reviews = await RestaurantReview.find(); // populate nahi
    const formattedReviews = reviews.map((r) => ({
      _id: r._id,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
    }));

    res.json(formattedReviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getReviewsByUser = async (req, res) => {
  try {
    const reviews = await RestaurantReview.find({ user: req.user._id })
      .populate("restaurant")
      .populate("order");

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ message: error.message });
  }
};
// DELETE a review
export const deleteRestaurantReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // 1️⃣ Find the review
    const review = await RestaurantReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    
    await RestaurantReview.findByIdAndDelete(reviewId);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: error.message });
  }
};
