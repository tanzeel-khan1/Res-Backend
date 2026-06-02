import cron from "node-cron";
import moment from "moment-timezone";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

cron.schedule(
  "0 23 * * *", 

  async () => {
    try {
      console.log("⏰ 11 0 pm cron running");

      const startOfDay = moment.tz("Asia/Karachi").startOf("day").toDate();

      const endOfDay = moment.tz("Asia/Karachi").endOf("day").toDate();

      const users = await User.find({ role: "waiter" }).select("_id");

      for (const user of users) {
        const existingAttendance = await Attendance.findOne({
          userId: user._id,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });

        if (
          existingAttendance &&
          ["present", "leave"].includes(existingAttendance.status)
        ) {
          continue;
        }

        if (existingAttendance && existingAttendance.status === "absent") {
          continue;
        }

        await Attendance.create({
          userId: user._id,
          date: startOfDay, 
          status: "absent",
        });
      }

      console.log("✅ Absent marked correctly (no duplicates)");
    } catch (error) {
      console.error("❌ Cron error:", error);
    }
  },
  {
    timezone: "Asia/Karachi",
  },
);
