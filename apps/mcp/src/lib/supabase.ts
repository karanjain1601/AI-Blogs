import { createSupabaseClient } from "@notes/core";

export type AdminClient = ReturnType<typeof createSupabaseClient>;

export function createAdminClient(): AdminClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  return createSupabaseClient(url, key);
}
