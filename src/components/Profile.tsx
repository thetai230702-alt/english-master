import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  House,
  Save,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { auth } from "../firebase";
import "./Profile.css";

type ProfileTab = "personal" | "work" | "education" | "family";
type ProfileData = {
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  address: string;
  jobTitle: string;
  company: string;
  department: string;
  workAddress: string;
  school: string;
  major: string;
  degree: string;
  graduationYear: string;
  maritalStatus: string;
  emergencyContact: string;
  emergencyPhone: string;
};

const emptyProfile: ProfileData = {
  fullName: "", displayName: "", email: "", phone: "", birthday: "",
  gender: "", address: "", jobTitle: "", company: "", department: "",
  workAddress: "", school: "", major: "", degree: "", graduationYear: "",
  maritalStatus: "", emergencyContact: "", emergencyPhone: "",
};

const tabs: { id: ProfileTab; label: string; icon: typeof UserRound }[] = [
  { id: "personal", label: "Thông tin cá nhân", icon: UserRound },
  { id: "work", label: "Công việc", icon: BriefcaseBusiness },
  { id: "education", label: "Học vấn", icon: GraduationCap },
  { id: "family", label: "Gia đình", icon: House },
];

function Profile() {
  const user = auth.currentUser;
  const storageKey = `ntt-profile-${user?.uid ?? "guest"}`;
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [profile, setProfile] = useState<ProfileData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...emptyProfile, ...JSON.parse(saved) } : emptyProfile;
    } catch {
      return emptyProfile;
    }
  });
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    setProfile((current) => ({
      ...current,
      fullName: current.fullName || user?.displayName || "",
      displayName: current.displayName || user?.displayName || "",
      email: current.email || user?.email || "",
    }));
  }, [user]);

  const initials = useMemo(() => {
    const name = profile.fullName || user?.displayName || user?.email || "NTT";
    return name.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
  }, [profile.fullName, user]);

  const update = (key: keyof ProfileData, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSavedMessage("");
  };

  const saveProfile = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
      setSavedMessage("Thông tin đã được lưu trên thiết bị này.");
    } catch {
      setSavedMessage("Không thể lưu thông tin. Vui lòng thử lại.");
    }
  };

  const field = (
    label: string,
    key: keyof ProfileData,
    placeholder: string,
    type: string = "text",
    readOnly = false,
  ) => (
    <label className="profile-field" key={key}>
      <span>{label}</span>
      <input
        type={type}
        value={profile[key]}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => update(key, event.target.value)}
      />
    </label>
  );

  const selectField = (label: string, key: keyof ProfileData, options: string[]) => (
    <label className="profile-field" key={key}>
      <span>{label}</span>
      <select value={profile[key]} onChange={(event) => update(key, event.target.value)}>
        <option value="">-- Chọn --</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-hero-copy">
          <span className="profile-eyebrow">NTT GROUP · ACCOUNT CENTER</span>
          <h2>{profile.fullName || user?.displayName || "Hồ sơ của tôi"}</h2>
          <p>{user?.email || "Cập nhật thông tin tài khoản và hồ sơ cá nhân của bạn."}</p>
        </div>
        <div className="profile-verified"><ShieldCheck size={16} /> Tài khoản NTT</div>
      </section>

      <section className="profile-card">
        <div className="profile-card-heading">
          <div>
            <span className="profile-eyebrow">ACCOUNT PROFILE</span>
            <h3>Hồ sơ tài khoản</h3>
            <p>Quản lý thông tin cơ bản của bạn trong hệ sinh thái NTT GROUP.</p>
          </div>
          <button className="profile-save" type="button" onClick={saveProfile}>
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>

        <div className="profile-tabs" role="tablist" aria-label="Nhóm thông tin hồ sơ">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`profile-tab ${activeTab === id ? "active" : ""}`}
              key={id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} /> <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="profile-form" role="tabpanel">
          {activeTab === "personal" && (
            <>
              <div className="profile-section-title"><UserRound size={17} /> Thông tin cá nhân</div>
              <div className="profile-grid">
                {field("Họ và tên", "fullName", "Nhập họ và tên")}
                {field("Tên hiển thị", "displayName", "Tên hiển thị trên hệ thống")}
                {field("Email tài khoản", "email", "Email đăng nhập", "email", true)}
                {field("Số điện thoại", "phone", "Nhập số điện thoại", "tel")}
                {field("Ngày sinh", "birthday", "", "date")}
                {selectField("Giới tính", "gender", ["Nam", "Nữ", "Khác", "Không muốn tiết lộ"])}
                {field("Địa chỉ", "address", "Số nhà, đường, phường/xã, tỉnh/thành")}
              </div>
            </>
          )}

          {activeTab === "work" && (
            <>
              <div className="profile-section-title"><BriefcaseBusiness size={17} /> Thông tin công việc</div>
              <div className="profile-grid">
                {field("Vị trí công việc", "jobTitle", "Ví dụ: Chuyên viên")}
                {field("Công ty / Tổ chức", "company", "Tên công ty")}
                {field("Phòng ban", "department", "Tên phòng ban")}
                {field("Địa chỉ làm việc", "workAddress", "Địa chỉ nơi làm việc")}
              </div>
            </>
          )}

          {activeTab === "education" && (
            <>
              <div className="profile-section-title"><GraduationCap size={17} /> Thông tin học vấn</div>
              <div className="profile-grid">
                {field("Trường học", "school", "Tên trường / cơ sở đào tạo")}
                {field("Chuyên ngành", "major", "Chuyên ngành học")}
                {field("Bằng cấp", "degree", "Ví dụ: Cử nhân")}
                {field("Năm tốt nghiệp", "graduationYear", "YYYY", "number")}
              </div>
            </>
          )}

          {activeTab === "family" && (
            <>
              <div className="profile-section-title"><House size={17} /> Thông tin gia đình</div>
              <div className="profile-grid">
                {selectField("Tình trạng hôn nhân", "maritalStatus", ["Độc thân", "Đã kết hôn", "Khác"])}
                {field("Người liên hệ khẩn cấp", "emergencyContact", "Họ tên người liên hệ")}
                {field("Số điện thoại liên hệ", "emergencyPhone", "Số điện thoại", "tel")}
              </div>
            </>
          )}
        </div>

        <div className="profile-card-footer">
          <span>{savedMessage || "Thông tin cá nhân chỉ hiển thị trong tài khoản của bạn trên thiết bị này."}</span>
          <button className="profile-save mobile-save" type="button" onClick={saveProfile}>
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>
      </section>
    </div>
  );
}

export default Profile;
