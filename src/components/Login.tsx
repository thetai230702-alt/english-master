
import { useState, type FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth, authPersistence } from "../firebase";
import "./Auth.css";

interface LoginProps {
  onSwitch: () => void;
}

function Login({ onSwitch }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      await authPersistence;

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setMessage("Email hoặc mật khẩu không chính xác.");
      } else if (code === "auth/invalid-email") {
        setMessage("Địa chỉ email không hợp lệ.");
      } else if (code === "auth/too-many-requests") {
        setMessage("Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.");
      } else {
        setMessage("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setMessage("");

    if (!email.trim()) {
      setMessage("Vui lòng nhập email trước khi đặt lại mật khẩu.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư.");
    } catch {
      setMessage("Không thể gửi email đặt lại mật khẩu.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-shape auth-shape-one" />
      <div className="auth-background-shape auth-shape-two" />

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">E</div>
          <span>ENGLISH MASTER</span>
        </div>

        <div className="auth-heading">
          <h1>Chào mừng trở lại!</h1>
          <p>Đăng nhập để tiếp tục hành trình học tiếng Anh.</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Địa chỉ email</label>
            <input
              id="login-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Mật khẩu</label>
            <div className="auth-password-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          <div className="auth-forgot">
            <button type="button" onClick={handleForgotPassword}>
              Quên mật khẩu?
            </button>
          </div>

          {message && (
            <div className="auth-message" role="alert">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-switch">
          Chưa có tài khoản?
          <button type="button" onClick={onSwitch}>
            Đăng ký ngay
          </button>
        </div>

        <div className="auth-footer">
          © 2026 English Master. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Login;
