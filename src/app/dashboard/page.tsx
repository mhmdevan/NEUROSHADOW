import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/DashboardApp";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <DashboardApp user={user} />;
}
