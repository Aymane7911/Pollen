import { requireManage } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireManage();
  return <>{children}</>;
}
