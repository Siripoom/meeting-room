import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
const prisma = new PrismaClient();
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const createBooking = async (req, res) => {
  try {
    const { roomId, startDateTime, endDateTime } = req.body;

    // ตรวจสอบว่า startDateTime และ endDateTime เป็น DateTime ที่ถูกต้อง
    if (!dayjs(startDateTime).isValid() || !dayjs(endDateTime).isValid()) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const startDateTimeParsed = dayjs(startDateTime).toDate();
    const endDateTimeParsed = dayjs(endDateTime).toDate();

    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not found in token" });
    }

    if (!roomId || !startDateTime || !endDateTime) {
      return res
        .status(400)
        .json({ message: "Missing room ID, start or end time" });
    }

    // ตรวจสอบห้องที่จอง
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // ตรวจสอบว่าห้องประชุมมีการจองซ้อนหรือไม่
    const existingBooking = await prisma.booking.findMany({
      where: {
        roomId,
        OR: [
          {
            startDateTime: {
              lte: endDateTimeParsed, // start <= end
            },
            endDateTime: {
              gte: startDateTimeParsed, // end >= start
            },
          },
        ],
      },
    });

    if (existingBooking.length > 0) {
      return res
        .status(400)
        .json({ message: "Room is already booked during this time" });
    }

    // สร้างการจองใหม่
    const newBooking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        startDateTime: startDateTimeParsed,
        endDateTime: endDateTimeParsed,
        status: "PENDING",
      },
    });

    res
      .status(201)
      .json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating booking", error });
  }
};

// ✅ ดึงรายการจองทั้งหมด (สำหรับเจ้าหน้าที่)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User: { select: { fullName: true } },
        Room: { select: { name: true } },
      },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

// ✅ ดึงรายละเอียดการจองตาม ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        User: { select: { fullName: true } },
        Room: { select: { name: true } },
      },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving booking", error });
  }
};

// ✅ อัปเดตสถานะการจอง (เจ้าหน้าที่เปลี่ยนสถานะการจอง)
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    res.json({ message: "Booking status updated", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking", error });
  }
};

// ✅ ยกเลิกการจอง
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedBooking = await prisma.booking.delete({
      where: { id },
    });

    res.json({ message: "Booking cancelled", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling booking", error });
  }
};

// ✅ อัปเดตการจอง (การมอบหมายห้องประชุม)
export const assignRoom = async (req, res) => {
  try {
    const { bookingId, roomId } = req.body;
    const assignedBy = req.user.id; // เจ้าหน้าที่ที่มอบหมาย

    // ตรวจสอบว่ามีการจองนี้หรือไม่
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // ตรวจสอบว่าห้องประชุมมีอยู่จริง
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) return res.status(400).json({ message: "Room not found" });

    // อัปเดตการจอง
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        roomId,
        assignedBy,
        status: "ASSIGNED",
      },
    });

    res.json({
      message: "Room assigned successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: "Error assigning room", error });
  }
};

// ✅ ตรวจสอบการจองห้องประชุมสำหรับเจ้าหน้าที่
export const getRoomAssignments = async (req, res) => {
  try {
    const roomId = req.params.roomId;

    const assignments = await prisma.booking.findMany({
      where: { roomId, status: "ASSIGNED" },
      include: {
        User: { select: { fullName: true, email: true } },
      },
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching room assignments", error });
  }
};

// ✅ เสร็จสิ้นการจอง (สำหรับเจ้าหน้าที่)
export const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่าการจองมีอยู่จริง
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // อัปเดตสถานะการจองเป็น "COMPLETED"
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    res.json({
      message: "Booking completed successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: "Error completing booking", error });
  }
};
