"use client";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/auth-actions";
import { Field, TextInput, FormError } from "@/components/form";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  return (
    <form action={action}>
      <FormError message={state.error} />
      <Field label="Email">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="you@org.ae" />
      </Field>
      <Field label="Password">
        <TextInput type="password" name="password" required autoComplete="current-password" />
      </Field>
      <button type="submit" className="pa-btn pa-btn-primary" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
        {pending ? "Signing in…" : <><i className="bi bi-box-arrow-in-right" /> Sign in</>}
      </button>
    </form>
  );
}
