import {
  ArrowRight,
  BookOpen,
  Headphones,
  Layers,
  Award,
  BookPlus,
  ClipboardCheck,
  UserRound,
  Sparkles,
  GraduationCap,
  Compass,
} from "lucide-react";
import type { TabType } from "./Sidebar";
import "./Dashboard.css";

type DashboardProps = {
  displayName: string;
  onNavigate: (tab: TabType) => void;
};

const learningModules: {
  id: TabType;
  title: string;
  description: string;
  detail: string;
  icon: typeof BookOpen;
  tone: string;
}[] = [
  {
    id: "checklist",
    title: "Tổng quan học tập",
    description: "Theo dõi mục tiêu và tiến độ học tập.",
    detail: "LEARNING OVERVIEW",
    icon: ClipboardCheck,
    tone: "blue",
  },
  {
    id: "units",
    title: "Luyện tập 1.500 câu",
    description: "Thực hành dịch câu theo từng Unit.",
    detail: "1500 SENTENCES",
    icon: BookOpen,
    tone: "indigo",
  },
  {
    id: "listening",
    title: "Luyện nghe",
    description: "Nghe câu mẫu và luyện phát âm.",
    detail: "LISTENING PRACTICE",
    icon: Headphones,
    tone: "cyan",
  },
  {
    id: "flashcards",
    title: "Flashcard từ vựng",
    description: "Ghi nhớ từ vựng theo chủ đề.",
    detail: "VOCABULARY",
    icon: Layers,
    tone: "violet",
  },
  {
    id: "cefr",
    title: "Từ vựng CEFR",
    description: "Học từ vựng theo cấp độ A1 đến C2.",
    detail: "CEFR LEVELS",
    icon: Award,
    tone: "amber",
  },
  {
    id: "my-vocabulary",
    title: "Từ vựng của tôi",
    description: "Quản lý bộ từ vựng cá nhân.",
    detail: "MY COLLECTION",
    icon: BookPlus,
    tone: "teal",
  },
];

function Dashboard({ displayName, onNavigate }: DashboardProps) {
  const firstName = displayName.trim().split(/\s+/)[0] || "bạn";

  return (
    <div className="ntt-dashboard">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-eyebrow">
            <Sparkles size={13} /> NTT GROUP · ONE PLATFORM
          </span>
          <h2>Xin chào, {firstName}!</h2>
          <p>
            Chào mừng bạn đến với không gian làm việc NTT GROUP.
            Chọn một phân hệ để tiếp tục công việc của mình.
          </p>
          <button
            type="button"
            className="dashboard-primary-action"
            onClick={() => onNavigate("checklist")}
          >
            Khám phá không gian học tập <ArrowRight size={16} />
          </button>
        </div>
        <div className="dashboard-welcome-art" aria-hidden="true">
          <div className="dashboard-orbit orbit-one" />
          <div className="dashboard-orbit orbit-two" />
          <div className="dashboard-art-center">
            <span>NTT</span>
            <small>GROUP</small>
          </div>
          <div className="dashboard-art-chip chip-top"><GraduationCap size={17} /></div>
          <div className="dashboard-art-chip chip-bottom"><Compass size={16} /></div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-kicker">WORKSPACE</span>
            <h3>Không gian của bạn</h3>
            <p>Các phân hệ hiện có trong hệ sinh thái NTT GROUP.</p>
          </div>
          <span className="dashboard-section-count">01 PHÂN HỆ ĐANG HOẠT ĐỘNG</span>
        </div>

        <div className="dashboard-module-grid">
          <button
            type="button"
            className="dashboard-module-card dashboard-learning-feature"
            onClick={() => onNavigate("checklist")}
          >
            <div className="dashboard-feature-top">
              <span className="dashboard-module-icon"><GraduationCap size={22} /></span>
              <span className="dashboard-module-status"><i /> ĐANG HOẠT ĐỘNG</span>
            </div>
            <div className="dashboard-feature-copy">
              <span className="dashboard-module-kicker">NTT LEARNING</span>
              <h4>Học tiếng Anh</h4>
              <p>
                Không gian luyện tập tiếng Anh với bài học, nghe, từ vựng
                và công cụ theo dõi quá trình học.
              </p>
            </div>
            <span className="dashboard-module-link">Mở phân hệ <ArrowRight size={16} /></span>
          </button>

          <div className="dashboard-coming-card">
            <span className="dashboard-coming-icon"><Sparkles size={20} /></span>
            <span className="dashboard-module-kicker">COMING SOON</span>
            <h4>NTT Business</h4>
            <p>Không gian quản lý công việc và vận hành doanh nghiệp.</p>
            <span className="dashboard-coming-label">SẮP RA MẮT</span>
          </div>

          <div className="dashboard-coming-card">
            <span className="dashboard-coming-icon studio"><Compass size={20} /></span>
            <span className="dashboard-module-kicker">COMING SOON</span>
            <h4>NTT Studio</h4>
            <p>Không gian sáng tạo, sản xuất và quản lý nội dung.</p>
            <span className="dashboard-coming-label">SẮP RA MẮT</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section dashboard-learning-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-kicker">NTT LEARNING</span>
            <h3>Truy cập nhanh</h3>
            <p>Mở trực tiếp chức năng bạn muốn sử dụng.</p>
          </div>
          <button type="button" className="dashboard-text-link" onClick={() => onNavigate("checklist")}>
            Xem tổng quan học tập <ArrowRight size={14} />
          </button>
        </div>

        <div className="dashboard-quick-grid">
          {learningModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                type="button"
                className={`dashboard-quick-card tone-${module.tone}`}
                key={module.id}
                onClick={() => onNavigate(module.id)}
              >
                <span className="dashboard-quick-icon"><Icon size={19} /></span>
                <span className="dashboard-quick-copy">
                  <small>{module.detail}</small>
                  <strong>{module.title}</strong>
                  <em>{module.description}</em>
                </span>
                <ArrowRight className="dashboard-quick-arrow" size={16} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-account-strip">
        <div className="dashboard-account-icon"><UserRound size={19} /></div>
        <div>
          <strong>Không gian cá nhân</strong>
          <p>Cập nhật hồ sơ và thông tin tài khoản NTT GROUP.</p>
        </div>
        <button type="button" onClick={() => onNavigate("profile")}>
          Hồ sơ tài khoản <ArrowRight size={15} />
        </button>
      </section>
    </div>
  );
}

export default Dashboard;
