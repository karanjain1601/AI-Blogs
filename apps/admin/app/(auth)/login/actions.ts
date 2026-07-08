"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkRateLimit, verifyCredentials, verifyTotp } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const totpCode = (formData.get("totp") as string | null)?.trim() ?? "";

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  const { allowed } = await checkRateLimit(ip);
  if (!allowed) {
    redirect("/login?error=rate_limited");
  }

  const credOk = await verifyCredentials(username, password);
  if (!credOk) {
    redirect("/login?error=invalid");
  }

  const totpOk = verifyTotp(totpCode);
  if (!totpOk) {
    redirect("/login?error=totp");
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.loggedInAt = Date.now();
  await session.save();

  redirect("/");
}
