import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ ดึงผู้ใช้ทั้งหมด
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ message: "success", data: users });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
};

// ✅ ดึงเฉพาะผู้ใช้ที่มี role = STAFF
export const getAllStaff = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "STAFF" },
    });
    res.json({ message: "success", data: users });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving STAFF users", error });
  }
};

// ✅ ดึงผู้ใช้รายคน (รวมการจองห้องประชุมที่เกี่ยวข้อง)
export const getSingleUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        bookingsAsUser: {
          include: { Room: { select: { name: true } } }, // ข้อมูลห้องประชุมที่จอง
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "success", data: user });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error });
  }
};

// ✅ อัปเดตข้อมูลผู้ใช้
export const updateUser = async (req, res) => {
  try {
    const { fullName, email, role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        fullName,
        email,
        role,
      },
    });

    res.json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

// ✅ ลบผู้ใช้ (พร้อมลบการจองห้องประชุมที่เกี่ยวข้อง)
export const deleteUser = async (req, res) => {
  try {
    // ลบการจองที่เกี่ยวข้อง
    await prisma.booking.deleteMany({
      where: { userId: req.params.id },
    });

    const deletedUser = await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "User deleted successfully", data: deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

// ✅ สร้างผู้ใช้ใหม่
export const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, citizen_id } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { citizen_id },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Citizen ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: role || "USER",
        citizen_id,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.id,
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};
