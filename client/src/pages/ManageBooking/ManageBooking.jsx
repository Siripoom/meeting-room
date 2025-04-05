import { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Pagination,
  Tooltip,
  Typography,
  message,
  Modal,
  Form,
  Select,
  Checkbox,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import {
  getAllBookings,
  deleteBooking,
  updateBooking,
  createBooking,
  getAllRooms,
} from "../../services/api"; // Import API functions
import { useNavigate } from "react-router-dom"; // สำหรับการเปลี่ยนหน้า
import dayjs from "dayjs"; // ใช้ dayjs สำหรับการจัดการวันที่และเวลา
import "./ManageBooking.css";

const { Sider, Content } = Layout;
const { Title } = Typography;

const ManageBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // State สำหรับเปิด/ปิด Modal
  const [isCreatingBooking, setIsCreatingBooking] = useState(false); // เช็คว่าเป็นการสร้างการจองใหม่หรือแก้ไข
  const [selectedBooking, setSelectedBooking] = useState(null); // Booking ที่เลือกสำหรับการแก้ไข
  const [rooms, setRooms] = useState([]); // สำหรับห้องประชุม
  const pageSize = 10;
  const navigate = useNavigate(); // สำหรับการนำทางไปยังหน้าอื่น

  useEffect(() => {
    fetchBookings();
    fetchRooms(); // ดึงข้อมูลห้องประชุม
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await getAllBookings();
      setBookings(response);
      setFilteredBookings(response);
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลการจองได้");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await getAllRooms(); // ดึงข้อมูลห้องประชุม
      // ตรวจสอบว่า response.data เป็น array หรือไม่
      if (Array.isArray(response.data)) {
        setRooms(response.data); // เก็บห้องประชุมใน state
      } else {
        message.error("ข้อมูลห้องประชุมไม่ถูกต้อง");
      }
    } catch (error) {
      message.error("ไม่สามารถดึงข้อมูลห้องประชุมได้");
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    const filteredData = bookings.filter(
      (booking) =>
        booking.User.fullName.toLowerCase().includes(value.toLowerCase()) // ค้นหาจากชื่อ
    );
    setFilteredBookings(filteredData);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteBooking = async (id) => {
    setLoading(true);
    try {
      await deleteBooking(id);
      message.success("ลบการจองเรียบร้อยแล้ว");
      fetchBookings(); // โหลดข้อมูลใหม่หลังจากลบ
    } catch (error) {
      message.error("ไม่สามารถลบการจองได้");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async (data) => {
    setLoading(true);
    try {
      await updateBooking(data);
      message.success("อัปเดตสถานะการจองเรียบร้อยแล้ว");
      fetchBookings(); // โหลดข้อมูลใหม่หลังจากอัปเดต
    } catch (error) {
      message.error("ไม่สามารถอัปเดตสถานะการจองได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    const newBooking = {
      roomId: selectedBooking.roomId, // ห้องประชุมที่เลือก
      userId: selectedBooking.userId, // ผู้ใช้ที่จอง
      startDateTime: selectedBooking.startDateTime, // เวลาเริ่มประชุม
      endDateTime: selectedBooking.endDateTime, // เวลาสิ้นสุดประชุม
    };

    try {
      await createBooking(newBooking);
      message.success("การจองห้องประชุมถูกสร้างขึ้นแล้ว");
      fetchBookings(); // โหลดข้อมูลใหม่หลังจากสร้าง
    } catch (error) {
      message.error("ไม่สามารถสร้างการจองห้องประชุมได้");
    }
  };

  const handleViewHistory = (booking) => {
    navigate(`/admin/manage-booking/${booking.id}`);
  };

  const handleEditBooking = (record) => {
    if (!record) {
      message.error("ไม่พบข้อมูลการจองที่ต้องการแก้ไข");
      return;
    }

    setSelectedBooking(record); // เก็บข้อมูลการจองที่เลือก
    setIsCreatingBooking(false); // ตั้งค่าการแก้ไข
    setIsModalVisible(true); // เปิด Modal
  };

  const handleAddBooking = () => {
    setSelectedBooking(null); // เคลียร์การเลือกการจอง
    setIsCreatingBooking(true); // ตั้งค่าเป็นการสร้างการจองใหม่
    setIsModalVisible(true); // เปิด Modal
  };

  const handleModalCancel = () => {
    setIsModalVisible(false); // ปิด Modal
    setSelectedBooking(null); // เคลียร์การเลือกข้อมูล
  };

  const handleModalOk = async () => {
    if (!selectedBooking) {
      message.error("กรุณาเลือกการจองที่ต้องการแก้ไข");
      return;
    }

    if (isCreatingBooking) {
      handleCreateBooking(); // ถ้าเป็นการสร้างการจองใหม่
    } else {
      const updatedBooking = {
        ...selectedBooking,
        status: selectedBooking.status,
        isCancelled: selectedBooking.isCancelled,
      };

      await handleUpdateBooking(updatedBooking); // เรียกฟังก์ชันสำหรับอัปเดตข้อมูล
    }

    setIsModalVisible(false); // ปิด Modal หลังจากอัปเดต
    setSelectedBooking(null); // เคลียร์ข้อมูล
  };

  const columns = [
    {
      title: "ผู้จอง",
      key: "User.fullName",
      width: "15%",
      render: (text, record) => <span>{record.User.fullName}</span>,
    },

    {
      title: "วันที่จอง",
      dataIndex: "pickupDate",
      key: "pickupDate",
      width: "15%",
      render: (text) => dayjs(text).format("YYYY-MM-DD"),
    },
    {
      title: "เวลาที่ให้ไปรับ",
      dataIndex: "pickupTime",
      key: "pickupTime",
      width: "10%",
      render: (text) => dayjs(text).format("HH:mm:ss"),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: "10%",
      render: (status) => (
        <span
          className={`status-label ${
            status === "PENDING"
              ? "warning"
              : status === "COMPLETED"
              ? "success"
              : status === "CANCELLED"
              ? "pending"
              : status === "IN_PROGRESS"
              ? "in-progress"
              : ""
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "แก้ไข",
      key: "edit",
      width: "5%",
      render: (record) => (
        <Tooltip title="แก้ไข">
          <Button
            type="link"
            onClick={() => handleEditBooking(record)}
            icon={<EditOutlined />}
          />
        </Tooltip>
      ),
    },
    {
      title: "ลบ",
      key: "delete",
      width: "5%",
      render: (record) => (
        <Tooltip title="ลบ">
          <Button
            type="link"
            style={{ color: "red" }}
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBooking(record.id)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="การจัดการการจอง" />

        <Content className="manageBooking-container">
          <div className="content-wrapper">
            <Button
              type="primary"
              onClick={handleAddBooking}
              icon={<EditOutlined />}
              className="mb-4"
            >
              เพิ่มการจอง
            </Button>
            <Input
              placeholder="ค้นหาผู้ใช้..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              className="search-input"
            />

            <Table
              columns={columns}
              dataSource={filteredBookings.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize
              )}
              rowKey="id"
              loading={loading}
              pagination={false}
              className="booking-table"
            />

            <div className="pagination-container">
              <Pagination
                current={currentPage}
                total={filteredBookings.length}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(total) => `แสดงผล 1 ถึง 10 จาก ${total} รายการ`}
              />
            </div>
          </div>
        </Content>
      </Layout>

      {/* Modal สำหรับการสร้าง/แก้ไขการจอง */}
      <Modal
        title={isCreatingBooking ? "เพิ่มการจอง" : "แก้ไขการจอง"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form
          initialValues={{
            roomId: selectedBooking ? selectedBooking.roomId : "",
            status: selectedBooking ? selectedBooking.status : "AVAILABLE", // ค่าเริ่มต้นเป็น AVAILABLE
            startDateTime: selectedBooking ? selectedBooking.startDateTime : "",
            endDateTime: selectedBooking ? selectedBooking.endDateTime : "",
            isCancelled: selectedBooking ? selectedBooking.isCancelled : false,
          }}
        >
          {/* ฟอร์มสำหรับเลือกห้องที่จอง */}
          <Form.Item
            label="ห้องที่จอง"
            name="roomId"
            rules={[{ required: true, message: "กรุณาเลือกห้องที่จอง" }]}
          >
            <Select
              value={selectedBooking?.roomId}
              onChange={(value) =>
                setSelectedBooking((prev) => ({
                  ...prev,
                  roomId: value,
                }))
              }
            >
              {rooms.map((room) => (
                <Select.Option key={room.id} value={room.id}>
                  {room.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* ฟอร์มสำหรับเวลาเริ่มประชุม */}
          <Form.Item
            label="เวลาเริ่มประชุม"
            name="startDateTime"
            rules={[{ required: true, message: "กรุณากรอกเวลาเริ่มประชุม" }]}
          >
            <Input
              type="datetime-local"
              value={selectedBooking?.startDateTime}
              onChange={(e) =>
                setSelectedBooking((prev) => ({
                  ...prev,
                  startDateTime: e.target.value,
                }))
              }
            />
          </Form.Item>

          {/* ฟอร์มสำหรับเวลาสิ้นสุดประชุม */}
          <Form.Item
            label="เวลาสิ้นสุดประชุม"
            name="endDateTime"
            rules={[{ required: true, message: "กรุณากรอกเวลาสิ้นสุดประชุม" }]}
          >
            <Input
              type="datetime-local"
              value={selectedBooking?.endDateTime}
              onChange={(e) =>
                setSelectedBooking((prev) => ({
                  ...prev,
                  endDateTime: e.target.value,
                }))
              }
            />
          </Form.Item>

          {/* ฟอร์มสำหรับสถานะการจอง */}

          {/* ฟอร์มสำหรับการยกเลิกการจอง */}
          <Form.Item
            label="ยกเลิกการจอง"
            name="isCancelled"
            valuePropName="checked"
          >
            <Checkbox
              checked={selectedBooking?.isCancelled}
              onChange={(e) =>
                setSelectedBooking((prev) => ({
                  ...prev,
                  isCancelled: e.target.checked,
                }))
              }
            >
              ยกเลิกการจอง
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ManageBooking;
