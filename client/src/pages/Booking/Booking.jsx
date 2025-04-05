import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  message,
  Spin,
  Select,
  Table,
} from "antd";
import { UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";
import { createBooking, getAllRooms, getAllBookings } from "../../services/api"; // API functions
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";

const Booking = () => {
  const [location, setLocation] = useState(""); // Location, can be optional
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState([]); // To store rooms data
  const [selectedRoom, setSelectedRoom] = useState(null); // To store selected room data
  const [userBookings, setUserBookings] = useState([]); // To store user bookings (initialize as an empty array)
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser(decodedToken);
        setIsLoggedIn(true);

        // Pre-fill form with user's name if available
        if (decodedToken.fullName) {
          form.setFieldsValue({
            name: decodedToken.fullName,
          });
        }

        // Fetch user's booking history after login
        fetchBookings();
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }

    // Fetch rooms data from API when the component mounts
    fetchRooms();
  }, [form]);

  // Fetch all rooms for selecting during booking
  const fetchRooms = async () => {
    try {
      const response = await getAllRooms(); // API to fetch rooms
      setRooms(response.data);
    } catch (error) {
      message.error("ไม่สามารถดึงข้อมูลห้องประชุมได้");
    }
  };

  // Fetch all bookings for the current user
  const fetchBookings = async () => {
    try {
      const response = await getAllBookings(); // API to fetch user's bookings
      console.log("User Bookings:", response); // ตรวจสอบข้อมูลที่ดึงมาจาก API

      setUserBookings(response); // Ensure it's an array, in case the response is null or undefined
    } catch (error) {
      message.error("ไม่สามารถดึงประวัติการจองได้");
    }
  };

  // Handle form submission
  const onFinish = async (values) => {
    if (!isLoggedIn) {
      message.error("กรุณาล็อกอินก่อนทำการจอง!");
      navigate("/auth/login");
      return;
    }

    try {
      setLoading(true);

      // Prepare booking data
      const startDateTime =
        values.startDate.format("YYYY-MM-DD") +
        " " +
        values.startDateTime.format("HH:mm:ss");
      const endDateTime =
        values.startDate.format("YYYY-MM-DD") +
        " " +
        values.endDateTime.format("HH:mm:ss");

      const bookingData = {
        roomId: selectedRoom, // Selected room from dropdown
        startDateTime: startDateTime,
        endDateTime: endDateTime,
      };

      console.log("📦 Sending booking data:", bookingData);

      const response = await createBooking(bookingData);
      if (response && response.booking.id) {
        navigate(`/booking/success`, {
          state: {
            bookingId: response.booking.id,
            bookingData,
          },
        });
      } else {
        throw new Error("ไม่ได้รับข้อมูลการจองจากเซิร์ฟเวอร์");
      }
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      message.error("ไม่สามารถทำการจองได้ โปรดลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // Check if the room is available at the selected time
  const isRoomAvailable = (roomId, startTime, endTime) => {
    // Filter out bookings that have a time conflict with the selected room and time
    const conflictingBookings = userBookings.filter((booking) => {
      return (
        booking.roomId === roomId &&
        dayjs(booking.startDateTime).isBefore(endTime) &&
        dayjs(booking.endDateTime).isAfter(startTime)
      );
    });

    return conflictingBookings.length === 0; // If there are no conflicts, room is available
  };

  // Columns for the bookings table
  const columns = [
    {
      title: "ห้องประชุม",
      dataIndex: "Room.name", // ใช้ Room.name เพื่อเข้าถึงชื่อห้อง
      key: "Room.name",
      render: (text, record) => {
        return record.Room ? record.Room.name : "ไม่ระบุ"; // แสดงชื่อห้อง
      },
    },
    {
      title: "วันที่เริ่มต้น",
      dataIndex: "startDateTime",
      key: "startDateTime",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "วันที่สิ้นสุด",
      dataIndex: "endDateTime",
      key: "endDateTime",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`status-label ${
            status === "PENDING"
              ? "warning"
              : status === "COMPLETED"
              ? "success"
              : status === "CANCELLED"
              ? "cancelled"
              : ""
          }`}
        >
          {status}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-400 to-blue-600 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12 sm:py-16 md:py-24">
        <div className="w-full max-w-7xl flex space-x-6 justify-center">
          {/* Left: Display User's Bookings */}
          <div className="w-1/2 pr-4">
            <Table
              columns={columns}
              dataSource={userBookings}
              rowKey="id"
              pagination={{
                pageSize: 10, // Display 10 entries per page
              }}
              className="booking-history-table"
            />
          </div>

          {/* Right: Booking Form */}
          <div className="w-1/2 pl-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
              <div className="flex flex-col items-center mb-6">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
                  alt="meeting room"
                  className="w-16 h-16 mb-4"
                />
                <h2 className="text-3xl font-semibold text-gray-800 mb-2">
                  แบบฟอร์มจองห้องประชุม
                </h2>
                <p className="text-gray-600 mb-4">
                  กรุณากรอกข้อมูลให้ครบถ้วนก่อนกดยืนยันการจอง
                </p>
              </div>

              <Spin spinning={loading}>
                <Form
                  form={form}
                  name="booking-form"
                  onFinish={onFinish}
                  layout="vertical"
                  size="large"
                  className="space-y-6"
                  disabled={!isLoggedIn}
                >
                  {/* User's Name */}
                  <Form.Item
                    name="name"
                    label="ชื่อผู้จอง"
                    rules={[{ required: true, message: "โปรดป้อนชื่อผู้จอง" }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="ชื่อผู้จอง"
                      className="rounded-lg shadow-sm"
                    />
                  </Form.Item>

                  {/* Date Selection */}
                  <Form.Item
                    name="startDate"
                    label="เลือกวันจอง"
                    rules={[{ required: true, message: "โปรดเลือกวันจอง" }]}
                  >
                    <DatePicker
                      className="w-full rounded-lg shadow-sm"
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                    />
                  </Form.Item>

                  {/* Time Selection */}
                  <Form.Item
                    name="startDateTime"
                    label="เริ่มเวลาที่ต้องการใช้ห้อง"
                    rules={[{ required: true, message: "โปรดเลือกเวลา" }]}
                  >
                    <TimePicker
                      className="w-full rounded-lg shadow-sm"
                      format="HH:mm"
                    />
                  </Form.Item>

                  <Form.Item
                    name="endDateTime"
                    label="สิ้นสุดเวลาที่ต้องการใช้ห้อง"
                    rules={[{ required: true, message: "โปรดเลือกเวลา" }]}
                  >
                    <TimePicker
                      className="w-full rounded-lg shadow-sm"
                      format="HH:mm"
                    />
                  </Form.Item>

                  {/* Room Selection */}
                  <Form.Item
                    name="roomId"
                    label="เลือกห้องประชุม"
                    rules={[{ required: true, message: "โปรดเลือกห้องประชุม" }]}
                  >
                    <Select
                      value={selectedRoom}
                      onChange={(value) => setSelectedRoom(value)}
                      placeholder="เลือกห้องประชุม"
                      className="rounded-lg shadow-sm"
                    >
                      {rooms.map((room) => (
                        <Select.Option
                          key={room.id}
                          value={room.id}
                          disabled={
                            !isRoomAvailable(
                              room.id,
                              form.getFieldValue("startDateTime"),
                              form.getFieldValue("endDateTime")
                            )
                          }
                        >
                          {room.name} - {room.status}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Submit Button */}
                  <Form.Item className="mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      className="rounded-lg py-3 text-white bg-green-600 hover:bg-green-700"
                      disabled={!isLoggedIn}
                    >
                      ยืนยันการจอง
                    </Button>
                  </Form.Item>
                </Form>
              </Spin>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Booking;
