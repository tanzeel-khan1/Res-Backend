import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import moment from "moment-timezone";

/* MARK ATTENDANCE */
export const markAttendance = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    const today = moment.tz("Asia/Karachi").startOf("day").toDate();
    const endOfDay = moment(today).endOf("day").toDate();

    const existing = await Attendance.findOne({
      userId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (existing) {
      if (existing.status === "leave") {
        existing.status = "present";
        existing.checkIn = new Date();
        existing.leaveReason = undefined;
        existing.approvalStatus = "approved";
        await existing.save();

        return res.json({
          success: true,
          message: "Leave converted to present",
          attendance: existing,
        });
      }

      if (existing.status === "present") {
        return res.status(400).json({
          success: false,
          message: "Attendance already marked as present",
        });
      }

      if (existing.status === "absent") {
        return res.status(400).json({
          success: false,
          message: "Attendance already marked as absent",
        });
      }
    }

    // If no attendance record exists yet
    const attendance = await Attendance.create({
      userId,
      date: today,
      status: "present",
      checkIn: new Date(),
    });

    res.json({
      success: true,
      message: "Attendance marked as present",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* GET ALL ATTENDANCE (ADMIN) */
export const getAllAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    let filter = {};

    if (date) {
      const start = moment
        .tz(date, "YYYY-MM-DD", "Asia/Karachi")
        .startOf("day")
        .toDate();
      const end = moment(start).endOf("day").toDate();
      filter.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(filter)
      .populate("userId", "name email role")
      .sort({ date: -1 });

    res.json({ success: true, totalRecords: attendance.length, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* APPLY LEAVE */
export const applyLeave = async (req, res) => {
  try {
    const { userId, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const start = moment.tz(startDate, "Asia/Karachi").startOf("day");
    const end = moment.tz(endDate, "Asia/Karachi").startOf("day");

    if (end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    let records = [];

    for (let d = start.clone(); d.isSameOrBefore(end); d.add(1, "day")) {
      const leaveDate = d.toDate();
      const endOfDay = moment(leaveDate).endOf("day").toDate();

      const exists = await Attendance.findOne({
        userId,
        date: { $gte: leaveDate, $lte: endOfDay },
      });

      if (exists) continue;

      records.push({
        userId,
        date: leaveDate,
        status: "leave",
        leaveReason: reason,
        approvalStatus: "pending",
      });
    }

    if (records.length) {
      await Attendance.insertMany(records);
    }

    res.json({
      success: true,
      message: "Leave applied successfully",
      totalDays: records.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* GET USER ATTENDANCE */
export const getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const attendance = await Attendance.find({ userId }).sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* DELETE ATTENDANCE BY DATE */
export const deleteAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const deleted = await Attendance.findByIdAndDelete(attendanceId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
      deletedAttendance: deleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* PENDING LEAVES */
export const getPendingLeaves = async (req, res) => {
  const leaves = await Attendance.find({
    status: "leave",
    approvalStatus: "pending",
  }).populate("userId", "name email");

  res.json({ success: true, leaves });
};

/* LEAVE DECISION */

export const leaveDecision = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { decision } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid decision" });
    }

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const leave = await Attendance.findById(attendanceId);
    if (!leave) {
      return res
        .status(404)
        .json({ success: false, message: "Leave not found" });
    }

    if (leave.approvalStatus !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Leave already decided" });
    }

    leave.approvalStatus = decision;
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();

    await leave.save();

    res.json({
      success: true,
      message: `Leave ${decision} successfully`,
    });
  } catch (error) {
    console.error("Leave decision error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
