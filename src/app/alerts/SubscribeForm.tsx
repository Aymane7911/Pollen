"use client";
import { useActionState } from "react";
import { subscribeToAlerts, type SubscribeState } from "@/lib/subscribe-actions";
import { Field, TextInput, Select, FormError, FormOk } from "@/components/form";

export function SubscribeForm({ regions }: { regions: { id: number; name: string; nameAr: string | null }[] }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribeToAlerts, {});

  if (state.ok) {
    return (
      <FormOk>
        You&apos;re subscribed — we&apos;ll alert you when pollen-allergy risk is high in {state.region ?? "your area"}.
      </FormOk>
    );
  }

  return (
    <form action={action}>
      <FormError message={state.error} />
      <Field label="Email">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="you@example.ae" />
      </Field>
      <Field label="Name" hint="optional">
        <TextInput name="name" autoComplete="name" />
      </Field>
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Region">
          <Select name="regionId" defaultValue="">
            <option value="">All UAE</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}{r.nameAr ? ` · ${r.nameAr}` : ""}</option>
            ))}
          </Select>
        </Field>
        <Field label="Mobile (SMS)" hint="optional">
          <TextInput name="phone" placeholder="+9715…" />
        </Field>
      </div>
      {/* honeypot (hidden from users, tempting to bots) */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      <button type="submit" className="pa-btn pa-btn-primary" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
        {pending ? "Subscribing…" : <><i className="bi bi-bell" /> Subscribe to alerts</>}
      </button>
    </form>
  );
}
