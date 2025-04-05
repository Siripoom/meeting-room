import React from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { createUser } from "../../services/api";

const Register = () => {
  const onFinish = async (values) => {
    try {
      await createUser(values);
      message.success("ลงทะเบียนสำเร็จ");
      window.location.href = "/auth/login";
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลงทะเบียน");
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white">
          <div className="flex flex-col items-center mb-6">
            <img
              src="YOUR_LOGO_LINK_HERE" // เปลี่ยนเป็นลิงก์โลโก้ของคุณ
              alt="logo"
              className="w-12 h-12 mb-2"
            />
            <h2 className="text-xl font-bold text-center">ระบบจองห้องประชุม</h2>
            <p className="text-gray-600 text-center">ลงทะเบียนผู้ใช้งาน</p>
          </div>

          <Form
            name="register-form"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: "โปรดป้อนชื่อผู้ใช้งาน" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="ชื่อผู้ใช้งาน" />
            </Form.Item>

            <Form.Item
              name="email"
              type="email"
              rules={[{ required: true, message: "โปรดป้อนอีเมลล์" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="อีเมลล์" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "โปรดป้อนรหัสผ่าน" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="รหัสผ่าน"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "โปรดยืนยันรหัสผ่าน" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน!"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="ยืนยันรหัสผ่าน"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                สมัครสมาชิก
              </Button>
            </Form.Item>
            <p className="text-center text-gray-500 text-sm mt-4">
              มีบัญชีแล้ว?{" "}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default Register;
