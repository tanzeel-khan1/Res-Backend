const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },

    dishes: [
      {
        dish: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },

    orderDate: {
      type: Date,
      required: true,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, 
  },
);

orderSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed") {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
