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
  Cpu,
  Cog,
  Factory,
  Search,
  ChartNoAxesCombined,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
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
    id: "statistics",
    title: "Báo cáo học tập",
    description: "Theo dõi kết quả và tiến độ luyện tập.",
    detail: "LEARNING ANALYTICS",
    icon: ChartNoAxesCombined,
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
  const [moduleSearch, setModuleSearch] = useState("");
  const filteredModules = useMemo(() => {
    const keyword = moduleSearch.trim().toLocaleLowerCase("vi");
    if (!keyword) return learningModules;
    return learningModules.filter((module) =>
      [module.title, module.description, module.detail]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(keyword)
    );
  }, [moduleSearch]);

  return (
    <div className="ntt-dashboard">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-eyebrow">
            <Sparkles size={13} /> ATI GROUP · TECHNOLOGY ECOSYSTEM
          </span>
          <h2>Xin chào, {firstName}!</h2>
          <p>
            Một hệ sinh thái phát triển AI, phần mềm, thiết kế kỹ thuật và công nghệ chế tạo.
            Bắt đầu từ ATI Learning, mở rộng đến các giải pháp công nghiệp thông minh.
          </p>
          <button
            type="button"
            className="dashboard-primary-action"
            onClick={() => onNavigate("checklist")}
          >
            Khám phá ATI Learning <ArrowRight size={16} />
          </button>
        </div>
        <div className="dashboard-welcome-art" aria-hidden="true">
          <div className="dashboard-orbit orbit-one" />
          <div className="dashboard-orbit orbit-two" />
          <div className="dashboard-art-center">
            <img src="/ati-approved-logo.png" alt="ATI" />
          </div>
          <div className="dashboard-art-chip chip-top"><Cpu size={17} /></div>
          <div className="dashboard-art-chip chip-bottom"><Cog size={16} /></div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-kicker">ATI ECOSYSTEM</span>
            <h3>Hệ sinh thái ATI</h3>
            <p>Các sản phẩm và định hướng phát triển trong hệ sinh thái công nghệ ATI.</p>
          </div>
          <span className="dashboard-section-count"><i /> 01 SẢN PHẨM ĐANG HOẠT ĐỘNG</span>
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
              <span className="dashboard-module-kicker">ATI LEARNING</span>
              <h4>Học tiếng Anh</h4>
              <p>
                Không gian luyện tập tiếng Anh với bài học, nghe, từ vựng
                và công cụ theo dõi quá trình học.
              </p>
            </div>
            <span className="dashboard-module-link">Mở phân hệ <ArrowRight size={16} /></span>
          </button>

          <div className="dashboard-coming-card">
            <span className="dashboard-coming-icon ai"><Cpu size={20} /></span>
            <span className="dashboard-module-kicker">AI & SOFTWARE</span>
            <h4>ATI AI Lab</h4>
            <p>Nghiên cứu AI, tự động hóa quy trình và phát triển phần mềm thông minh.</p>
            <span className="dashboard-coming-label">ĐỊNH HƯỚNG PHÁT TRIỂN</span>
          </div>

          <div className="dashboard-coming-card">
            <span className="dashboard-coming-icon engineering"><Cog size={20} /></span>
            <span className="dashboard-module-kicker">ENGINEERING</span>
            <h4>ATI Engineering</h4>
            <p>Thiết kế cơ khí, phát triển máy móc và giải pháp kỹ thuật.</p>
            <span className="dashboard-coming-label">ĐỊNH HƯỚNG PHÁT TRIỂN</span>
          </div>

          <div className="dashboard-coming-card">
            <span className="dashboard-coming-icon manufacturing"><Factory size={20} /></span>
            <span className="dashboard-module-kicker">MANUFACTURING</span>
            <h4>ATI Manufacturing</h4>
            <p>Công nghệ chế tạo, gia công và tự động hóa sản xuất.</p>
            <span className="dashboard-coming-label">ĐỊNH HƯỚNG PHÁT TRIỂN</span>
          </div>

          <div className="dashboard-coming-card">
            <span className="dashboard-coming-icon"><Sparkles size={20} /></span>
            <span className="dashboard-module-kicker">COMING SOON</span>
            <h4>ATI Business</h4>
            <p>Giải pháp quản trị, quản lý công việc và vận hành doanh nghiệp.</p>
            <span className="dashboard-coming-label">SẮP RA MẮT</span>
          </div>

          <div className="dashboard-coming-card">
            <span className="dashboard-coming-icon studio"><Compass size={20} /></span>
            <span className="dashboard-module-kicker">COMING SOON</span>
            <h4>ATI Studio</h4>
            <p>Công cụ sáng tạo nội dung, thiết kế và truyền thông số.</p>
            <span className="dashboard-coming-label">SẮP RA MẮT</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section dashboard-learning-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-kicker">ATI LEARNING</span>
            <h3>Truy cập nhanh</h3>
            <p>Mở trực tiếp chức năng bạn muốn sử dụng.</p>
          </div>
          <div className="dashboard-quick-tools">
            <label className="dashboard-module-search">
              <Search size={16} />
              <input
                value={moduleSearch}
                onChange={(event) => setModuleSearch(event.target.value)}
                placeholder="Tìm chức năng học tập..."
                aria-label="Tìm chức năng học tập"
              />
              {moduleSearch && (
                <button type="button" onClick={() => setModuleSearch("")} aria-label="Xóa tìm kiếm">
                  <X size={15} />
                </button>
              )}
            </label>
            <button type="button" className="dashboard-text-link" onClick={() => onNavigate("checklist")}>
              Tổng quan học tập <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="dashboard-quick-grid">
          {filteredModules.map((module) => {
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
          {filteredModules.length === 0 && (
            <div className="dashboard-no-results">
              <Search size={20} />
              <strong>Không tìm thấy chức năng phù hợp</strong>
              <span>Thử tìm bằng tên chức năng hoặc từ khóa khác.</span>
              <button type="button" onClick={() => setModuleSearch("")}>Xóa tìm kiếm</button>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-account-strip">
        <div className="dashboard-account-icon"><UserRound size={19} /></div>
        <div>
          <strong>Không gian cá nhân</strong>
          <p>Cập nhật hồ sơ và thông tin tài khoản ATI Group.</p>
        </div>
        <button type="button" onClick={() => onNavigate("profile")}>
          Hồ sơ tài khoản <ArrowRight size={15} />
        </button>
      </section>
    </div>
  );
}

export default Dashboard;
