import {
  ArrowRight,
  Cpu,
  Cog,
  Factory,
  Laptop,
  Layers3,
  ShieldCheck,
  Target,
  Tag,
  UserRound,
  Phone,
  Mail,
  CalendarDays,
  RefreshCw,
  Sparkles,
  Code2,
  Heart,
} from "lucide-react";
import "./Information.css";

const appDetails = [
  { icon: Tag, label: "Phiên bản", value: "v1.0.0", highlight: true },
  { icon: UserRound, label: "Người phát triển", value: "Nguyễn Thế Tài" },
  { icon: Phone, label: "Số điện thoại", value: "Chưa cập nhật" },
  { icon: Mail, label: "Email liên hệ", value: "Chưa cập nhật" },
  { icon: CalendarDays, label: "Ngày phát hành", value: "Chưa cập nhật" },
  { icon: RefreshCw, label: "Cập nhật gần nhất", value: "Chưa cập nhật" },
];

const focusAreas = [
  {
    icon: Laptop,
    title: "Công nghệ",
    description: "Phần mềm và nền tảng số",
    tone: "technology",
  },
  {
    icon: Cpu,
    title: "Trí tuệ nhân tạo",
    description: "AI và ứng dụng thông minh",
    tone: "artificial-intelligence",
  },
  {
    icon: Factory,
    title: "Chế tạo máy",
    description: "Thiết kế, tự động hóa và sản xuất",
    tone: "manufacturing",
  },
];

const principles = [
  { icon: Target, title: "Hiệu quả", text: "Tối ưu học tập và công việc" },
  { icon: Sparkles, title: "Thông minh", text: "Ứng dụng AI và tự động hóa" },
  { icon: Layers3, title: "Đa lĩnh vực", text: "Học tập · Kỹ thuật · Chế tạo" },
  { icon: ShieldCheck, title: "Đáng tin cậy", text: "An toàn dữ liệu và ổn định" },
];

function Information() {
  return (
    <main className="information-page">
      <section className="information-hero">
        <div className="information-hero-grid" aria-hidden="true" />
        <div className="information-hero-copy">
          <div className="information-hero-brand">
            <img src="/ati-approved-logo.png" alt="ATI" />
            <div>
              <span>ATI GROUP</span>
              <small>TECHNOLOGY · AI · MANUFACTURING</small>
            </div>
          </div>
          <p className="information-eyebrow">ABOUT OUR ECOSYSTEM</p>
          <h1>Công nghệ tạo nên<br /><span>những khả năng mới.</span></h1>
          <p className="information-hero-description">
            Nền tảng công nghệ hỗ trợ học tập, làm việc và phát triển các giải pháp kỹ thuật,
            tự động hóa và chế tạo máy.
          </p>
          <div className="information-hero-actions">
            <a href="#information-about" className="information-primary-link">
              Khám phá hệ sinh thái <ArrowRight size={16} />
            </a>
            <a href="#information-details" className="information-secondary-link">
              Thông tin ứng dụng
            </a>
          </div>
        </div>
        <div className="information-hero-visual" aria-hidden="true">
          <div className="information-visual-orbit orbit-a" />
          <div className="information-visual-orbit orbit-b" />
          <div className="information-chip chip-ai"><Cpu size={25} /><span>AI</span></div>
          <div className="information-chip chip-gear"><Cog size={28} /></div>
          <div className="information-chip chip-factory"><Factory size={27} /></div>
          <div className="information-visual-core">
            <img src="/ati-approved-logo.png" alt="" />
          </div>
          <div className="information-visual-caption">ENGINEERING THE FUTURE</div>
        </div>
      </section>

      <section className="information-principles" aria-label="Giá trị cốt lõi">
        {principles.map(({ icon: Icon, title, text }) => (
          <div className="information-principle" key={title}>
            <span className="information-principle-icon"><Icon size={24} /></span>
            <span className="information-principle-copy">
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </section>

      <div className="information-lower-grid">
        <section className="information-about-panel" id="information-about">
          <div className="information-panel-heading">
            <span className="information-panel-icon"><Code2 size={20} /></span>
            <div>
              <p>WHO WE ARE</p>
              <h2>Giới thiệu về ATI Group</h2>
            </div>
          </div>
          <p className="information-about-copy">
            ATI Group định hướng phát triển các giải pháp công nghệ, trí tuệ nhân tạo và chế tạo máy.
            Hệ sinh thái được xây dựng để kết nối phần mềm, tự động hóa, thiết kế kỹ thuật
            và các công cụ hỗ trợ công việc thông minh.
          </p>
          <div className="information-focus-grid">
            {focusAreas.map(({ icon: Icon, title, description, tone }) => (
              <article className={`information-focus-card ${tone}`} key={title}>
                <span><Icon size={25} /></span>
                <strong>{title}</strong>
                <small>{description}</small>
              </article>
            ))}
          </div>
          <div className="information-about-note">
            <span className="information-note-dot" />
            <span>Phát triển từng bước – kết nối nhiều lĩnh vực – hướng đến giá trị thực tiễn.</span>
          </div>
        </section>

        <section className="information-details-panel" id="information-details">
          <div className="information-panel-heading">
            <span className="information-panel-icon"><Layers3 size={20} /></span>
            <div>
              <p>APPLICATION PROFILE</p>
              <h2>Thông tin ứng dụng</h2>
            </div>
          </div>
          <div className="information-details-list">
            {appDetails.map(({ icon: Icon, label, value, highlight }) => (
              <div className="information-detail-row" key={label}>
                <span className="information-detail-icon"><Icon size={17} /></span>
                <span className="information-detail-label">{label}</span>
                <strong className={highlight ? "is-highlight" : ""}>{value}</strong>
              </div>
            ))}
          </div>
          <div className="information-version-note">
            <span className="information-live-dot" />
            ATI Group · Nền tảng công nghệ
          </div>
        </section>
      </div>

      <footer className="information-footer">
        <span>© 2026 ATI Group. All rights reserved.</span>
        <span className="information-footer-credit">Developed with <Heart size={13} /> by <strong>Nguyễn Thế Tài</strong></span>
      </footer>
    </main>
  );
}

export default Information;
