"use server";

import { redirect } from "next/navigation";
import { adminLoginSchema } from "@/app/lib/validation";
import { verifyAdminCredentials, setAdminSessionCookie, clearAdminSessionCookie } from "@/app/lib/auth";

export type LoginFormState = { error: string | null };

export async function loginAdmin(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = adminLoginSchema.safeParse({
    username: formData.get("username")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { error: "ইউজারনেম ও পাসওয়ার্ড দিন" };
  }

  const admin = await verifyAdminCredentials(parsed.data.username, parsed.data.password);
  if (!admin) {
    return { error: "ইউজারনেম বা পাসওয়ার্ড সঠিক নয়" };
  }

  await setAdminSessionCookie(admin.id);
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
