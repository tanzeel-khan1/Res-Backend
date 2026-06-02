const Order = require("../models/Order");
const Table = require("../models/Table");
const mongoose = require("mongoose");
const User = require("../models/User");
const sendEmail = require("../utils/orderEmail");

/* ======================
   GET ALL ORDERS
====================== */

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("dishes.dish", "name price")
      .populate("userId", "name email")
      .populate("tableId", "price reservationDuration");

    res.status(200).json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   GET ORDER BY ID
====================== */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id)
      .populate("dishes.dish", "name price")
      .populate("tableId", "price reservationDuration");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (err) {
    console.error("Get Order By ID Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   GET ORDERS BY USER ID
====================== */

exports.getOrdersByUserID = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const orders = await Order.find({ userId })
      .populate("dishes.dish", "name price")
      .populate("tableId", "price reservationDuration");

    // ✅ Calculate full bill for each order
    const ordersWithBill = orders.map((order) => {
      // 🍽️ dishes total
      const dishesTotal = order.dishes.reduce((sum, item) => {
        const price = item.dish?.price || 0;
        const qty = item.quantity || item.qty || 1;
        return sum + price * qty;
      }, 0);

      // 🪑 table total
      const tablePrice = order.tableId?.price || 0;
      const duration = order.tableId?.reservationDuration || 0;
      const tableTotal = tablePrice * duration;

      const grandTotal = dishesTotal + tableTotal;

      return {
        ...order.toObject(),
        bill: {
          dishesTotal,
          tableTotal,
          grandTotal,
        },
      };
    });

    res.status(200).json({
      success: true,
      orders: ordersWithBill,
    });
  } catch (err) {
    console.error("Get Orders By User Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ======================
   CREATE ORDER
====================== */

// exports.createOrder = async (req, res) => {
//   try {
//     const { dishes, totalPrice, tableId, orderDate } = req.body; // orderDate added
//     const userId = req.user?._id;

//     // 🔐 Auth check
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     // 🔴 Validation
//     if (!tableId || !Array.isArray(dishes) || dishes.length === 0 || !totalPrice || !orderDate) {
//       return res.status(400).json({ success: false, message: "Table, dishes, total price and order date are required" });
//     }

//     const user = await User.findById(userId).select("name email");
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     const table = await Table.findById(tableId);
//     if (!table) return res.status(404).json({ success: false, message: "Table not found" });

//     // 🔒 Table belongs to user (if reserved)
//     if (table.userId && table.userId.toString() !== userId.toString()) {
//       return res.status(403).json({ success: false, message: "This table does not belong to you" });
//     }

//     const selectedDate = new Date(orderDate);

//     // 🛑 Duplicate check (pending order for same table & date-time)
//     const existingPendingOrder = await Order.findOne({
//       userId,
//       tableId,
//       orderDate: selectedDate,
//       status: "pending",
//     });

//     if (existingPendingOrder) {
//       return res.status(400).json({ success: false, message: "You already have a pending order for this date & time" });
//     }

//     // ✅ Create order
//     const order = await Order.create({
//       userId,
//       dishes,
//       totalPrice,
//       tableId,
//       orderDate: selectedDate,
//       status: "pending",
//     });

//     // 🔒 Mark table as occupied
//     table.status = "occupied";
//     await table.save();

//     const tablePrice = table.price || 0;
//     const grandTotal = totalPrice + tablePrice;

//     // Send email
//     await sendEmail({
//       to: user.email,
//       subject: "Order Confirmation – Please Arrive on Time",
//       html: `
//         <h2>Hello ${user.name},</h2>
//         <p>Your order has been placed successfully for <strong>${selectedDate.toLocaleString("en-CA", { timeZone: "Asia/Karachi" })}</strong></p>
//         <p><strong>Order ID:</strong> ${order._id}</p>
//         <p><strong>Table Number:</strong> ${table.number}</p>
//         <p><strong>Table Price:</strong> Rs. ${tablePrice}</p>
//         <p><strong>Food Total:</strong> Rs. ${totalPrice}</p>
//         <p><strong>Grand Total:</strong> Rs. ${grandTotal}</p>
//         <p>Please arrive on time 🍽️</p>
//       `,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Order placed successfully",
//       order,
//     });
//   } catch (err) {
//     console.error("Create Order Error:", err);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
exports.createOrder = async (req, res) => {
  try {
    const { dishes, totalPrice, tableId, orderDate } = req.body;
    const userId = req.user?._id;

    // 🔐 Auth check
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 🔴 Validation
    if (
      !tableId ||
      !Array.isArray(dishes) ||
      dishes.length === 0 ||
      !totalPrice ||
      !orderDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Table, dishes, total price and order date are required",
      });
    }

    // 📅 Selected order date (FIX)
    const selectedDate = new Date(orderDate);

    // 🔁 Start & End of TODAY (one order per real day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 🛑 Check: user already placed order today
    const existingOrderToday = await Order.findOne({
      userId,
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    if (existingOrderToday) {
      return res.status(400).json({
        success: false,
        message: "You can place only one order per day",
      });
    }

    // 👤 User check
    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🍽️ Table check
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    // 🔒 Table ownership check
    if (table.userId && table.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "This table does not belong to you",
      });
    }

    // 🛑 Duplicate pending order (same table + same time)
    const existingPendingOrder = await Order.findOne({
      userId,
      tableId,
      orderDate: selectedDate,
      status: "pending",
    });

    if (existingPendingOrder) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending order for this date & time",
      });
    }

    // ✅ Create order
    const order = await Order.create({
      userId,
      dishes,
      totalPrice,
      tableId,
      orderDate: selectedDate,
      status: "pending",
    });

    // 🔒 Mark table as occupied
    table.status = "occupied";
    await table.save();

    const tablePrice = table.price || 0;
    const grandTotal = totalPrice + tablePrice;

    // 📧 Send email (do not fail order if mail service has issues)
    try {
      await sendEmail({
        to: user.email,
        subject: "Order Confirmation – Please Arrive on Time",
        html: `
          <h2>Hello ${user.name},</h2>
          <p>Your order has been placed successfully for 
          <strong>${selectedDate.toLocaleString("en-CA", {
            timeZone: "Asia/Karachi",
          })}</strong></p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Table Number:</strong> ${table.number}</p>
          <p><strong>Table Price:</strong> Rs. ${tablePrice}</p>
          <p><strong>Food Total:</strong> Rs. ${totalPrice}</p>
          <p><strong>Grand Total:</strong> Rs. ${grandTotal}</p>
          <p>Please arrive on time 🍽️</p>
        `,
      });
    } catch (mailErr) {
      console.error("Order email failed:", mailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


/* ======================
   UPDATE ORDER
====================== */
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { dishes, totalPrice } = req.body;
    if (dishes) order.dishes = dishes;
    if (totalPrice) order.totalPrice = totalPrice;

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error("Update Order Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   DELETE ORDER
====================== */
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.deleteOne();
    res.status(200).json({ message: "Order removed" });
  } catch (err) {
    console.error("Delete Order Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   MARK ORDER COMPLETED
====================== */

exports.markOrderAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Order find
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 🔹 Already completed?
    if (order.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Order already completed",
      });
    }

    // 🔹 Mark order completed
    order.status = "completed";
    order.completedAt = new Date(); // (optional but recommended)
    await order.save();

    // 🔹 Release table
    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: "available",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order completed & table is now available",
      order,
    });
  } catch (err) {
    console.error("Mark Order Completed Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ======================
   GET INCOMPLETE ORDERS
====================== */
exports.getIncompleteOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $ne: "completed" },
    })
      .populate("dishes.dish", "name price")
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error("Get Incomplete Orders Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getOrdersByUserName = async (req, res) => {
  try {
    const { name } = req.params;

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 }) // ✅ latest first
      .populate("dishes.dish", "name price")
      .populate("tableId", "price reservationDuration");

    const ordersWithBill = orders.map((order) => {
      const dishesTotal = order.dishes.reduce((sum, item) => {
        const price = item.dish?.price || 0;
        const qty = item.quantity || 1;
        return sum + price * qty;
      }, 0);

      const tableTotal =
        (order.tableId?.price || 0) * (order.tableId?.reservationDuration || 0);

      return {
        ...order.toObject(),

        // ✅ Date fields
        orderDate: order.createdAt.toISOString().split("T")[0], // 2026-01-16
        orderTime: order.createdAt.toLocaleTimeString(), // 8:05 PM
        completedAt: order.completedAt || null,

        bill: {
          dishesTotal,
          tableTotal,
          grandTotal: dishesTotal + tableTotal,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: ordersWithBill.length,
      orders: ordersWithBill,
    });
  } catch (err) {
    console.error("Get Orders By Username Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getOrdersByUserNameAndDate = async (req, res) => {
  try {
    const { name, date } = req.body;

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: "Username and date are required",
      });
    }

    /* 🔹 USER */
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(200).json({
        success: true,
        count: 0,
        orders: [],
      });
    }

    /* 🔹 SERVICE DATE (booking date) */
    const serviceDate = new Date(date);
    if (isNaN(serviceDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }
    serviceDate.setHours(0, 0, 0, 0);

    /* 🔹 TABLES BOOKED FOR THIS DATE ONLY */
    const tables = await Table.find({
      userId: user._id,
      reservationDate: serviceDate,
    }).select("_id");

    if (!tables.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        orders: [],
        message: "No reservations for this date",
      });
    }

    const tableIds = tables.map((t) => t._id);

    const orders = await Order.find({
      userId: user._id,
      tableId: { $in: tableIds },
    })
      .populate("dishes.dish", "name price")
      .populate({
        path: "tableId",
        select:
          "number capacity price category reservationDateTime reservationDuration status",
      })
      .sort({ "tableId.reservationDateTime": 1 });

    /* 🔹 BILL CALCULATION */
    const ordersWithBill = orders.map((order) => {
      const dishesTotal = order.dishes.reduce(
        (sum, item) => sum + (item.dish?.price || 0) * item.quantity,
        0,
      );

      const tablePrice = order.tableId?.price || 0;

      return {
        ...order.toObject(),
        serviceDate: order.tableId.reservationDateTime,
        bill: {
          dishesTotal,
          tableTotal: tablePrice,
          grandTotal: dishesTotal + tablePrice,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: ordersWithBill.length,
      orders: ordersWithBill,
    });
  } catch (err) {
    console.error("MODE-1 Order Search Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
