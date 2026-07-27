import { redirect } from "next/navigation";
import { getCurrentAdminId } from "@/app/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const adminId = await getCurrentAdminId();
  if (adminId) redirect("/admin");

  return <LoginForm />;
}
