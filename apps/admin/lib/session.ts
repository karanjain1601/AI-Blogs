import "server-only";
import { redirect } from "next/navigation";
import { auth } from "../auth";

export async function requireSession(): Promise<void> {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
}
