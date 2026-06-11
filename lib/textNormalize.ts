// Lithuanian diacritics-insensitive text normalization.
//
// Real scam SMS are very often typed WITHOUT Lithuanian diacritics
// ("paskyra uzblokuota", "sumokekite mokesti"). All pattern matching in the
// scam engine therefore runs on normalized text: lowercase + diacritics
// stripped. Knowledge-base pattern values MUST be stored in this normalized
// form (display strings keep proper Lithuanian spelling).
//
// The mapping is 1:1 per character, so any substring match on original
// lowercase text is preserved after normalization — matching can only get
// broader (same or stricter risk), never narrower.

const LT_DIACRITICS_MAP: Record<string, string> = {
  'ą': 'a',
  'č': 'c',
  'ę': 'e',
  'ė': 'e',
  'į': 'i',
  'š': 's',
  'ų': 'u',
  'ū': 'u',
  'ž': 'z',
}

const LT_DIACRITICS_RE = /[ąčęėįšųūž]/g

export function normalizeLt(text: string): string {
  return text.toLowerCase().replace(LT_DIACRITICS_RE, ch => LT_DIACRITICS_MAP[ch] ?? ch)
}
