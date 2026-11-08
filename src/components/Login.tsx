import { useState, type FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { auth, authPersistence } from "../firebase";
import "./Auth.css";

interface LoginProps {
  onSwitch: () => void;
}

const REMEMBERED_EMAIL_KEY = "ati_remembered_email";

function Login({ onSwitch }: LoginProps) {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY));
    } catch {
      return false;
    }
  });
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
      await signInWithEmailAndPassword(auth, email.trim(), password);

      try {
        if (rememberEmail) localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
        else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch {
        // Đăng nhập vẫn tiếp tục nếu trình duyệt chặn localStorage.
      }
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
    <main className="auth-page auth-page-login">
      <section className="auth-showcase" aria-label="ATI Group">
        <div className="auth-showcase-grid" />
        <div className="auth-showcase-glow auth-showcase-glow-one" />
        <div className="auth-showcase-glow auth-showcase-glow-two" />

        <div className="auth-showcase-brand">
          <img src="/ati-approved-logo.png" alt="ATI Group" />
          <span className="auth-brand-divider" />
          <div className="auth-brand-caption">
            <strong>TECHNOLOGY PLATFORM</strong>
            <span>INNOVATION · ENGINEERING · LEARNING</span>
          </div>
        </div>

        <div className="auth-showcase-copy">
          <span className="auth-kicker"><i /> ATI GROUP ECOSYSTEM</span>
          <h2>Kết nối công nghệ.<br /><em>Kiến tạo tương lai.</em></h2>
          <p>
            Một nền tảng tích hợp cho công nghệ, kỹ thuật, sản xuất,
            học tập và các giải pháp kinh doanh.
          </p>
          <div className="auth-capabilities">
            <span><b>01</b> Technology</span>
            <span><b>02</b> Manufacturing</span>
            <span><b>03</b> Learning</span>
          </div>
        </div>

        <div className="auth-showcase-bottom">
          <span>ATI GROUP</span>
          <span>BUILD · CONNECT · GROW</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <img src="/ati-approved-logo.png" alt="ATI Group" />
            <span>ATI GROUP</span>
          </div>

          <div className="auth-heading">
            <span className="auth-heading-kicker">WELCOME BACK</span>
            <h1>Chào mừng bạn đến với ATI!</h1>
            <p>Đăng nhập để tiếp tục không gian làm việc của bạn.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Mật khẩu</label>
              <div className="auth-input-wrap auth-password-wrapper">
                <LockKeyhole size={18} aria-hidden="true" />
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
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                />
                <span>Ghi nhớ email</span>
              </label>
              <button type="button" className="auth-text-button" onClick={handleForgotPassword}>
                Quên mật khẩu?
              </button>
            </div>

            {message && <div className="auth-message" role="alert">{message}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="auth-switch">
            Chưa có tài khoản?
            <button type="button" onClick={onSwitch}>Đăng ký ngay</button>
          </div>

          <div className="auth-footer">
            <span>© 2026 ATI Group. All rights reserved.</span>
            <span className="auth-secure"><LockKeyhole size={12} /> Secure access</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
