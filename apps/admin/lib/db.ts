import "server-only";
// supabase-js select-string typing collapses to `never` with our hand-written Database type.
// This helper casts the result so callers get proper types.
export function q<T>(
  promise: unknown,
): Promise<{ data: T | null; error: { message: string } | null }> {
  return promise as Promise<{ data: T | null; error: { message: string } | null }>;
}
