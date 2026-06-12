"use client";
import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthState } from "@/lib/auth-actions";
import { Field, TextInput, Select, FormError, FormOk } from "@/components/form";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, {});

  if (state.ok && state.confirmUrl) {
    return (
      <div>
        <FormOk>Registration received — your request has been sent for administrator approval.</FormOk>
        <p className="text-sm" style={{ marginTop: 0 }}>
          In production a confirmation email would be sent. For this build, confirm your address directly:
        </p>
        <Link href={state.confirmUrl} className="pa-btn pa-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: ".5rem" }}>
          <i className="bi bi-check2-circle" /> Confirm email address
        </Link>
        <p className="text-xs text-mute mt-3" style={{ marginBottom: 0 }}>
          After confirming, an administrator must review and approve your account before you can sign in.
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <FormError message={state.error} />
      <Field label="Full name">
        <TextInput name="fullName" required autoComplete="name" placeholder="Dr. Jane Researcher" />
      </Field>
      <Field label="Email">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="you@org.ae" />
      </Field>
      <Field label="Affiliation" hint="optional">
        <TextInput name="affiliation" placeholder="University / institute / municipality" />
      </Field>
      <Field label="Register as" hint="both require admin approval">
        <Select name="role" defaultValue="Researcher">
          <option value="Researcher">Contributor — submit pollen records</option>
          <option value="Expert">Expert — submit &amp; validate records</option>
        </Select>
      </Field>
      <Field label="Credential document" hint="optional · PDF, image, or Word — only the approving admin sees it">
        <TextInput type="file" name="credential" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" />
      </Field>
      <Field label="Password" hint="min 8 characters">
        <TextInput type="password" name="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <button type="submit" className="pa-btn pa-btn-primary" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
        {pending ? "Submitting…" : <><i className="bi bi-person-plus" /> Submit registration</>}
      </button>
    </form>
  );
}
