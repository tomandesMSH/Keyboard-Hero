// GDPR (čl. 8) vyžaduje souhlas zákonného zástupce pro děti pod touto
// hranicí; skutečná hranice se liší dle členského státu EU (13–16 let).
// 16 je nejpřísnější běžná hodnota - bezpečná výchozí volba, dokud se
// nerozhodne jinak (právně, ne čistě technicky).
export const AGE_OF_CONSENT = 16

export function calculateAge(dateOfBirth: string, today: Date = new Date()): number {
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

export function needsGuardianConsent(dateOfBirth: string, today: Date = new Date()): boolean {
  return calculateAge(dateOfBirth, today) < AGE_OF_CONSENT
}
