export const OFFICIAL_DOMAINS: Record<string, string[]> = {
  // Marketplaces
  vinted:          ['vinted.lt', 'vinted.com'],
  facebook:        ['facebook.com', 'fb.com', 'messenger.com', 'meta.com'],
  skelbiu:         ['skelbiu.lt'],
  aruodas:         ['aruodas.lt'],
  domoplius:       ['domoplius.lt'],

  // Couriers & post
  dpd:             ['dpd.com', 'dpd.lt', 'mydpd.lt'],
  lp_express:      ['lpexpress.lt'],
  omniva:          ['omniva.lt'],
  dhl:             ['dhl.com', 'dhl.lt'],
  lietuvos_pastas: ['post.lt'],

  // Banks
  seb:             ['seb.lt', 'ibank.seb.lt'],
  swedbank:        ['swedbank.lt', 'online.swedbank.lt'],
  luminor:         ['luminor.lt', 'online.luminor.lt'],
  siauliu_bankas:  ['sb.lt', 'ibankas.sb.lt'],
  citadele:        ['citadele.lt'],

  // Payment / fintech
  paysera:         ['paysera.com', 'paysera.lt', 'wallet.paysera.com'],
  revolut:         ['revolut.com', 'app.revolut.com'],

  // Government & institutions
  muitine:         ['muitine.lt'],
  vmi:             ['vmi.lt', 'deklaravimas.vmi.lt'],
  sodra:           ['sodra.lt', 'draudejas.sodra.lt'],
  epolicija:       ['epolicija.lt'],
  nksc:            ['nksc.lt'],
  cert:            ['cert.lt'],
}

export const ALL_OFFICIAL_DOMAINS = Object.values(OFFICIAL_DOMAINS).flat()

export const KNOWN_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'cutt.ly', 't.co', 'ow.ly',
  'rb.gy', 'short.io', 'shorturl.at', 'is.gd', 'v.gd',
  'tiny.cc', 'clck.ru', 'qr.ae', 'buff.ly', 'adf.ly',
  'lnkd.in', 'goo.gl', 'youtu.be',
]

export const SUSPICIOUS_TLDS = [
  '.xyz', '.biz', '.info', '.ru', '.tk', '.top', '.click',
  '.download', '.work', '.party', '.review', '.win', '.loan',
  '.cam', '.stream', '.gq', '.ml', '.ga', '.cf', '.pw',
]

// Substrings that, when found in a domain, signal brand impersonation.
// Match is case-insensitive and uses domain.includes(pattern).
export const BRAND_IMPERSONATION_PATTERNS: Record<string, string[]> = {
  'Vinted': [
    'vinted-', '-vinted', 'vinted.lt.', 'vinted-lt.',
    'vinted-pay', 'vinted-payment', 'vinted-secure', 'vinted-protect', 'vinted-confirm',
    'vinied', 'vinteed',
  ],
  'SEB': [
    'seb-', 'seb.lt.', 'seblietuva',
    'seb-bank', 'seb-login', 'seb-verify', 'seb-confirm', 'seb-secure',
    'ibank-seb',
  ],
  'Swedbank': [
    'swedbank-', 'swedbanklt',
    'swedbank-login', 'swedbank-verify', 'swedbank-confirm', 'swedbank-secure',
    'sw-edbank', 'sw3dbank',
  ],
  'Luminor': [
    'luminor-', 'luminor.lt.', 'luminor-lt',
    'luminor-login', 'luminor-verify', 'luminor-confirm',
    'lum1nor',
  ],
  'Šiaulių bankas': [
    'siauliu-bankas', 'sb-verify', 'sb-login', 'sb-confirm', 'sb-secure',
    'sb-lt-',
  ],
  'Paysera': [
    'paysera-', 'paysera.lt.', 'paysera-lt',
    'paysera-verify', 'paysera-confirm', 'paysera-pay',
  ],
  'LP Express': [
    'lp-express', 'lpexpress-', 'lp-lt', 'lpexpress.lt.',
    'lp-express-pay', 'lpexpress-pay', 'lpexpresss', 'lp-expresss',
  ],
  'DPD': [
    'dpd-lt', 'dpd-lietuva', 'dpd.lt.',
    'dpd-pay', 'dpd-payment', 'dpd-customs', 'dpd-delivery', 'dpd-confirm',
  ],
  'DHL': [
    'dhl-lt', 'dhl-lietuva', 'dhl.lt.',
    'dhl-customs', 'dhl-pay', 'dhl-payment', 'dhl-confirm',
  ],
  'Omniva': [
    'omniva-', 'omniva.lt.',
    'omniva-pay', 'omniva-payment', 'omniva-confirm',
  ],
  'Lietuvos paštas': [
    'post-lt', 'postlt-', 'post.lt.',
    'pastas-lt', 'lt-pastas', 'lietuvos-pastas', 'lietuvospastas-',
    'lpastas-', 'lietuvos-pastas-pay',
  ],
  'Muitinė': [
    'muitine-', 'muitine.lt.', 'lt-muitine', 'muitinelt',
    'lt-customs', 'customs-lt',
  ],
  'Facebook': [
    'facebook-', '-facebook', 'facebook-pay', 'facebook-secure',
    'fb-pay', 'fb-payment', 'faceb00k', 'facebuk',
  ],
  'Revolut': [
    'revolut-', '-revolut', 'revolut.com.',
    'revolut-pay', 'revolut-confirm', 'revolut-verify',
  ],
}
