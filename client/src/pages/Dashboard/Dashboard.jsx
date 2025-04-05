import { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Select,
  Typography,
  Modal,
  Input,
  message,
  Form,
} from "antd";
import {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../services/api"; // Import API functions
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Dashboard.css";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const { Sider, Content } = Layout;
const { Title } = Typography;

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomData, setRoomData] = useState({ name: "", status: "AVAILABLE" });
  const [loading, setLoading] = useState(false);

  // Fetch all rooms on component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await getAllRooms();
        // ตรวจสอบว่า response.data เป็น array
        if (response && Array.isArray(response.data)) {
          setRooms(response.data);
        } else {
          throw new Error("Data is not in array format");
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการดึงข้อมูลห้องประชุม");
        console.error(error);
      }
    };

    fetchRooms();
  }, []);

  // Open modal for creating/updating room
  const openModal = (room = null) => {
    if (room) {
      setRoomData({ name: room.name, status: room.status });
      setSelectedRoom(room);
    } else {
      setRoomData({ name: "", status: "AVAILABLE" });
      setSelectedRoom(null);
    }
    setModalVisible(true);
  };

  // Handle room creation and update
  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedRoom) {
        // Update room
        await updateRoom(selectedRoom.id, roomData);
        message.success("ห้องประชุมอัปเดตเรียบร้อยแล้ว");
      } else {
        // Create room
        await createRoom(roomData);
        message.success("ห้องประชุมถูกสร้างขึ้นแล้ว");
      }
      setModalVisible(false);
      setRoomData({ name: "", status: "AVAILABLE" });
      setSelectedRoom(null);
      // Refresh room list
      const response = await getAllRooms();
      setRooms(response.data);
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้องประชุม");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete room
  const handleDelete = async (roomId) => {
    try {
      await deleteRoom(roomId);
      message.success("ห้องประชุมถูกลบเรียบร้อยแล้ว");
      // Refresh room list
      const response = await getAllRooms();
      setRooms(response.data);
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลบห้องประชุม");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="การจัดการห้องประชุม" />

        <Content className="dashboard-container">
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Button
                  type="primary"
                  onClick={() => openModal()}
                  icon={<RocketOutlined />}
                >
                  สร้างห้องประชุม
                </Button>
              </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-4">
              {/* ตรวจสอบว่า rooms เป็น array ก่อนใช้งาน map */}
              {Array.isArray(rooms) &&
                rooms.map((room) => (
                  <Col span={8} key={room.id}>
                    <Card
                      title={room.name}
                      extra={
                        <Button
                          type="danger"
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleDelete(room.id)}
                        >
                          ลบ
                        </Button>
                      }
                      actions={[
                        <Button
                          icon={<EnvironmentOutlined />}
                          onClick={() => openModal(room)}
                        >
                          แก้ไข
                        </Button>,
                      ]}
                    >
                      <p>สถานะ: {room.status}</p>
                    </Card>
                  </Col>
                ))}
            </Row>
          </Card>
        </Content>

        {/* Modal for creating and updating rooms */}
        <Modal
          title={selectedRoom ? "แก้ไขห้องประชุม" : "สร้างห้องประชุม"}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleSave}
          confirmLoading={loading}
        >
          <Form layout="vertical">
            <Form.Item label="ชื่อห้องประชุม" required validateTrigger="onBlur">
              <Input
                value={roomData.name}
                onChange={(e) =>
                  setRoomData({ ...roomData, name: e.target.value })
                }
              />
            </Form.Item>
            <Form.Item label="สถานะห้องประชุม" required>
              <Select
                value={roomData.status}
                onChange={(value) =>
                  setRoomData({ ...roomData, status: value })
                }
              >
                <Select.Option value="AVAILABLE">ว่าง</Select.Option>
                <Select.Option value="BOOKED">จองแล้ว</Select.Option>
                <Select.Option value="MAINTENANCE">ซ่อมแซม</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
