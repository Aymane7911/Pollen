import { prisma } from "@/lib/db";
import { PageHead } from "@/components/PageHead";
import { SubscribeForm } from "./SubscribeForm";

export const metadata = { title: "Pollen alerts · UAE Pollen Atlas" };

export default async function AlertsPage() {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, nameAr: true },
  });

  return (
    <>
      <PageHead eyebrow="Stay informed" title="Pollen alerts" subtitle="Get notified when allergy risk is high in your area." />
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 520 }}>
        <div className="pa-card" style={{ marginBottom: "1rem" }}>
          <div className="pa-card-body">
            <p className="text-sm" style={{ marginTop: 0, color: "var(--pa-ink-soft)", lineHeight: 1.6 }}>
              When the combined pollen + air-quality risk crosses a high threshold in a region — for example during a
              heavy pollination week or a dust event — the Atlas raises an alert with the affected downwind area.
              Subscribe to be warned for your area, so allergy and asthma sufferers can take precautions in time.
            </p>
          </div>
        </div>

        <div className="pa-card">
          <div className="pa-card-body">
            <SubscribeForm regions={regions} />
          </div>
        </div>

        <p className="text-xs text-mute mt-3" style={{ textAlign: "center" }}>
          We only use your details to send pollen alerts. In this build, delivery is simulated — your subscription is recorded
          and included when an alert is dispatched.
        </p>
      </div>
    </>
  );
}
