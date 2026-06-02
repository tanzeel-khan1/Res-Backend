// models/Table.js
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: false
},
    number: {
      type: Number,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: false,
    },
     hours: {
      type: Number,
      required: false,
    },
    time: {
      type: Number,
      required: false,
    },
    category: {
      type: String,
      enum: ["premium", "normal"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["available", "occupied"],
      default: "available",
    },
    reservationDate: {
  type: Date,
  required: false,
}

  },
  { timestamps: true },
);

module.exports = mongoose.model("Table", tableSchema);
