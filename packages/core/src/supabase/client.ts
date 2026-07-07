import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type NotesClient = SupabaseClient<Database>;

/**
 * Create a Supabase client bound to our Database types.
 *
 * - Public web / mobile pass the **anon** key (RLS enforces read-only access).
 * - The admin server passes the **service-role** key, and only ever after a
 *   verified session (it bypasses RLS, so it must stay server-side).
 *
 * Apps may wrap this with framework-specific SSR/cookie helpers as needed.
 */
export function createSupabaseClient(
  url: string,
  key: string,
  options?: { persistSession?: boolean },
): NotesClient {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: options?.persistSession ?? false,
      autoRefreshToken: false,
    },
  });
}
