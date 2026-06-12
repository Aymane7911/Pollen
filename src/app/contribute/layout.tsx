import { requireContribute } from "@/lib/auth";

export default async function ContributeLayout({ children }: { children: React.ReactNode }) {
  await requireContribute();
  return <>{children}</>;
}
