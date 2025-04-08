import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ สร้างห้องประชุมใหม่
export const createRoom = async (req, res) => {
  try {
    const { name, status } = req.body;

    // ตรวจสอบห้องประชุมว่ามีชื่อซ้ำหรือไม่
    const existingRoom = await prisma.room.findUnique({
      where: { name },
    });

    if (existingRoom) {
      return res.status(400).json({ message: "Room name already exists" });
    }

    const newRoom = await prisma.room.create({
      data: {
        name,
        status: status || "AVAILABLE", // กำหนดสถานะเป็น "AVAILABLE" หากไม่ได้ระบุ
      },
    });

    res.status(201).json({
      message: "Room created successfully",
      room: newRoom,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating room", error });
  }
};

// ✅ ดึงข้อมูลห้องประชุมทั้งหมด
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json({ message: "success", data: rooms });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving rooms", error });
  }
};

// ✅ ดึงข้อมูลห้องประชุมตาม ID
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "success", data: room });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving room", error });
  }
};

// ✅ อัปเดตข้อมูลห้องประชุม
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name,
        status,
      },
    });

    res.json({ message: "Room updated successfully", data: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: "Error updating room", error });
  }
};

// ✅ ลบห้องประชุม
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    // Delete all bookings associated with this room
    await prisma.booking.deleteMany({
      where: { roomId: id },
    });

    const deletedRoom = await prisma.room.delete({
      where: { id },
    });

    res.json({ message: "Room deleted successfully", data: deletedRoom });
  } catch (error) {
    res.status(500).json({ message: "Error deleting room", error });
  }
};
