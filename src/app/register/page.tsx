"use client";

import { useState } from "react";

interface FormData {
  fullName: string;
  profession: string;
  organisation: string;
  email: string;
  phone: string;
}

interface FormErrors {
  fullName?: string;
  profession?: string;
  organisation?: string;
  email?: string;
  phone?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function RegistrationPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    profession: "",
    organisation: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!formData.profession.trim()) newErrors.profession = "Profession is required.";
    if (!formData.organisation.trim()) newErrors.organisation = "Organisation is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\+?[\d\s\-().]{7,20}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/reg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  const fields: { id: keyof FormData; label: string; type: string; placeholder: string; icon: string }[] = [
    { id: "fullName",     label: "Full name",     type: "text",  placeholder: "Jane Doe",            icon: "bi-person"    },
    { id: "profession",   label: "Profession",    type: "text",  placeholder: "Research Scientist",  icon: "bi-briefcase" },
    { id: "organisation", label: "Organisation",  type: "text",  placeholder: "Ministry of Climate", icon: "bi-building"  },
    { id: "email",        label: "Email address", type: "email", placeholder: "jane@example.com",    icon: "bi-envelope"  },
    { id: "phone",        label: "Phone number",  type: "tel",   placeholder: "+971 50 000 0000",    icon: "bi-telephone" },
  ];

  // ── Success ────────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div style={S.page}>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" />

        {/* Hero */}
        <div style={S.hero}>
          <div style={S.heroInner}>
            <div style={S.eyebrow}>Registration · United Arab Emirates</div>
            <h1 style={S.heroTitle}>Application submitted</h1>
            <p style={S.heroSub}>
              Your registration has been received and is now under review.
            </p>
          </div>
        </div>

        <div style={S.content}>
          <div style={{ maxWidth: 580 }}>
            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <div style={S.cardEyebrow}>Confirmation</div>
                  <h2 style={S.cardTitle}>What happens next</h2>
                </div>
                <span style={{ ...S.badge, background: "#2d6a4f" }}>
                  <i className="bi bi-clock" style={{ marginRight: 5 }} />Pending review
                </span>
              </div>
              <div style={S.cardBody}>
                <p style={{ marginBottom: "1.1rem", lineHeight: 1.7, fontSize: ".95rem", color: "#3a3a3a" }}>
                  Thank you, <strong>{formData.fullName}</strong>. A confirmation has been sent to{" "}
                  <strong>{formData.email}</strong>. Our team will review your details and notify you once a decision has been made.
                </p>
                <table style={S.table}>
                  <tbody>
                    {[
                      { label: "Name",         value: formData.fullName,     icon: "bi-person"    },
                      { label: "Profession",   value: formData.profession,   icon: "bi-briefcase" },
                      { label: "Organisation", value: formData.organisation, icon: "bi-building"  },
                      { label: "Email",        value: formData.email,        icon: "bi-envelope"  },
                      { label: "Phone",        value: formData.phone,        icon: "bi-telephone" },
                    ].map(({ label, value, icon }) => (
                      <tr key={label} style={{ borderBottom: "1px solid #e8e4db" }}>
                        <td style={{ padding: ".5rem .75rem .5rem 0", width: 140, color: "#7a8a80", fontSize: ".83rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>
                          <i className={`bi ${icon}`} style={{ marginRight: 6, color: "#6fad8a" }} />{label}
                        </td>
                        <td style={{ padding: ".5rem 0", fontSize: ".93rem", color: "#1c2b22" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: "1.5rem" }}>
                  <button style={S.btnOutline} onClick={() => { setStatus("idle"); setFormData({ fullName: "", profession: "", organisation: "", email: "", phone: "" }); }}>
                    <i className="bi bi-arrow-left" style={{ marginRight: 6 }} />Submit another registration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" />
      <style>{`
        @keyframes pa-spin { to { transform: rotate(360deg); } }
        .pa-input:focus { border-color: #2d6a4f !important; outline: none; box-shadow: 0 0 0 3px rgba(45,106,79,.12); }
        .pa-btn-primary:hover:not(:disabled) { background: #1a4731 !important; }
        .pa-btn-outline:hover { background: rgba(45,106,79,.07) !important; }
        .pa-card-hover:hover { box-shadow: 0 4px 20px rgba(0,0,0,.09) !important; }
      `}</style>

      {/* Hero — identical rhythm to Atlas home */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.eyebrow}>Registration · United Arab Emirates</div>
          <h1 style={S.heroTitle}>Register your interest<br />in the UAE Pollen Atlas</h1>
          <p style={S.heroSub}>
            Submit your details below. You will receive a confirmation email immediately and a
            second notification once your application has been reviewed.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: "1.5rem", flexWrap: "wrap" }}>
            <a href="/" style={S.btnPrimary}><i className="bi bi-geo-alt" style={{ marginRight: 6 }} />Open the map</a>
            <a href="/forecast" style={S.btnOutline}><i className="bi bi-flower2" style={{ marginRight: 6 }} />Today&apos;s forecast</a>
          </div>
        </div>
      </div>

      <div style={S.content}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,.85fr)", gap: "0.75rem", alignItems: "start" }}>

          {/* ── Form card ── */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div>
                <div style={S.cardEyebrow}>New application</div>
                <h2 style={S.cardTitle}>Your details</h2>
              </div>
              <span style={S.pill}>
                <i className="bi bi-shield-check" style={{ marginRight: 5 }} />All fields required
              </span>
            </div>

            <div style={S.cardBody}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {fields.map(({ id, label, type, placeholder, icon }) => (
                  <div key={id}>
                    <label htmlFor={id} style={S.inputLabel}>
                      <i className={`bi ${icon}`} style={{ color: "#6fad8a", marginRight: 6 }} />
                      {label}
                    </label>
                    <input
                      id={id}
                      name={id}
                      type={type}
                      placeholder={placeholder}
                      value={formData[id]}
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pa-input"
                      style={{
                        ...S.input,
                        borderColor: errors[id] ? "#c0392b" : "#d6d0c4",
                      }}
                    />
                    {errors[id] && (
                      <div style={S.errorText}>
                        <i className="bi bi-exclamation-circle" style={{ marginRight: 5 }} />{errors[id]}
                      </div>
                    )}
                  </div>
                ))}

                {status === "error" && (
                  <div style={S.alertError}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 8, flexShrink: 0 }} />
                    {errorMessage}
                  </div>
                )}

                <button
                  className="pa-btn-primary"
                  onClick={handleSubmit}
                  disabled={status === "loading"}
                  style={{ ...S.btnPrimary, justifyContent: "center", marginTop: ".25rem", border: "none", cursor: status === "loading" ? "not-allowed" : "pointer", opacity: status === "loading" ? .65 : 1 }}
                >
                  {status === "loading" ? (
                    <>
                      <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "pa-spin .7s linear infinite", display: "inline-block", marginRight: 8 }} />
                      Submitting…
                    </>
                  ) : (
                    <><i className="bi bi-send" style={{ marginRight: 7 }} />Send registration</>
                  )}
                </button>

                <p style={{ fontSize: ".78rem", color: "#9aa89f", textAlign: "center", marginTop: ".25rem" }}>
                  Your information is used solely for registration purposes.
                </p>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <div style={S.cardEyebrow}>Process</div>
                  <h2 style={S.cardTitle}>How it works</h2>
                </div>
              </div>
              <div style={S.cardBody}>
                {[
                  { step: "01", icon: "bi-pencil-square",    title: "Fill in the form",    desc: "Complete all five fields and submit." },
                  { step: "02", icon: "bi-envelope-check",   title: "Confirmation email",  desc: "An instant acknowledgement is sent to you." },
                  { step: "03", icon: "bi-clipboard2-check", title: "Team review",         desc: "Your application is assessed by our team." },
                  { step: "04", icon: "bi-bell",             title: "Decision email",      desc: "Accepted applicants are notified by email." },
                ].map(({ step, icon, title, desc }, i, arr) => (
                  <div key={step} style={{ display: "flex", gap: 12, padding: ".6rem 0", borderBottom: i < arr.length - 1 ? "1px solid #e8e4db" : "none" }}>
                    <span style={{ fontFamily: "monospace", fontSize: ".75rem", color: "#9aa89f", paddingTop: 3, minWidth: 22 }}>{step}</span>
                    <i className={`bi ${icon}`} style={{ color: "#6fad8a", fontSize: "1rem", paddingTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".88rem", color: "#1c2b22" }}>{title}</div>
                      <div style={{ fontSize: ".8rem", color: "#7a8a80", marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <div style={S.cardEyebrow}>Access · UAE Atlas</div>
                  <h2 style={S.cardTitle}>Who should register</h2>
                </div>
              </div>
              <div style={S.cardBody}>
                {[
                  { icon: "bi-tree",         label: "Botanists & field researchers"  },
                  { icon: "bi-hospital",     label: "Allergists & medical staff"     },
                  { icon: "bi-hexagon-fill", label: "Beekeepers & apiarists"         },
                  { icon: "bi-cloud-sun",    label: "Meteorologists & forecasters"   },
                  { icon: "bi-building",     label: "Government & regulatory bodies" },
                ].map(({ icon, label }, i, arr) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: ".4rem 0", borderBottom: i < arr.length - 1 ? "1px solid #e8e4db" : "none", fontSize: ".9rem", color: "#1c2b22" }}>
                    <i className={`bi ${icon}`} style={{ color: "#6fad8a", fontSize: "1rem", flexShrink: 0 }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .reg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Design tokens — exact match to Atlas screenshot ─────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f0ede6",       // warm cream — the Atlas page background
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: "#1c2b22",
  },
  hero: {
    padding: "3rem 0 2.5rem",
    borderBottom: "1px solid #ddd8ce",
  },
  heroInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 2rem",
  },
  eyebrow: {
    fontSize: ".72rem",
    fontWeight: 600,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "#4a7c59",
    marginBottom: ".75rem",
  },
  heroTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
    fontWeight: 700,
    lineHeight: 1.18,
    color: "#1a2e22",
    margin: "0 0 .9rem",
    maxWidth: "18ch",
  },
  heroSub: {
    fontSize: ".97rem",
    color: "#4a5c50",
    lineHeight: 1.7,
    maxWidth: "56ch",
    margin: 0,
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    padding: ".62rem 1.2rem",
    background: "#2d6a4f",
    color: "#fff",
    borderRadius: 6,
    fontSize: ".88rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "background .15s",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  btnOutline: {
    display: "inline-flex",
    alignItems: "center",
    padding: ".62rem 1.2rem",
    background: "transparent",
    color: "#2d6a4f",
    border: "1.5px solid #2d6a4f",
    borderRadius: 6,
    fontSize: ".88rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "background .15s",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "1.75rem 2rem 3rem",
  },
  card: {
    background: "#fff",
    border: "1px solid #ddd8ce",
    borderRadius: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,.05)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "1rem 1.25rem .75rem",
    borderBottom: "1px solid #ede9e1",
  },
  cardEyebrow: {
    fontSize: ".72rem",
    fontWeight: 600,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: "#6a8a72",
    marginBottom: ".25rem",
  },
  cardTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#1a2e22",
    margin: 0,
  },
  cardBody: {
    padding: "1.1rem 1.25rem",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: ".28rem .7rem",
    borderRadius: 999,
    fontSize: ".78rem",
    fontWeight: 600,
    color: "#fff",
    whiteSpace: "nowrap" as const,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: ".25rem .65rem",
    borderRadius: 999,
    fontSize: ".75rem",
    fontWeight: 500,
    background: "#eaf2ed",
    color: "#2d6a4f",
    whiteSpace: "nowrap" as const,
  },
  inputLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: ".75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: ".06em",
    color: "#6a8a72",
    marginBottom: ".35rem",
  },
  input: {
    width: "100%",
    padding: ".6rem .85rem",
    background: "#faf8f4",
    border: "1px solid #d6d0c4",
    borderRadius: 6,
    fontSize: ".94rem",
    color: "#1c2b22",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    transition: "border-color .15s",
  },
  errorText: {
    marginTop: ".3rem",
    fontSize: ".78rem",
    color: "#c0392b",
    display: "flex",
    alignItems: "center",
  },
  alertError: {
    display: "flex",
    alignItems: "center",
    padding: ".75rem 1rem",
    background: "#fdf0ee",
    border: "1px solid #f0c8c2",
    borderRadius: 6,
    fontSize: ".875rem",
    color: "#c0392b",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
};