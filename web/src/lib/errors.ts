// Supabase's database errors (PostgrestError) are plain objects with a
// `message` string, not instances of the native Error class - only auth
// errors (AuthError) actually extend Error. `err instanceof Error` alone
// silently swallows every database error's real message, masking the
// actual cause (RLS violation, missing column, ...) behind a generic
// fallback. This checks for a `message` string either way.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}
