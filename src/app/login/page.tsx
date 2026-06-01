import { redirect } from "next/navigation";
import { AuthPage } from "@/components/AuthPage";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return <AuthPage mode="login" />;
}
