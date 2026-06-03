const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  price: Number,
  description: String,
  image: String,
  available: { type: Boolean, default: true },
});

module.exports = mongoose.model("Dish", dishSchema);
