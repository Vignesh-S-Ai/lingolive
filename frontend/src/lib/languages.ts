/**
 * Canonical language registry.
 *
 * `available: true` means the platform is wired for this language today
 * (Gnani Prisma STT / Timbre TTS / translation intelligence).
 * Languages flagged `available: false` are roadmap expansion only and are
 * rendered disabled — they are never presented as working.
 */
export interface Language {
  /** BCP-47 code used across the backend contract. */
  code: string
  /** English name. */
  name: string
  /** Native script name — always the primary label in the UI. */
  nativeName: string
  /** Short Latin abbreviation used in compact badges. */
  short: string
  /** Script direction for correct subtitle rendering. */
  direction?: 'ltr' | 'rtl'
  available: boolean
}

export const languages: Language[] = [
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    short: 'TA',
    available: true,
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    short: 'HI',
    available: true,
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    short: 'TE',
    available: true,
  },
  {
    code: 'en-IN',
    name: 'English',
    nativeName: 'English',
    short: 'EN',
    available: true,
  },
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    short: 'KN',
    available: false,
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    short: 'ML',
    available: false,
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    short: 'BN',
    available: false,
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    short: 'MR',
    available: false,
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    short: 'GU',
    available: false,
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    short: 'PA',
    available: false,
  },
]

/** Languages that are live today. */
export const availableLanguages = languages.filter((l) => l.available)

/** Roadmap languages — shown as disabled, never as working. */
export const upcomingLanguages = languages.filter((l) => !l.available)

const byCode = new Map(languages.map((l) => [l.code, l]))

export function getLanguage(code: string | null | undefined): Language | undefined {
  if (!code) return undefined
  return byCode.get(code)
}

/** Best-effort label for a language code, falling back to the raw code. */
export function languageLabel(code: string | null | undefined): string {
  return getLanguage(code)?.name ?? code ?? 'Unknown'
}

/** Native label for a language code, falling back to the English name. */
export function languageNativeLabel(code: string | null | undefined): string {
  const lang = getLanguage(code)
  return lang?.nativeName ?? lang?.name ?? code ?? 'Unknown'
}
