import { useState } from "react";
import { Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { loginUser } from "../../services/api";
import { jwtDecode } from "jwt-decode";
const link =
  "https://drive.google.com/file/d/1LTH2S9jOEswhPCOHea1vBs9Arx3lq2Wh/view";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      message.warning("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      const data = { email, password };
      const res = await loginUser(data);

      if (res && res.token) {
        localStorage.setItem("token", res.token);
        message.success("เข้าสู่ระบบสำเร็จ");
        const token = localStorage.getItem("token"); // ดึง token จาก localStorage
        if (token) {
          try {
            const decodedToken = jwtDecode(token); // decode token
            //Check role
            if (
              decodedToken.role === "ADMIN" ||
              decodedToken.role === "STAFF"
            ) {
              navigate("/admin/dashboard");
            } else {
              navigate("/");
            }
            console.log(decodedToken);
          } catch (error) {
            console.error("Error decoding token:", error);
          }
        }
      } else {
        message.error("เข้าสู่ระบบไม่สำเร็จ: ข้อมูลไม่ถูกต้อง");
      }
    } catch (err) {
      console.error("Login error:", err);
      message.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-white to-red-800">
        <Card className="p-10 rounded-3xl shadow-xl w-[400px] bg-white border border-gray-200">
          <div className="text-center">
            <img
              src={link} // ใส่ลิงก์โลโก้ที่คุณได้
              alt="logo"
              className="w-16 h-16 mx-auto mb-2"
            />
            <h2 className="text-2xl font-bold text-burgundy-800">
              ระบบจองห้องประชุม
            </h2>
            <p className="text-gray-500 text-sm">
              เข้าสู่ระบบเพื่อดำเนินการต่อ
            </p>
          </div>
          <div className="mt-8 space-y-5">
            <Input
              size="large"
              placeholder="อีเมล"
              prefix={<UserOutlined className="text-gray-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg"
              name="email"
            />
            <Input.Password
              size="large"
              placeholder="รหัสผ่าน"
              prefix={<LockOutlined className="text-gray-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg"
              name="password"
            />
            <Button
              type="primary"
              size="large"
              block
              className="bg-red-800 hover:bg-red-900 transition-all duration-300 rounded-lg font-medium"
              onClick={handleLogin}
              loading={loading}
            >
              เข้าสู่ระบบ
            </Button>
            <p className="text-center text-gray-500 text-sm mt-4">
              ไม่มีบัญชี?{" "}
              <Link
                to="/auth/register"
                className="text-red-600 hover:underline"
              >
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
