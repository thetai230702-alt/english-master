
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, authPersistence } from "../firebase";
import "./Auth.css";

interface RegisterProps {
  onSwitch: () => void;
}

function Register({ onSwitch }: RegisterProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    if (fullName.trim().length < 2) {
      setMessage("Vui lòng nhập họ tên hợp lệ.");
      return;
    }

    if (password.length < 6) {
      setMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      await authPersistence;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(userCredential.user, {
        displayName: fullName.trim(),
      });
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/email-already-in-use") {
        setMessage("Email này đã được đăng ký.");
      } else if (code === "auth/invalid-email") {
        setMessage("Địa chỉ email không hợp lệ.");
      } else if (code === "auth/weak-password") {
        setMessage("Mật khẩu quá yếu. Hãy sử dụng mật khẩu mạnh hơn.");
      } else {
        setMessage("Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-shape auth-shape-one" />
      <div className="auth-background-shape auth-shape-two" />

      <div className="auth-card">
        <div className="auth-brand">
          <img className="auth-logo" src="/ati-approved-logo.png" alt="ATI" />
          
        </div>

        <div className="auth-heading">
          <h1>Tạo tài khoản</h1>
          <p>Bắt đầu hành trình chinh phục tiếng Anh cùng chúng mình.</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label htmlFor="register-name">Họ và tên</label>
            <input
              id="register-name"
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Địa chỉ email</label>
            <input
              id="register-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Mật khẩu</label>
            <div className="auth-password-wrapper">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm-password">
              Xác nhận mật khẩu
            </label>
            <input
              id="register-confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {message && (
            <div className="auth-message" role="alert">
              {message}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="auth-switch">
          Đã có tài khoản?
          <button type="button" onClick={onSwitch}>
            Đăng nhập
          </button>
        </div>

        <div className="auth-footer">
          © 2026 ATI Group. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Register;
