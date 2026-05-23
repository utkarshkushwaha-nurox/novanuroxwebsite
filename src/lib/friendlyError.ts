// Map raw Supabase / PostgREST errors to safe, user-facing strings.
// Never surface table names, constraint names, or regex patterns to users.
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = err as { code?: string; message?: string } | null | undefined;
  const code = e?.code;
  if (code === "23505") return "This entry is already registered.";
  if (code === "23514") return "Some of the details you entered are invalid. Please check and retry.";
  if (code === "23503") return "Submission failed. Please retry.";
  if (typeof code === "string" && code.startsWith("PGRST")) return "Submission failed. Please retry.";
  if (typeof code === "string" && code.startsWith("42")) return "Submission failed. Please retry.";
  return fallback;
}
