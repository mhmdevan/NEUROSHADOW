import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/AccountPanel";
import { getCurrentUser } from "@/lib/auth";

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AccountPanel initialUser={user} />;
}
