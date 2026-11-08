import {
  ArrowRight,
  Bot,
  Boxes,
  Building2,
  Cpu,
  GraduationCap,
  Layers3,
  Mic2,
  Network,
  Settings2,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { TabType } from "./Sidebar";
import "./Dashboard.css";

type DashboardProps = {
  displayName: string;
  onNavigate: (tab: TabType) => void;
};

const modules = [
  {
    title: "ATI Learning",
    subtitle: "Nền tảng học tập & phát triển năng lực",
    description: "Hệ thống học tiếng Anh, luyện nghe, từ vựng và theo dõi lộ trình cá nhân.",
    status: "Đang hoạt động",
    active: true,
    icon: GraduationCap,
    tone: "learning",
    action: "learning-dashboard" as TabType,
    actionLabel: "Mở phân hệ",
    tags: ["English Learning", "Learning Analytics"],
  },
  {
    title: "ATI Technology",
    subtitle: "Công nghệ & giải pháp phần mềm",
    description: "Định hướng phát triển ứng dụng, nền tảng số và các giải pháp công nghệ.",
    status: "Định hướng phát triển",
    active: false,
    icon: Cpu,
    tone: "technology",
    tags: ["Software", "Digital Solutions"],
  },
  {
    title: "ATI Manufacturing",
    subtitle: "Cơ khí & chế tạo máy",
    description: "Không gian phát triển công cụ kỹ thuật, thiết kế cơ khí và tự động hóa sản xuất.",
    status: "Định hướng phát triển",
    active: false,
    icon: Boxes,
    tone: "manufacturing",
    tags: ["Mechanical Design", "Automation"],
  },
  {
    title: "ATI Studio",
    subtitle: "Sáng tạo nội dung & truyền thông",
    description: "Định hướng xây dựng công cụ hỗ trợ sáng tạo, quản lý và phát triển nội dung.",
    status: "Sắp ra mắt",
    active: false,
    icon: Mic2,
    tone: "studio",
    tags: ["Creative", "Media"],
  },
  {
    title: "ATI Business",
    subtitle: "Quản trị & vận hành doanh nghiệp",
    description: "Định hướng tích hợp quy trình, dữ liệu và các công cụ quản lý vận hành.",
    status: "Sắp ra mắt",
    active: false,
    icon: Building2,
    tone: "business",
    tags: ["ERP", "Business Operations"],
  },
];

function Dashboard({ displayName, onNavigate }: DashboardProps) {
  const firstName = displayName.trim().split(/\s+/).slice(-1)[0] || "bạn";
  const activeModules = modules.filter((module) => module.active).length;

  return (
    <div className="ati-group-overview">
      <section className="ati-overview-hero">
        <div className="ati-overview-hero-copy">
          <span className="ati-overview-eyebrow"><Sparkles size={13} /> ATI GROUP · INTEGRATED PLATFORM</span>
          <h2>Xin chào, {firstName}!</h2>
          <p>
            Chào mừng bạn đến với hệ sinh thái ATI Group — nơi kết nối công nghệ,
            trí tuệ nhân tạo, chế tạo máy và các giải pháp phát triển năng lực.
          </p>
          <div className="ati-overview-hero-meta">
            <span><Network size={14} /> Một nền tảng · Nhiều hệ sinh thái</span>
            <span><Layers3 size={14} /> Phát triển theo từng phân hệ</span>
          </div>
        </div>
        <div className="ati-overview-hero-art" aria-hidden="true">
          <div className="ati-orbit orbit-a" />
          <div className="ati-orbit orbit-b" />
          <div className="ati-orbit orbit-c" />
          <div className="ati-core"><img src="/ati-approved-logo.png" alt="" /></div>
          <span className="ati-node node-ai"><Bot size={21} /></span>
          <span className="ati-node node-tech"><Cpu size={20} /></span>
          <span className="ati-node node-build"><Workflow size={20} /></span>
        </div>
      </section>

      <section className="ati-overview-summary">
        <article>
          <span className="ati-summary-icon"><Layers3 size={19} /></span>
          <div><small>Hệ sinh thái</small><strong>{modules.length} phân hệ</strong><em>Các mảng phát triển của ATI</em></div>
        </article>
        <article>
          <span className="ati-summary-icon active"><Workflow size={19} /></span>
          <div><small>Đang vận hành</small><strong>{activeModules} phân hệ</strong><em>ATI Learning hiện đang hoạt động</em></div>
        </article>
        <article>
          <span className="ati-summary-icon"><Settings2 size={19} /></span>
          <div><small>Định hướng</small><strong>Technology · AI</strong><em>Manufacturing · Business</em></div>
        </article>
      </section>

      <section className="ati-overview-section">
        <div className="ati-overview-section-heading">
          <div>
            <span>ATI ECOSYSTEM</span>
            <h3>Các phân hệ trong ATI Group</h3>
            <p>Chọn một phân hệ để truy cập không gian làm việc tương ứng.</p>
          </div>
          <span className="ati-module-count">{modules.length} MODULES</span>
        </div>

        <div className="ati-module-grid">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article className={`ati-module-card ati-module-${module.tone} ${module.active ? "is-active" : "is-planned"}`} key={module.title}>
                <div className="ati-module-card-top">
                  <span className="ati-module-icon"><Icon size={23} /></span>
                  <span className={`ati-module-status ${module.active ? "status-active" : "status-planned"}`}>
                    <i /> {module.status}
                  </span>
                </div>
                <div className="ati-module-copy">
                  <h4>{module.title}</h4>
                  <strong>{module.subtitle}</strong>
                  <p>{module.description}</p>
                </div>
                <div className="ati-module-tags">
                  {module.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                {module.active && module.action ? (
                  <button
                    type="button"
                    className="ati-module-action"
                    onClick={() => onNavigate(module.action!)}
                  >
                    {module.actionLabel} <ArrowRight size={16} />
                  </button>
                ) : (
                  <div className="ati-module-coming"><span>Đang trong lộ trình phát triển</span><ArrowRight size={15} /></div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="ati-overview-footer">
        <div className="ati-footer-mark"><img src="/ati-approved-logo.png" alt="ATI" /></div>
        <div><strong>ATI Group</strong><p>Technology · AI · Manufacturing</p></div>
        <span>Phát triển không giới hạn.</span>
      </footer>
    </div>
  );
}

export default Dashboard;
