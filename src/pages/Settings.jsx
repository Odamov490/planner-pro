import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { auth, db, storage } from "../firebase";
import {
  updateProfile,
  reauthenticateWithPopup, GoogleAuthProvider,
  deleteUser, signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { logActivity, LOG_ACTIONS } from "../utils/logActivity";

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS
// ═══════════════════════════════════════════════════════════════
const card = {
  background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 20, padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  marginBottom: 16,
};
const inputSt = {
  width: "100%", padding: "11px 14px",
  border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12,
  fontSize: 14, color: "#1a1a1a", background: "#fafafa",
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color 0.15s",
};
const labelSt = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.06em",
  marginBottom: 7, display: "block",
};
const sectionTitle = {
  fontSize: 15, fontWeight: 800, color: "#1a1a1a",
  marginBottom: 18, display: "flex", alignItems: "center", gap: 8,
};
const divider = { height: 1, background: "rgba(0,0,0,0.06)", margin: "20px 0" };

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
const Toast = ({ msg, type = "success", onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, padding: "11px 22px", borderRadius: 999,
      background: type === "error" ? "#fef2f2" : "#f0fdf4",
      border: `1px solid ${type === "error" ? "#fecaca" : "#bbf7d0"}`,
      color: type === "error" ? "#dc2626" : "#16a34a",
      fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      animation: "toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {type === "error" ? "✕ " : "✓ "}{msg}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// BTN
// ═══════════════════════════════════════════════════════════════
const Btn = ({ onClick, disabled, children, variant = "primary", style: s = {} }) => {
  const V = {
    primary: { background: "#1a1a1a", color: "#fff",    border: "none" },
    outline: { background: "transparent", color: "#6b7280", border: "1px solid rgba(0,0,0,0.12)" },
    danger:  { background: "#fef2f2",  color: "#ef4444", border: "1px solid #fecaca" },
  };
  const v = V[variant] || V.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 20px", borderRadius: 11, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", fontSize: 13, fontWeight: 700,
      opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...v, ...s,
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.82"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={labelSt}>{label}</label>}
    <input {...props} style={{ ...inputSt, ...props.style }}
      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
      onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
function Settings() {
  const { user } = useContext(AuthContext);
  const uid = user?.uid;
  const fileInputRef = useRef(null);

  // ── Profile state ──
  const [name,      setName]      = useState(user?.displayName || "");
  const [phone,     setPhone]     = useState("");
  const [bio,       setBio]       = useState("");
  const [location,  setLocation]  = useState("");
  const [website,   setWebsite]   = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || "");

  // ── Upload state ──
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [previewFile, setPreviewFile] = useState(null); // local blob preview

  // ── Preferences ──
  const [theme,      setTheme]      = useState("light");
  const [lang,       setLang]       = useState("uz");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif,  setPushNotif]  = useState(true);
  const [soundNotif, setSoundNotif] = useState(false);

  // ── UI ──
  const [toast,   setToast]   = useState(null);
  const [loading, setLoading] = useState({});
  const [tab,     setTab]     = useState("profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  // ── Load Firestore user data ──
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setPhone(d.phone       || "");
      setBio(d.bio           || "");
      setLocation(d.location || "");
      setWebsite(d.website   || "");
      setTheme(d.theme       || "light");
      setLang(d.lang         || "uz");
      setEmailNotif(d.emailNotif !== false);
      setPushNotif(d.pushNotif   !== false);
      setSoundNotif(d.soundNotif || false);
      if (d.photoURL) setAvatarUrl(d.photoURL);
    });
  }, [uid]);

  // ── File tanlash ──
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Fayl 3MB dan kichik bo'lishi kerak", "error");
      return;
    }
    // Local preview
    const blobUrl = URL.createObjectURL(file);
    setPreviewFile({ file, blobUrl });
  };

  // ── Drag & drop ──
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 3 * 1024 * 1024) { showToast("Fayl 3MB dan kichik bo'lishi kerak", "error"); return; }
    setPreviewFile({ file, blobUrl: URL.createObjectURL(file) });
  };

  // ── Upload to Firebase Storage ──
  const uploadAvatar = () => {
    return new Promise((resolve, reject) => {
      if (!previewFile) return resolve(avatarUrl);
      setUploading(true);
      setUploadPct(0);
      const storageRef = ref(storage, `avatars/${uid}-${Date.now()}`);
      const uploadTask = uploadBytesResumable(storageRef, previewFile.file);
      uploadTask.on(
        "state_changed",
        (snap) => setUploadPct(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => { setUploading(false); reject(err); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploading(false);
          setUploadPct(0);
          setAvatarUrl(url);
          setPreviewFile(null);
          resolve(url);
        }
      );
    });
  };

  // ── Save profile ──
  const saveProfile = async () => {
    if (!name.trim()) return showToast("Ism bo'sh bo'lmasligi kerak", "error");
    setLoad("profile", true);
    try {
      const finalAvatar = await uploadAvatar();
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
        photoURL: finalAvatar,
      });
      await setDoc(doc(db, "users", uid), {
        name: name.trim(), phone, bio, location, website,
        photoURL: finalAvatar, updatedAt: new Date(),
      }, { merge: true });
      await logActivity({ action: LOG_ACTIONS.PROFILE_UPDATED, detail: `Profil yangilandi`, page: "settings" });
      showToast("Profil saqlandi ✓");
    } catch (e) {
      showToast("Xatolik yuz berdi", "error");
    } finally {
      setLoad("profile", false);
    }
  };

  // ── Reset to Google photo ──
  const resetToGoogle = () => {
    const googlePhoto = auth.currentUser?.providerData?.[0]?.photoURL || "";
    setAvatarUrl(googlePhoto);
    setPreviewFile(null);
    showToast("Google foto qayta o'rnatildi");
  };

  // ── Save preferences ──
  const savePreferences = async () => {
    setLoad("prefs", true);
    try {
      await setDoc(doc(db, "users", uid), { theme, lang, emailNotif, pushNotif, soundNotif }, { merge: true });
      showToast("Sozlamalar saqlandi");
    } catch {
      showToast("Xatolik", "error");
    } finally {
      setLoad("prefs", false);
    }
  };

  // ── Delete account ──
  const deleteAccount = async () => {
    if (deleteInput !== "O'CHIRISH") return;
    setLoad("delete", true);
    try {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(auth.currentUser, provider);
      await logActivity({ action: LOG_ACTIONS.LOGOUT, detail: "Hisob o'chirildi", page: "settings" });
      await deleteUser(auth.currentUser);
    } catch {
      showToast("O'chirishda xatolik", "error");
      setLoad("delete", false);
    }
  };

  const displayAvatar = previewFile?.blobUrl || avatarUrl;

  const TABS = [
    { id: "profile", label: "👤 Profil"          },
    { id: "account", label: "📧 Hisob"            },
    { id: "notif",   label: "🔔 Bildirishnomalar" },
    { id: "prefs",   label: "🎨 Ko'rinish"        },
    { id: "danger",  label: "⚠️ Xavfli"           },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: "#1a1a1a" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Sozlamalar</h1>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>
            {new Date().toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "short" })}
          </p>
        </div>

        {/* ── PROFILE SUMMARY CARD ── */}
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "3px solid #e5e7eb", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#6366f1" }}>
              {displayAvatar
                ? <img src={displayAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user?.displayName || user?.email || "?").slice(0, 2).toUpperCase()
              }
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{user?.displayName || "Ism yo'q"}</div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>{user?.email}</div>
            {phone && <div style={{ fontSize: 12, color: "#9ca3af" }}>📱 {phone}</div>}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, background: "#f0fdf4", color: "#22c55e", padding: "4px 10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>● Online</div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", borderRadius: 14, padding: 6, border: "1px solid rgba(0,0,0,0.07)", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 10px", borderRadius: 10, border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              background: tab === t.id ? "#1a1a1a" : "transparent",
              color:      tab === t.id ? "#fff"    : "#9ca3af",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            TAB: PROFIL
        ══════════════════════════════════════ */}
        {tab === "profile" && (
          <div style={card}>
            <div style={sectionTitle}>👤 Profil ma'lumotlari</div>

            {/* ── AVATAR UPLOAD ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Profil rasmi</label>

              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Avatar preview */}
                <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid #e5e7eb", flexShrink: 0, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#6366f1", position: "relative" }}>
                  {displayAvatar
                    ? <img src={displayAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => (e.target.style.display = "none")} />
                    : (user?.displayName || "?").slice(0, 2).toUpperCase()
                  }
                  {previewFile && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", textAlign: "center", fontSize: 9, color: "#fff", padding: "2px 0", fontWeight: 700 }}>YANGI</div>
                  )}
                </div>

                {/* Upload zone */}
                <div style={{ flex: 1 }}>
                  {/* Drag & drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed rgba(99,102,241,0.3)", borderRadius: 14,
                      padding: "16px", textAlign: "center", cursor: "pointer",
                      background: "#f9f9ff", transition: "all 0.15s", marginBottom: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#f0f0ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.background = "#f9f9ff"; }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: 2 }}>
                      Rasm tanlash
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      yoki shu yerga tashlang · JPG, PNG, WebP · max 3MB
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />

                  {/* Upload progress */}
                  {uploading && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                        <span>Yuklanmoqda…</span>
                        <span>{uploadPct}%</span>
                      </div>
                      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${uploadPct}%`, background: "#6366f1", borderRadius: 3, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  )}

                  {/* Selected file info */}
                  {previewFile && !uploading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f0f0ff", borderRadius: 10, border: "1px solid #e0e7ff", marginBottom: 10 }}>
                      <span style={{ fontSize: 12 }}>🖼</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {previewFile.file.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        {(previewFile.file.size / 1024).toFixed(0)}KB
                      </span>
                      <button onClick={() => setPreviewFile(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>✕</button>
                    </div>
                  )}

                  {/* Reset to Google */}
                  <button onClick={resetToGoogle} style={{ fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>
                    ↺ Google fotosiga qaytarish
                  </button>
                </div>
              </div>
            </div>

            <div style={divider} />

            <Input label="Ism familiya" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz…" />
            <Input label="📱 Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" type="tel" />
            <Input label="📍 Joylashuv" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Toshkent, O'zbekiston" />
            <Input label="🌐 Veb-sayt" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" type="url" />

            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>📝 Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="O'zingiz haqida qisqacha…" rows={3}
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.6 }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </div>

            <Btn onClick={saveProfile} disabled={loading.profile || uploading} style={{ width: "100%", padding: "13px" }}>
              {uploading ? `⬆️ Yuklanmoqda ${uploadPct}%…` : loading.profile ? "Saqlanmoqda…" : "✓ Profilni saqlash"}
            </Btn>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: HISOB
        ══════════════════════════════════════ */}
        {tab === "account" && (
          <div style={card}>
            <div style={sectionTitle}>📧 Hisob ma'lumotlari</div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Email manzil</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f9fafb", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
                <span style={{ fontSize: 18 }}>📧</span>
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{user?.email}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: "#f0fdf4", color: "#22c55e", padding: "2px 8px", borderRadius: 6, border: "1px solid #bbf7d0" }}>✓ Tasdiqlangan</span>
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Google orqali kirgansiz, email o'zgartirilmaydi</p>
            </div>

            <div style={divider} />

            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Kirish usuli</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f9fafb", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 20, height: 20 }} />
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>Google</span>
              </div>
            </div>

            <div style={divider} />

            <label style={labelSt}>Hisob ma'lumotlari</label>
            {[
              { label: "UID",               value: uid?.slice(0, 20) + "…" },
              { label: "Ro'yxatdan o'tgan", value: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("uz-UZ") : "—" },
              { label: "Oxirgi kirish",     value: user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString("uz-UZ") : "—" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: BILDIRISHNOMALAR
        ══════════════════════════════════════ */}
        {tab === "notif" && (
          <div style={card}>
            <div style={sectionTitle}>🔔 Bildirishnoma sozlamalari</div>
            {[
              { key: "emailNotif", val: emailNotif, set: setEmailNotif, icon: "📧", label: "Email bildirishnomalar", desc: "Yangi vazifalar va yangiliklar haqida email oling" },
              { key: "pushNotif",  val: pushNotif,  set: setPushNotif,  icon: "🔔", label: "Push bildirishnomalar", desc: "Brauzer orqali real-time xabarlar" },
              { key: "soundNotif", val: soundNotif, set: setSoundNotif, icon: "🔊", label: "Ovozli signal",          desc: "Bildirishnoma kelganda ovoz chiqarish" },
            ].map((item) => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{item.desc}</div>
                </div>
                <div onClick={() => item.set(!item.val)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: item.val ? "#22c55e" : "#e5e7eb", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: item.val ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                </div>
              </div>
            ))}
            <Btn onClick={savePreferences} disabled={loading.prefs} style={{ width: "100%", padding: "13px", marginTop: 20 }}>
              {loading.prefs ? "Saqlanmoqda…" : "✓ Saqlash"}
            </Btn>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: KO'RINISH
        ══════════════════════════════════════ */}
        {tab === "prefs" && (
          <div style={card}>
            <div style={sectionTitle}>🎨 Ko'rinish va til</div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Mavzu</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { v: "light", l: "☀️ Yorug'"   },
                  { v: "dark",  l: "🌙 Qorong'i" },
                  { v: "auto",  l: "🖥 Avto"     },
                ].map((t) => (
                  <div key={t.v} onClick={() => setTheme(t.v)} style={{ flex: 1, padding: "14px", borderRadius: 14, cursor: "pointer", border: `2px solid ${theme === t.v ? "#1a1a1a" : "rgba(0,0,0,0.08)"}`, background: theme === t.v ? "#f3f4f6" : "#fafafa", transition: "all 0.15s", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{t.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Til</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { v: "uz", l: "🇺🇿 O'zbek" },
                  { v: "ru", l: "🇷🇺 Русский" },
                  { v: "en", l: "🇬🇧 English" },
                ].map((l) => (
                  <button key={l.v} onClick={() => setLang(l.v)} style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: lang === l.v ? "#1a1a1a" : "#f3f4f6", color: lang === l.v ? "#fff" : "#6b7280", transition: "all 0.15s" }}>{l.l}</button>
                ))}
              </div>
            </div>

            <Btn onClick={savePreferences} disabled={loading.prefs} style={{ width: "100%", padding: "13px" }}>
              {loading.prefs ? "Saqlanmoqda…" : "✓ Saqlash"}
            </Btn>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: XAVFLI ZONA
        ══════════════════════════════════════ */}
        {tab === "danger" && (
          <div>
            <div style={{ ...card, border: "1px solid rgba(245,158,11,0.3)", background: "#fffbeb" }}>
              <div style={{ ...sectionTitle }}>🚪 Tizimdan chiqish</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, marginTop: 0 }}>
                Barcha qurilmalardan chiqish amalga oshiriladi.
              </p>
              <Btn variant="outline" onClick={async () => {
                await logActivity({ action: LOG_ACTIONS.LOGOUT, detail: "Tizimdan chiqdi", page: "settings" });
                await signOut(auth);
              }} style={{ borderColor: "#f59e0b", color: "#d97706" }}>
                🚪 Chiqish
              </Btn>
            </div>

            <div style={{ ...card, border: "1px solid #fecaca", background: "#fef2f2" }}>
              <div style={{ ...sectionTitle, color: "#ef4444" }}>⚠️ Hisobni o'chirish</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, marginTop: 0 }}>
                Bu amalni qaytarib bo'lmaydi. Barcha ma'lumotlaringiz <strong>butunlay o'chib ketadi.</strong>
              </p>
              {!showDeleteConfirm ? (
                <Btn variant="danger" onClick={() => setShowDeleteConfirm(true)}>🗑 Hisobni o'chirish</Btn>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, marginBottom: 10 }}>
                    Tasdiqlash uchun <code style={{ background: "#fee2e2", padding: "1px 6px", borderRadius: 4 }}>O'CHIRISH</code> yozing:
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="O'CHIRISH"
                      style={{ ...inputSt, flex: 1, borderColor: "#fca5a5" }}
                      onFocus={(e) => (e.target.style.borderColor = "#ef4444")}
                      onBlur={(e)  => (e.target.style.borderColor = "#fca5a5")}
                    />
                    <Btn variant="danger" onClick={deleteAccount} disabled={deleteInput !== "O'CHIRISH" || loading.delete}>
                      {loading.delete ? "O'chirilmoqda…" : "Tasdiqlash"}
                    </Btn>
                    <Btn variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>Bekor</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>
    </div>
  );
}

export default Settings;
