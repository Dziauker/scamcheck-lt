import {
  KNOWN_SHORTENERS,
  SUSPICIOUS_TLDS,
  ALL_OFFICIAL_DOMAINS,
  BRAND_IMPERSONATION_PATTERNS,
} from '@/constants/officialDomains'
import { UrlAnalysisResult } from './types'

// Strips trailing punctuation that often follows a URL in prose.
function trimTrailingPunctuation(s: string): string {
  return s.replace(/[.,;:!?)\]'"]+$/, '')
}

export function extractFirstUrl(text: string): string | null {
  // Pass 1 — explicit http(s) URL
  const httpRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i
  const httpMatch = text.match(httpRegex)
  if (httpMatch) return trimTrailingPunctuation(httpMatch[0])

  // Pass 2 — bare domain (vinted-pay-lt.com, seb-verify.eu, www.foo.bar/x).
  // Lookbehind blocks emails (anything@...) and matches that start mid-word.
  const bareDomainRegex =
    /(?<![@\w.])((?:[a-z0-9][a-z0-9-]{0,62}\.){1,3}[a-z]{2,24})(\/\S*)?/i
  const bareMatch = text.match(bareDomainRegex)
  if (bareMatch) return trimTrailingPunctuation(bareMatch[0])

  return null
}

export function extractDomain(url: string): string {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    const { hostname } = new URL(normalized)
    return hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')
  }
}

function getTLD(domain: string): string {
  const parts = domain.split('.')
  return parts.length >= 2 ? `.${parts[parts.length - 1]}` : ''
}

function detectBrandImpersonation(domain: string): { detected: boolean; brand?: string } {
  for (const [brand, patterns] of Object.entries(BRAND_IMPERSONATION_PATTERNS)) {
    if (patterns.some(p => domain.includes(p))) {
      return { detected: true, brand }
    }
  }
  // Catch official-brand-in-subdomain trick: seb.malicious.com
  for (const officialDomain of ALL_OFFICIAL_DOMAINS) {
    const base = officialDomain.split('.')[0]
    if (
      base.length >= 3 &&
      domain !== officialDomain &&
      !domain.endsWith(`.${officialDomain}`) &&
      domain.startsWith(`${base}.`) &&
      !ALL_OFFICIAL_DOMAINS.includes(domain)
    ) {
      return { detected: true }
    }
  }
  return { detected: false }
}

// FIX C2: No 'likely_safe' verdict — cannot claim safety from passive checks alone
export function analyzeUrl(url: string): UrlAnalysisResult {
  const domain = extractDomain(url)
  const tld = getTLD(domain)
  const tldFlags: string[] = []
  const patternNotes: string[] = []

  const isShortener = KNOWN_SHORTENERS.some(s => domain === s || domain.endsWith(`.${s}`))
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(t => domain.endsWith(t))
  const isKnownOfficial = ALL_OFFICIAL_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`))
  const impersonation = detectBrandImpersonation(domain)
  const isHttp = url.startsWith('http://')
  const isPunycode = /(^|\.)xn--/i.test(domain)

  if (hasSuspiciousTLD) {
    tldFlags.push(`Neįprasta domeno galūnė: "${tld}"`)
  }
  if (isPunycode) {
    patternNotes.unshift('Punycode (xn--) domenas — gali maskuoti raides ne lotynų abėcėle')
  }
  if (isHttp) {
    patternNotes.push('Naudojama nesaugi HTTP jungtis — tikros mokėjimo ar bankų svetainės visada naudoja HTTPS')
  }
  if (isShortener) {
    patternNotes.unshift('Sutrumpinta ar maskuota nuoroda — tikrasis adresas nematomas')
  }
  if (impersonation.detected) {
    patternNotes.unshift(
      impersonation.brand
        ? `Domenas primena „${impersonation.brand}", bet tai nėra oficialus adresas`
        : 'Domenas panašus į žinomą paslaugą, bet neatitinka oficialaus adreso'
    )
  }
  if (isKnownOfficial && !impersonation.detected) {
    patternNotes.push('Domenas sutampa su žinomu oficialiu adresu')
  }
  if (/[?&](token|session|key|code|ref|id)=/i.test(url)) {
    patternNotes.push('URL turi sesijos ar patvirtinimo parametrų — vertėtų patikrinti kontekstą')
  }
  if (/\/(verify|confirm|validate|auth|login|pay|payment|secure|update)\b/i.test(url)) {
    patternNotes.push('URL kelyje yra jautrių žodžių: verify / confirm / pay / login')
  }

  let verdict: UrlAnalysisResult['verdict']
  if (isShortener || impersonation.detected || hasSuspiciousTLD || isHttp || isPunycode) {
    verdict = 'suspicious'
  } else if (isKnownOfficial) {
    verdict = 'no_flags_found'
  } else {
    verdict = 'unknown'
  }

  if (patternNotes.length === 0) {
    patternNotes.push('Akivaizdžių įtartumo šablonų nerasta')
  }

  return {
    url_provided: url,
    domain_extracted: domain,
    tld_flags: tldFlags,
    brand_impersonation_detected: impersonation.detected,
    shortener_detected: isShortener,
    pattern_notes: patternNotes,
    verdict,
    warning:
      'Nuoroda nebuvo atidaryta. Patikrinti tik domeno ir teksto požymiai. ' +
      'Tai nėra garantija, kad nuoroda saugi arba nesaugi.',
  }
}
