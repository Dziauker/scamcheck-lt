import {
  SubmissionInput,
  AnalysisResult,
  RiskLevel,
  QuickAnswers,
  Situation,
} from './types'
import { generateCaseId } from './generateCaseId'
import { analyzeUrl, extractFirstUrl } from './urlAnalysis'

// ─── Pattern groups ──────────────────────────────────────────────────────────

// Always kritinė: sensitive credentials or explicit confirmation-link phrasing.
const CRITICAL_PHRASES = [
  // Second factors / IDs
  'smart-id', 'smartid', 'mobile-id', 'mobileid',

  // Card data
  'cvv', 'cvc kodas', 'cvc kods',
  'kortelės numer', 'kortelės nr', 'kortelės duomen',

  // Bank credentials
  'prisijungimo duomen',
  'įveskite slaptažodį', 'banko slaptaž', 'banko prisijungim', 'banko kod',
  'slaptažod',

  // Personal code
  'asmens kodas', 'asmens nr.',

  // Confirmation codes / actions
  'patvirtinkite kodą', 'patvirtink kodą', 'įveskite kodą',
  'patvirtinkite pavedimą', 'patvirtink pavedimą',
  'patvirtinkite per nuorodą', 'patvirtink per nuorodą',
  'patvirtinkite mokėjimą', 'patvirtinkite gavimą',
  'gavote mokėjimą', 'mokėjimas atliktas',
]

// User indicates they already acted — treat as kritinė.
const ALREADY_ACTED = [
  'jau paspaudžiau', 'jau įvedžiau', 'jau patvirtinau',
  'jau pervedžiau', 'jau apmokėjau', 'jau sumokėjau',
]

const OFF_PLATFORM_MESSENGERS = ['whatsapp', 'telegram', 'viber']
const THIRD_PARTY_MONEY       = ['revolut', 'paypal', 'western union', 'moneygram']

const PAYMENT_HINTS      = ['mokė', 'pervesk', 'sumok', 'apmokė', 'sąskait', 'pavedim']
const DELIVERY_HINTS     = ['siunt', 'pristat', 'kurjer', 'muitin']
const DEPOSIT_HINTS      = ['depozit', 'avans', 'užstat', 'rezervacij']
const PRESSURE_HINTS     = [
  'skubiai', 'nedelsiant', 'nedelsdami', 'tuoj',
  'per valandą', 'per 24 val', 'per 2 val', 'šiandien dar', 'kuo greičiau',
  'paskutinė galimybė', 'bus grąžinta', 'bus užblokuota', 'kitaip bus',
]
const CONFIRMATION_HINTS = ['patvirtin', 'confirm', 'verify', 'verifik']
const ADDRESS_UPDATE     = ['atnaujinkite adres', 'atnaujinti adres', 'patikslinkite adres', 'pakeisti adres']

// Brands a scam SMS might claim to be from (text-side, not URL-side).
const COURIER_BANK_BRANDS_TEXT = [
  'dpd', 'omniva', 'dhl', 'lp express', 'lpexpress', 'lietuvos paštas',
  'seb', 'swedbank', 'luminor', 'paysera', 'revolut', 'šiaulių bankas', 'muitin',
]

// Standalone auksta patterns (no context required).
const HIGH_PATTERNS = [
  'bit.ly', 'tinyurl', 'cutt.ly', 'rb.gy',
  'draudimo mokestis', 'siuntimo draudimas', 'insurance fee', 'apsauga mokestis',
  'depozitas', 'avansas', 'rezervacinis mokestis', 'užstatas',
  'muito mokestis', 'sulaikyta siunta', 'muitinė: ', 'muitinės pranešimas',
  'sąskaita sustabdyta', 'paskyra sustabdyta', 'laikinai blokuota', 'laikinai sustabdyta',
  'reikia sumokėti', 'sumokėkite mokestį', 'sumokėkite papildomą',
  'kurjerį atsiųsiu', 'atsiimsiu kurjerias',
  'ne per platformą', 'ne per vinted', 'ne per facebook',
]

const has = (text: string, arr: string[]) => arr.some(k => text.includes(k))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEVEL_ORDER: RiskLevel[] = ['zema', 'vidutine', 'auksta', 'kritine']
const maxLevel = (a: RiskLevel, b: RiskLevel): RiskLevel =>
  LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b

// Extracts an amount in EUR if present (handles "400€", "€ 200", "200 eur").
function extractAmountEur(t: string): number {
  const m = t.match(/(\d{1,5})\s*(?:€|eur\b|eurai|eurų|euro)/i)
                  ?? t.match(/€\s*(\d{1,5})/i)
  return m ? parseInt(m[1], 10) : 0
}

// ─── Risk detection (text + situation) ───────────────────────────────────────

function detectBaseRisk(text: string, category: string, hasUrl: boolean): RiskLevel {
  const t = text.toLowerCase()

  // ── KRITINĖ ────────────────────────────────────────────────────────────────
  if (has(t, CRITICAL_PHRASES)) return 'kritine'
  if (has(t, ALREADY_ACTED))    return 'kritine'

  // Any URL + payment / confirmation language → kritinė
  if (hasUrl && (has(t, PAYMENT_HINTS) || has(t, CONFIRMATION_HINTS))) return 'kritine'

  // Courier / post / bank impersonation in text + URL + (payment OR address update) → kritinė
  const claimsBrand = has(t, COURIER_BANK_BRANDS_TEXT)
  if (claimsBrand && hasUrl && (has(t, PAYMENT_HINTS) || has(t, ADDRESS_UPDATE))) {
    return 'kritine'
  }

  // Rental scam: rent + deposit + (abroad OR large amount) → kritinė
  const rentContext = /\b(butas|butą|nuoma|nuom\w*|savinink\w*)\b/i.test(t)
  const depositCtx  = has(t, DEPOSIT_HINTS)
  const abroad      = /užsieny|užsieni|abroad/i.test(t)
  const largeAmount = extractAmountEur(t) >= 200
  if (rentContext && depositCtx && (abroad || largeAmount)) return 'kritine'

  // ── Contextual flags ───────────────────────────────────────────────────────
  const offPlatform = has(t, OFF_PLATFORM_MESSENGERS)
  const thirdParty  = has(t, THIRD_PARTY_MONEY)
  const hasPayment  = has(t, PAYMENT_HINTS)
  const hasDelivery = has(t, DELIVERY_HINTS)
  const hasPressure = has(t, PRESSURE_HINTS)

  // ── AUKŠTA ─────────────────────────────────────────────────────────────────

  // Off-platform / third-party money + risky context → auksta
  if ((offPlatform || thirdParty) &&
      (hasPayment || hasDelivery || depositCtx || hasPressure || hasUrl)) {
    return 'auksta'
  }

  // Pressure + payment ("nedelsdami perveskite") → auksta
  if (hasPressure && hasPayment) return 'auksta'

  // Claimed brand + URL alone → auksta (not enough for kritinė without payment / address update)
  if (claimsBrand && hasUrl) return 'auksta'

  if (has(t, HIGH_PATTERNS)) return 'auksta'
  if (category === 'sms' && hasPayment) return 'auksta'

  // ── VIDUTINĖ ───────────────────────────────────────────────────────────────

  if ((category === 'vinted' || category === 'facebook_marketplace') && offPlatform) {
    return 'vidutine'
  }
  if (offPlatform || thirdParty)         return 'vidutine'
  if (category === 'payment_request')    return 'vidutine'
  if (hasPressure)                       return 'vidutine'

  return 'zema'
}

function applySituation(base: RiskLevel, situation: Situation): RiskLevel {
  // Severe situations always force kritinė. A severe situation may NEVER be downgraded.
  if (situation === 'entered_card' || situation === 'confirmed_smartid' || situation === 'sent_money') {
    return 'kritine'
  }
  if (situation === 'clicked_link') {
    // At least vidutinė; auksta if any other suspicious sign is present.
    if (base === 'zema')     return 'vidutine'
    if (base === 'vidutine') return 'auksta'
    return base
  }
  return base
}

// ─── Quick answers ───────────────────────────────────────────────────────────

function buildQuickAnswers(level: RiskLevel, hasUrl: boolean): QuickAnswers {
  const map: Record<RiskLevel, QuickAnswers> = {
    kritine:  { clickLink: 'ne',                          pay: 'ne',         reply: 'ne',        humanReview: 'taip' },
    auksta:   { clickLink: 'ne',                          pay: 'ne',         reply: 'atsargiai', humanReview: 'taip' },
    vidutine: { clickLink: hasUrl ? 'atsargiai' : 'nezinoma', pay: 'atsargiai', reply: 'taip',     humanReview: 'atsargiai' },
    zema:     { clickLink: hasUrl ? 'atsargiai' : 'nezinoma', pay: 'taip',       reply: 'taip',     humanReview: 'ne' },
  }
  return map[level]
}

// ─── "Ką daryti dabar" block (per-level) ─────────────────────────────────────

function buildDoNow(level: RiskLevel): string[] {
  switch (level) {
    case 'kritine': return [
      'Nespauskite nuorodos',
      'Neveskite kortelės duomenų',
      'Netvirtinkite Smart-ID / Mobile-ID',
      'Blokuokite kontaktą',
      'Jei duomenys jau pateikti — nedelsiant susisiekite su banku',
      'Praneškite platformai arba cert@nksc.lt',
      'Jei jau nukentėjote — kreipkitės per epolicija.lt',
    ]
    case 'auksta': return [
      'Nespauskite nuorodos',
      'Nemokėkite per išorinę nuorodą',
      'Patikrinkite informaciją tik oficialioje programėlėje arba svetainėje',
      'Neikite už platformos ribų',
      'Praneškite platformai, jei kontaktas atrodo įtartinas',
    ]
    case 'vidutine': return [
      'Neskubėkite',
      'Patikrinkite domeną, siuntėją, platformą ir mokėjimo būdą',
      'Nenaudokite išorinių mokėjimo nuorodų',
      'Klauskite papildomų patvirtinimų',
    ]
    case 'zema': return [
      'Vis tiek tikrinkite pagrindinius duomenis',
      'Mokėjimus atlikite tik oficialioje platformoje',
      'Nesidalinkite jautriais duomenimis',
    ]
  }
}

// ─── Content (per-level prose) ───────────────────────────────────────────────

type ContentResult = Omit<
  AnalysisResult,
  | 'case_id' | 'analyzed_at' | 'category' | 'situation' | 'analysis_type'
  | 'url_analysis' | 'disclaimer' | 'quick_answers' | 'do_now'
>

function buildContent(level: RiskLevel, text: string, _category: string): ContentResult {
  const t = text.toLowerCase()

  const hasSmartId   = t.includes('smart-id') || t.includes('mobile-id')
  const hasLink      = t.includes('nuorod') || t.includes('http') || t.includes('spausk')
                       || /\b[a-z0-9][a-z0-9-]*\.[a-z]{2,24}\b/i.test(t)
  const hasPayment   = t.includes('mokė') || t.includes('pervesk') || t.includes('sumok')
  const hasDeposit   = t.includes('depozit') || t.includes('avans') || t.includes('užstat') || t.includes('rezervacij')
  const hasCourier   = t.includes('kurjer') || t.includes('siunt') || t.includes('pristat')
  const hasBank      = t.includes('bank') || t.includes('sąskait') || t.includes('paskyra')
  const hasEscape    = t.includes('whatsapp') || t.includes('telegram') || t.includes('viber')
  const hasAbroad    = t.includes('užsieny')
  const alreadyActed = t.includes('jau paspaudžiau') || t.includes('jau įvedžiau') || t.includes('jau patvirtinau')
                       || t.includes('jau pervedžiau') || t.includes('jau sumokėjau') || t.includes('jau apmokėjau')

  switch (level) {

    case 'kritine': return {
      risk_level: 'kritine',
      short_verdict: hasSmartId
        ? 'Ši žinutė prašo patvirtinti Smart-ID ar Mobile-ID veiksmą — tai turi stiprių sukčiavimo požymių.'
        : alreadyActed
        ? 'Jei jau atlikote veiksmus — nedelsdami susisiekite su banku ir blokuokite korteles.'
        : hasLink
        ? 'Ši žinutė prašo spausti nuorodą ir patvirtinti duomenis — tai turi stiprių sukčiavimo požymių.'
        : 'Ši žinutė turi stiprių sukčiavimo požymių. Jokių veiksmų nesiimkite.',
      do_not_do: [
        ...(hasLink    ? ['Nespauskite jokių nuorodų iš šios žinutės'] : []),
        ...(hasSmartId ? ['Nepatvirtinkite jokio Smart-ID ar Mobile-ID veiksmo'] : []),
        'Neįveskite kortelės duomenų, banko prisijungimo ar slaptažodžio',
        ...(hasPayment ? ['Neperveskite pinigų prieš patikrinę situaciją oficialiais kanalais'] : []),
        'Neatsakykite su asmeniniais duomenimis',
      ].slice(0, 4),
      red_flags: [
        ...(hasSmartId ? ['Prašoma patvirtinti Smart-ID arba Mobile-ID veiksmą'] : []),
        ...(hasLink    ? ['Nuoroda veda už oficialios platformos ribų'] : []),
        ...(hasPayment ? ['Prašoma atlikti mokėjimą per neoficialų kanalą'] : []),
        ...(hasCourier ? ['Tariamas kurjerio ar pristatymo mokestis — dažna sukčiavimo schema'] : []),
        ...(hasBank    ? ['Apsimetama banku ar mokėjimo sistema'] : []),
        'Naudojamas skubinimas arba spaudimas veikti greitai',
      ].slice(0, 5),
      why_suspicious: [
        'Ši žinutė atitinka žinomus sukčiavimo šablonus, plačiai naudojamus Lietuvoje.',
        hasSmartId
          ? 'Bankai, paštas ir kitos institucijos NIEKADA neprašo patvirtinti Smart-ID ar Mobile-ID veiksmo per SMS ar žinutę be jūsų pačių inicijuoto veiksmo banko sistemoje.'
          : hasLink
          ? 'Oficialios platformos (Vinted, Facebook, bankai) niekada nepraše patvirtinti mokėjimų ar duomenų per išorines nuorodas. Sukčiai kuria netikras svetaines, kurios vizualiai imituoja tikras.'
          : 'Tokio tipo prašymai dažnai naudojami norint pasisavinti pinigus ar asmeninius duomenis.',
        'Tai nėra garantuotas vertinimas — bet šie požymiai stipriai signalizuoja apie sukčiavimą.',
      ],
      verify_before_acting: [
        'Raskite oficialų organizacijos telefono numerį (svetainėje, kortelėje) ir paskambinkite tiesiogiai',
        hasCourier
          ? 'LP Express, DPD, Omniva ir DHL niekada neprašo papildomų mokesčių per SMS nuorodas'
          : 'Kreipkitės tiesiai į oficialią svetainę — rankiniu būdu įveskite adresą naršyklėje',
        'Jei žinutė atėjo per platformą — praneškit platformos palaikymui',
        'Pasitarkite su kitu žmogumi prieš ką nors darydami',
      ],
      safe_reply: 'Nerekomenduojama atrašyti. Blokuokite kontaktą ir praneškite platformai.',
      next_steps: [
        ...(alreadyActed ? ['Nedelsdami susisiekite su savo banku ir paprašykite blokuoti korteles bei sąskaitą'] : []),
        'Neimkitės jokių veiksmų — nei spaudžiant, nei pervedant, nei atsakant',
        'Praneškit apie žinutę platformai ar organizacijai, kurios vardu parašyta',
        'Jei situacija rimta — kreipkitės į policiją (epolicija.lt) arba CERT-LT (cert.lt)',
      ].filter(Boolean).slice(0, 4) as string[],
      human_review: {
        recommended: true,
        reason: 'Kritinės rizikos atvejis. Ypač rekomenduojama, jei jau atlikote kokių nors veiksmų — paspaudėte nuorodą, įvedėte duomenis ar pervedėte pinigus.',
      },
    }

    case 'auksta': return {
      risk_level: 'auksta',
      short_verdict: hasDeposit
        ? 'Prašomas depozitas ar išankstinis mokėjimas — rizika aukšta.'
        : hasEscape
        ? 'Siūloma pereiti į kitą platformą (WhatsApp/Telegram) kartu su mokėjimu ar nuoroda — rizika aukšta.'
        : hasAbroad
        ? 'Pirkėjas ar pardavėjas esą yra užsienyje su siuntimo schema — rizika aukšta.'
        : 'Ši žinutė turi kelių stiprių įtartumo požymių — nerekomenduojama veikti be papildomo patikrinimo.',
      do_not_do: [
        ...(hasDeposit ? ['Nemokėkite depozito ar avanso prieš apžiūrėdami prekę ar turtą gyvai'] : []),
        ...(hasEscape  ? ['Nepereikite į WhatsApp, Telegram ar Viber — likite oficialios platformos ribose'] : []),
        'Neperveskite pinigų į nežinomus rekvizitus',
        'Neskubėkite — teisėti kontaktai supranta, jei reikia laiko pagalvoti',
      ].slice(0, 3),
      red_flags: [
        ...(hasDeposit ? ['Prašomas depozitas ar išankstinis mokėjimas prieš sandorį'] : []),
        ...(hasEscape  ? ['Siūloma bendrauti ne per oficialią platformą (WhatsApp/Telegram)'] : []),
        ...(hasCourier ? ['Siuntimo ar pristatymo mokestis prieš sandorio užbaigimą'] : []),
        ...(hasAbroad  ? ['Pirkėjas / pardavėjas esą yra užsienyje'] : []),
        'Prašoma elgtis ne standartine platformos tvarka',
      ].filter(Boolean).slice(0, 4) as string[],
      why_suspicious: [
        'Žinutė turi kelis bruožus, kurie atitinka žinomus sukčiavimo šablonus Lietuvoje.',
        hasDeposit
          ? 'Prašymai mokėti depozitą ar avansu — ypač prieš matant prekę ar apžiūrint nuomojamą turtą — labai dažnai būna apgaulė.'
          : hasEscape
          ? 'Perėjimas į WhatsApp ar Telegram pašalina oficialios platformos apsaugą ir palengvina sukčiams veikti be stebėsenos.'
          : 'Šie požymiai nebūtinai reiškia sukčiavimą, bet patikrinti būtina prieš imantis bet kokių veiksmų.',
        'Rekomenduojame patikrinti prieš mokant, spaudžiant nuorodą ar pateikiant duomenis.',
      ],
      verify_before_acting: [
        'Patikrinkite kontakto profilį ir atsiliepimus platformoje',
        ...(hasDeposit ? ['Susitikite ir apžiūrėkite prekę ar turtą fiziškai prieš mokant bet ką'] : []),
        'Naudokite tik oficialią platformos mokėjimo sistemą',
        'Ieškokite panašių schemų internete (Google: aprašymas + „sukčiavimas")',
      ].slice(0, 3),
      safe_reply: hasEscape
        ? 'Ačiū! Norėčiau toliau kalbėtis per šią platformą — man patogiau. Ar galime susitarti čia?'
        : hasDeposit
        ? 'Labas! Norėčiau susitikti ir apžiūrėti prieš bet kokį mokėjimą. Ar tai galima suorganizuoti?'
        : 'Labas! Noriu patikslinti keletą detalių. Ar galite pateikti daugiau informacijos oficialiais kanalais?',
      next_steps: [
        'Nespręskite skubotai — paimkite laiko pagalvoti',
        'Patikrinkite kontakto istoriją ir atsiliepimus platformoje',
        'Jei situacija atrodo keista — praneškit platformos palaikymui',
        'Pasitarkite su artimu žmogumi prieš ką nors darydami',
      ],
      human_review: {
        recommended: true,
        reason: 'Aukštos rizikos atvejis su keliais įtartumo požymiais. Rekomenduojama žmogaus peržiūra prieš atliekant mokėjimą ar kitus veiksmus.',
      },
    }

    case 'vidutine': return {
      risk_level: 'vidutine',
      short_verdict: 'Nėra pakankamai požymių sukčiavimui patvirtinti, bet verta patikrinti prieš veikiant.',
      do_not_do: [
        'Nesutikite mokėti ar pateikti duomenų prieš patikrindami kontaktą',
        'Nepereikite į kitas platformas, jei tai pirkimo / pardavimo sandoris',
      ],
      red_flags: [
        ...(hasEscape ? ['Siūloma komunikuoti per WhatsApp / Telegram / Viber'] : []),
        ...(t.includes('revolut') || t.includes('paypal') ? ['Siūlomas trečiosios šalies mokėjimas vietoj oficialios platformos'] : []),
        'Viena ar kelios situacijos detalės neatitinka įprastos elgsenos',
      ].filter(Boolean).slice(0, 3) as string[],
      why_suspicious: [
        'Žinutė neturi aiškių sukčiavimo požymių, tačiau kai kurios detalės vertos papildomo dėmesio.',
        'Tai gali būti tiesiog nestandartinė situacija — bet rekomenduojame patikrinti prieš mokant ar pateikiant duomenis.',
      ],
      verify_before_acting: [
        'Patikrinkite kontakto profilį ir atsiliepimus',
        'Naudokite tik oficialią platformos mokėjimo sistemą',
        'Jei kažkas atrodo keista — paklauskite papildomų klausimų',
      ],
      safe_reply: 'Labas! Norėčiau patikslinti keletą detalių. Ar galime susitvarkyti per oficialią platformą?',
      next_steps: [
        'Patikrinkite kontakto istoriją platformoje',
        'Neskubėkite — teisėtos situacijos leidžia laiko pagalvoti',
        'Jei situacija atrodo keista — praneškite platformai',
      ],
      human_review: {
        recommended: false,
        reason: 'Vidutinės rizikos atvejis. Žmogaus peržiūra rekomenduojama tik jei jau atlikote mokėjimą ar kitus veiksmus.',
      },
    }

    default: return {  // 'zema'
      risk_level: 'zema',
      short_verdict: 'Žinutė neturi aiškių sukčiavimo požymių — tačiau tai nėra garantuotas vertinimas. Visada būkite atsargūs su nepažįstamais kontaktais.',
      do_not_do: [
        'Neperduokite asmeninių duomenų ar finansinės informacijos, kol nepažįstate kontakto',
        'Nesutikite mokėti depozitų ar avansų prieš apžiūrint prekę',
      ],
      red_flags: [],
      why_suspicious: [
        'Analizė neaptiko tipinių sukčiavimo šablonų šioje žinutėje.',
        'Tai nereiškia, kad žinutė garantuotai nekenksminga — visada tikrinkite prieš atlikdami mokėjimus ar pateikdami duomenis.',
      ],
      verify_before_acting: [
        'Patikrinkite kontakto profilį ir atsiliepimus',
        'Naudokite tik oficialią platformos mokėjimo sistemą',
        'Susitikite fiziškai, jei tai prekė ar nuoma',
      ],
      safe_reply: 'Labas! Ačiū už žinutę. Galiu susitikimui šiomis dienomis. Ar tinka?',
      next_steps: [
        'Tęskite standartine tvarka',
        'Naudokite oficialią platformos mokėjimo sistemą',
        'Jei atsiras naujų įtartumo požymių — patikrinkite dar kartą',
      ],
      human_review: {
        recommended: false,
        reason: 'Žemos rizikos atvejis. Žmogaus peržiūra nereikalinga.',
      },
    }
  }
}

// ─── Human-review escalation based on situation / amount / URL ───────────────

function adjustHumanReview(
  content: ContentResult,
  level: RiskLevel,
  text: string,
  situation: Situation,
  urlVerdict: 'suspicious' | 'unknown' | 'no_flags_found' | undefined,
) {
  const t = text.toLowerCase()
  const rentContext = /\b(butas|butą|nuoma|nuom\w*)\b/i.test(t)
  const depositCtx  = ['depozit', 'avans', 'užstat', 'rezervacij'].some(k => t.includes(k))
  const largeAmount = extractAmountEur(t) >= 200

  let recommend = content.human_review.recommended
  let reason    = content.human_review.reason

  if (level === 'kritine') {
    recommend = true
  }
  if (situation === 'sent_money') {
    recommend = true
    reason = 'Nurodėte, kad jau pervedėte pinigus. Rekomenduojama žmogaus peržiūra prieš tolimesnius veiksmus.'
  } else if (situation === 'entered_card') {
    recommend = true
    reason = 'Nurodėte, kad jau įvedėte kortelės duomenis. Skubiai susisiekite su banku ir paprašykite žmogaus peržiūros.'
  } else if (situation === 'confirmed_smartid') {
    recommend = true
    reason = 'Nurodėte, kad jau patvirtinote Smart-ID / Mobile-ID veiksmą. Reikalinga žmogaus peržiūra.'
  } else if (situation === 'clicked_link') {
    recommend = true
    reason = 'Nurodėte, kad jau paspaudėte nuorodą. Rekomenduojama žmogaus peržiūra, kad būtų įvertintos pasekmės.'
  }

  if ((rentContext && depositCtx) || (depositCtx && largeAmount)) {
    recommend = true
    if (!situation || situation === 'none') {
      reason = 'Mokėjimas susijęs su nuomos depozitu ar didesne nei 200 € suma — rekomenduojama žmogaus peržiūra.'
    }
  }

  if (urlVerdict === 'suspicious' && (level === 'vidutine' || level === 'zema')) {
    recommend = true
    reason = reason || 'Domeno požymiai įtartini, bet bendras vertinimas neaiškus — rekomenduojama žmogaus peržiūra.'
  }

  content.human_review = { recommended: recommend, reason }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function getMockAnalysis(input: SubmissionInput): AnalysisResult {
  const caseId    = generateCaseId()
  const situation = input.situation ?? 'none'

  // Extract URL: explicit field, else first detected URL or bare domain in text.
  const rawUrl = input.url?.trim() || extractFirstUrl(input.text)
  const urlAnalysis = rawUrl ? analyzeUrl(rawUrl) : undefined

  // Step 1 — base risk from text + category + URL presence
  let level = detectBaseRisk(input.text, input.category, !!rawUrl)

  // Step 2 — URL-based escalation (upgrade only)
  if (urlAnalysis) {
    if (urlAnalysis.verdict === 'suspicious') {
      level = maxLevel(level, 'auksta')
    }
    if (urlAnalysis.brand_impersonation_detected) {
      level = maxLevel(level, 'kritine')
    }
  }

  // Step 3 — situation overlay (never downgrade a severe situation)
  level = applySituation(level, situation)

  // Step 4 — build content / answers / do_now
  const content      = buildContent(level, input.text, input.category)
  const quickAnswers = buildQuickAnswers(level, !!rawUrl)
  const doNow        = buildDoNow(level)

  adjustHumanReview(content, level, input.text, situation, urlAnalysis?.verdict)

  return {
    ...content,
    case_id: caseId,
    analyzed_at: new Date().toISOString(),
    category: input.category,
    situation,
    analysis_type: 'ai_preliminary',
    quick_answers: quickAnswers,
    do_now: doNow,
    url_analysis: urlAnalysis,
    disclaimer:
      'Ši analizė yra demo vertinimas — simuliuotas AI pirminis vertinimas šiame prototipe. ' +
      'ScamCheck LT nėra bankas, policija, teisinis patarėjas ar garantuotas sukčiavimo detektorius. ' +
      'Jei esate nukentėjęs — nedelsdami susisiekite su savo banku ir kreipkitės į policiją (epolicija.lt) arba CERT-LT (cert.lt).',
  }
}
