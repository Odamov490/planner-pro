import { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../firebase";

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 18 }}>
    {label && (
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
      }}>{label}</label>
    )}
    {hint && (
      <p style={{ fontSize: 11, color: "#9ca3af", marginTop: -2, marginBottom: 6 }}>{hint}</p>
    )}
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} style={{
    width: "100%", padding: "10px 14px",
    border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10,
    fontSize: 14, color: "#1a1a1a", background: "#fafafa",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.15s",
    ...props.style,
  }}
    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
    onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
  />
);

const Btn = ({ onClick, disabled, children, variant = "primary", style: s = {} }) => {
  const variants = {
    primary: { background: "#1a1a1a", color: "#fff", border: "none" },
    outline: { background: "transparent", color: "#6b7280", border: "1px solid rgba(0,0,0,0.12)" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 18px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", fontSize: 13, fontWeight: 600,
      opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      ...v, ...s,
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPANY EDITOR MODAL
// Props:
//   visible     - boolean
//   onClose     - () => void
//   onSave      - (data) => Promise<void>
//   initialData - kompaniya ma'lumotlari (tahrirlash uchun)
//   isNew       - yangi kompaniya yaratish
// ═══════════════════════════════════════════════════════════════
export default function CompanyEditor({ visible, onClose, onSave, initialData, isNew = false }) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [website,     setWebsite]     = useState("");
  const [logoUrl,     setLogoUrl]     = useState("");
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [busy,        setBusy]        = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // initialData o'zgarganda formni to'ldirish
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setWebsite(initialData.website || "");
      setLogoUrl(initialData.logo || "");
      setLogoPreview(initialData.logo || "");
    } else {
      setName(""); setDescription(""); setWebsite(""); setLogoUrl(""); setLogoPreview("");
    }
    setLogoFile(null);
  }, [initialData, visible]);

  // ESC bilan yopish
  useEffect(() => {
    if (!visible) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [visible, onClose]);

  if (!visible) return null;

  // ── Logo fayl tanlash ──
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Fayl hajmi 2MB dan oshmasligi kerak");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Logo URL o'zgarganda preview ──
  const handleLogoUrlChange = (val) => {
    setLogoUrl(val);
    if (!logoFile) setLogoPreview(val);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!name.trim()) return;
    setBusy(true);

    let finalLogoUrl = logoUrl;

    // Agar fayl tanlangan bo'lsa, Firebase Storage ga upload
    if (logoFile) {
      try {
        setUploadProgress(true);
        const uid = auth.currentUser?.uid;
        const storageRef = ref(storage, `company-logos/${uid}-${Date.now()}`);
        await uploadBytes(storageRef, logoFile);
        finalLogoUrl = await getDownloadURL(storageRef);
        setUploadProgress(false);
      } catch (err) {
        console.error("Logo upload xatosi:", err);
        setUploadProgress(false);
        // Storage yo'q bo'lsa, preview dan foydalanish
        finalLogoUrl = logoPreview || logoUrl;
      }
    }

    await onSave({
      name: name.trim(),
      description: description.trim(),
      website: website.trim(),
      logo: finalLogoUrl,
    });

    setBusy(false);
    onClose();
  };

  const hasLogo = logoPreview || logoUrl;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 500,
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        animation: "cePopIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
            {isNew ? "🏢 Kompaniya yaratish" : "✏️ Kompaniyani tahrirlash"}
          </h3>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.1)",
            background: "#f9fafb", cursor: "pointer", fontSize: 15, color: "#6b7280",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px 24px", overflowY: "auto", flex: 1 }}>

          {/* Logo section */}
          <Field label="Logo">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              {/* Preview */}
              <div style={{
                width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                background: hasLogo ? "transparent" : "#f3f4f6",
                border: "2px dashed rgba(0,0,0,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", fontSize: 28,
              }}>
                {hasLogo
                  ? <img src={logoPreview || logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setLogoPreview("")} />
                  : "🏢"
                }
              </div>

              {/* Upload button */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                  background: "#f3f4f6", color: "#374151", fontSize: 13, fontWeight: 600,
                  border: "1px solid rgba(0,0,0,0.1)", transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                >
                  📁 Fayl tanlash
                  <input type="file" accept="image/*" onChange={handleFileChange}
                    style={{ display: "none" }} />
                </label>
                {logoFile && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                    ✓ {logoFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Logo URL */}
            <Input
              value={logoUrl}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
              placeholder="yoki logo URL manzilini kiriting…"
            />
          </Field>

          {/* Company name */}
          <Field label="Kompaniya nomi *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: TechCorp LLC"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </Field>

          {/* Description */}
          <Field label="Tavsif">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kompaniya haqida qisqacha ma'lumot…"
              rows={3}
              style={{
                width: "100%", padding: "10px 14px",
                border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10,
                fontSize: 14, fontFamily: "inherit", resize: "vertical",
                outline: "none", background: "#fafafa", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
            />
          </Field>

          {/* Website */}
          <Field label="Veb-sayt (ixtiyoriy)">
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://company.com"
              type="url"
            />
          </Field>

          {/* Preview card */}
          {name && (
            <div style={{
              background: "linear-gradient(135deg,#1a1a2e,#16213e)",
              borderRadius: 16, padding: "16px 18px", marginTop: 4,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", fontSize: 24,
              }}>
                {(logoPreview || logoUrl)
                  ? <img src={logoPreview || logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                  : "🏢"
                }
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{name}</div>
                {description && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                    {description.slice(0, 60)}{description.length > 60 ? "…" : ""}
                  </div>
                )}
                {website && (
                  <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>{website}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "flex-end",
          padding: "16px 24px 20px", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0,
        }}>
          <Btn variant="outline" onClick={onClose}>Bekor</Btn>
          <Btn
            onClick={handleSubmit}
            disabled={!name.trim() || busy || uploadProgress}
          >
            {uploadProgress ? "⬆️ Yuklanmoqda…" : busy ? "Saqlanmoqda…" : isNew ? "✓ Yaratish" : "✓ Saqlash"}
          </Btn>
        </div>
      </div>

      <style>{`
        @keyframes cePopIn {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
