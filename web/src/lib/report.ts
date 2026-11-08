// "Nahlásit problém": the report form on tomandes.eu. No GitHub account needed - it files the report as an
// issue in this repository. zus=1 ticks "Jsem žákem ZUŠ Moravský Krumlov" (simpler form, marked for the author).
export function reportFormUrl(options: { pupil?: boolean } = {}): string {
  return `https://tomandes.eu/report/?app=keyboard-hero${options.pupil ? '&zus=1' : ''}`
}
