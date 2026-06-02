
const Table = require("../models/Table");
const mongoose = require("mongoose");
const Order = require("../models/Order"); 
const Reservation = require("../models/Reservation");

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { number, capacity, category, price,hours } = req.body;

    const table = await Table.create({
      number,
      capacity,
      category,
      price, // 🔥 IMPORTANT
      hours,
      status: "available",
    });

    res.status(201).json({
      success: true,
      table,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.reserveTable = async (req, res) => {
  try {
    const { tableId, startTime, duration } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    if (table.status === "occupied") {
      return res.status(400).json({
        success: false,
        message: "Table already reserved",
      });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    // 🔥 SAVE EVERYTHING ON TABLE
    table.userId = req.user._id;
    table.startTime = start;
    table.endTime = end;
    table.reservationDate = start; // order will use this
    table.status = "occupied";

    await table.save();

    res.status(200).json({
      success: true,
      message: "Table reserved successfully",
      table,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.markTableAvailable = async (req, res) => {
  const { tableId } = req.params;

  await Reservation.updateMany(
    { tableId, status: "active" },
    { status: "completed" }
  );

  await Table.findByIdAndUpdate(tableId, {
    status: "available",
  });

  res.json({
    success: true,
    message: "Table is now available",
  });
};


exports.updateTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    const { number, capacity, status, paymentStatus } = req.body;
    table.number = number ?? table.number;
    table.capacity = capacity ?? table.capacity;
    table.status = status ?? table.status;
    table.paymentStatus = paymentStatus ?? table.paymentStatus;

    const updatedTable = await table.save();
    res.json(updatedTable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    await table.deleteOne();
    res.json({ message: "Table removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTablesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const tables = await Table.find({ userId });

    if (tables.length === 0) {
      return res.status(200).json({
        success: true,
        tables: [],
        message: "No tables found for this user",
      });
    }

    res.status(200).json({
      success: true,
      tables,
    });

  } catch (err) {
    console.error("Error in getTablesByUserId:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Cancel pending reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findById(id);

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (table.status === "reserved" && table.paymentStatus === "paid") {
      return res.status(400).json({ 
        message: "Cannot cancel confirmed reservation. Please contact support." 
      });
    }

    await Table.findByIdAndDelete(id);
    res.json({ 
      success: true,
      message: "Reservation cancelled successfully" 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


