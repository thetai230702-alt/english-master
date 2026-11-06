
import {
  Tag,
  UserRound,
  Phone,
  Mail,
  Code2,
  Heart,
} from "lucide-react";

import "./Information.css";

function Information() {
  return (
    <div className="information-page">
      <div className="information-card">
        <div className="information-cover">
          <div className="information-cover-decoration decoration-one" />
          <div className="information-cover-decoration decoration-two" />

          <div className="information-avatar-wrapper">
            <img
              src="/images/information-avatar.png"
              alt="NTT GROUP"
              className="information-avatar"
            />
          </div>
        </div>

        <div className="information-content">
          <div className="information-brand">
            <div className="information-brand-icon">
              <strong className="information-ntt-mark">NTT</strong>
            </div>

            <div>
              <h2>
                NTT <span>GROUP</span>
              </h2>
              <p>ONE PLATFORM · MULTIPLE POSSIBILITIES</p>
            </div>
          </div>

          <div className="information-introduction">
            <h3>Welcome to NTT GROUP!</h3>
            <p>
              NTT GROUP là nền tảng đa chức năng. Phân hệ đầu tiên hỗ trợ học tiếng Anh thông qua từ vựng,
              luyện nghe, luyện dịch và thực hành mỗi ngày.
            </p>
          </div>

          <div className="information-details">
            <div className="information-detail-item">
              <div className="information-detail-icon">
                <Tag size={20} />
              </div>

              <div className="information-detail-label">
                <span>Version</span>
                <small>Phiên bản ứng dụng</small>
              </div>

              <strong className="information-version">v1.0.0</strong>
            </div>

            <div className="information-detail-item">
              <div className="information-detail-icon">
                <UserRound size={20} />
              </div>

              <div className="information-detail-label">
                <span>Create</span>
                <small>Người phát triển</small>
              </div>

              <strong>Thế Tài</strong>
            </div>

            <div className="information-detail-item">
              <div className="information-detail-icon">
                <Phone size={20} />
              </div>

              <div className="information-detail-label">
                <span>SĐT</span>
                <small>Liên hệ</small>
              </div>

              <strong>Chưa cập nhật</strong>
            </div>

            <div className="information-detail-item">
              <div className="information-detail-icon">
                <Mail size={20} />
              </div>

              <div className="information-detail-label">
                <span>Email</span>
                <small>Địa chỉ liên hệ</small>
              </div>

              <strong>Chưa cập nhật</strong>
            </div>
          </div>

          <div className="information-footer">
            <div className="information-footer-icon">
              <Code2 size={17} />
            </div>

            <span>Developed with</span>
            <Heart size={15} className="information-heart" />
            <strong>by Thế Tài</strong>
          </div>

          <div className="information-copyright">
            © 2026 English Master. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Information;
