import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Shared, presentational form primitives (no hooks) so they work in both server-rendered
// forms (<form action={serverAction}>) and client forms (useActionState). Uncontrolled —
// driven by `name` + FormData.

export const inputStyle = {
  width: "100%",
  padding: ".5rem .7rem",
  border: "1px solid var(--pa-line)",
  borderRadius: "var(--pa-radius-sm)",
  background: "var(--pa-surface)",
  fontSize: ".9rem",
  color: "var(--pa-ink)",
} as const;

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: ".85rem" }}>
      <span style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".3rem", color: "var(--pa-ink-soft)" }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: "var(--pa-mute)" }}> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ marginBottom: ".85rem", padding: ".55rem .8rem", borderRadius: "var(--pa-radius-sm)", background: "#fdecea", color: "#8c2832", fontSize: ".85rem", border: "1px solid #f3c9c4" }}>
      <i className="bi bi-exclamation-circle" /> {message}
    </div>
  );
}

export function FormOk({ children }: { children: ReactNode }) {
  return (
    <div style={{ marginBottom: ".85rem", padding: ".55rem .8rem", borderRadius: "var(--pa-radius-sm)", background: "#e8f3ec", color: "#1f5d3a", fontSize: ".85rem", border: "1px solid #bfe0cc" }}>
      <i className="bi bi-check-circle" /> {children}
    </div>
  );
}
