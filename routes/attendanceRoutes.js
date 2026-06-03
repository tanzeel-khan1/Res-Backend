import express from "express";
import {
  markAttendance,
  getUserAttendance,
  deleteAttendanceById,
  applyLeave,
  getPendingLeaves,
  leaveDecision,
  getAllAttendance,
} from "../Controllers/attendanceController.js";

import { protect, adminOnly } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/mark", markAttendance);

router.get("/:userId", protect, getUserAttendance);
router.post("/apply-leave", applyLeave);
router.get("/pending-leaves", getPendingLeaves);
router.get("/", getAllAttendance);

router.delete(
  "/delete/:attendanceId",
  protect,
  adminOnly,
  deleteAttendanceById,
);
router.put("/decision/:attendanceId", protect, leaveDecision);

export default router;
