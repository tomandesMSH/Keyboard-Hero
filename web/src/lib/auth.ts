import { supabase } from './supabase'

// The app has no real email addresses — usernames are shimmed into an
// internal fake domain, same convention the previous vanilla app used.
// Teachers use the same shim as students; there is no real-email auth path.
export function makeInternalEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/\s+/g, '')
  return `${clean}@keyboardhero.internal`
}

export async function signIn(username: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: makeInternalEmail(username),
    password,
  })
  if (error) throw error
  return data
}

export interface StudentConsentInfo {
  dateOfBirth: string
  // Only set for minors (see needsGuardianConsent) — an adult student
  // consents for themselves.
  guardianName?: string
}

export async function signUpStudent(
  username: string,
  fullName: string,
  password: string,
  consent: StudentConsentInfo,
) {
  const { data, error } = await supabase.auth.signUp({
    email: makeInternalEmail(username),
    password,
    options: { data: { full_name: fullName, role: 'student', date_of_birth: consent.dateOfBirth } },
  })
  if (error) throw error

  // The signup trigger that creates the profiles row predates these
  // consent columns and may not know to copy them from user metadata, so
  // set them explicitly here to make sure consent is always recorded.
  if (data.user) {
    const { error: consentError } = await supabase
      .from('profiles')
      .update({
        date_of_birth: consent.dateOfBirth,
        consent_given: true,
        consent_guardian_name: consent.guardianName ?? null,
        consent_given_at: new Date().toISOString(),
      })
      .eq('id', data.user.id)
    if (consentError) throw consentError
  }

  return data
}

export async function signUpTeacher(username: string, fullName: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: makeInternalEmail(username),
    password,
    options: { data: { full_name: fullName, role: 'teacher' } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Re-checks the current user's own password before a destructive action —
// signing in again against the same account throws if the password is
// wrong, and just refreshes the (identical) session if it's right.
export async function reauthenticate(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}
