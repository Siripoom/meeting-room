import React, { useState, useEffect } from "react";
import { Button, Layout, Menu, Dropdown } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

const { Header } = Layout;

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token"); // ดึง token จาก localStorage
    if (token) {
      try {
        const decodedToken = jwtDecode(token); // decode token
        setUser(decodedToken); // ตั้งค่า user
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    // ลบ token จาก localStorage
    localStorage.removeItem("token");
    // รีเซ็ต user state
    setUser(null);
    // นำทางกลับไปยังหน้าหลัก
    navigate("/");
  };

  // สร้าง userMenu เมื่อ user มีค่า เพื่อป้องกัน error
  const userMenu = user ? (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to={`/profile/${user.id}`}>ประวัติการจอง</Link>
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        ออกจากระบบ
      </Menu.Item>
    </Menu>
  ) : null;

  return (
    <Header
      className="bg-white shadow-md flex justify-between items-center px-6"
      style={{ backgroundColor: "white" }}
    >
      <Link to="/">
        <img
          src="YOUR_LOGO_URL_HERE" // เปลี่ยนเป็นลิงก์โลโก้ของคุณ
          alt="logo"
          className="w-12 h-12"
        />
      </Link>
      <h1 className="text-lg font-bold text-black ml-1">ระบบจองห้องประชุม</h1>

      <Menu
        mode="horizontal"
        className="border-none flex-grow justify-center bg-white text-black"
      >
        <Menu.Item key="booking">
          <Link to="/booking">จองห้องประชุม</Link>{" "}
          {/* เปลี่ยนจาก "จองรถฉุกเฉิน" เป็น "จองห้องประชุม" */}
        </Menu.Item>
      </Menu>

      {user ? (
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Button type="default" className="text-black border-gray-300">
            {user.fullName} <UserOutlined />
          </Button>
        </Dropdown>
      ) : (
        <Button type="default" className="text-black border-gray-300">
          <Link to="/auth/login">ลงชื่อเข้าใช้/สมัครสมาชิก</Link>
        </Button>
      )}
    </Header>
  );
};

export default Navbar;
