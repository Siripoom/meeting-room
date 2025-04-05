import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  completeBooking,
} from "../controllers/bookingController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdminOrStaff from "../middlewares/isAdminOrStaff.js";

const router = express.Router();

router.post("/", authMiddleware, createBooking); // ผู้ป่วยจองรถ
router.get("/", getAllBookings); // เจ้าหน้าที่ดูการจองทั้งหมด
router.get("/:id", getBookingById); // ดูข้อมูลการจอง
router.put("/:id", updateBooking); // อัปเดตสถานะ
router.delete("/:id", cancelBooking); // ยกเลิกการจอง

router.put("/:id/complete", completeBooking);
export default router;
