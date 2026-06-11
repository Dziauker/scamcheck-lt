// ─── ScamCheck LT v0.2 — scam knowledge base ─────────────────────────────────
//
// 13 structured scam categories used by lib/scamEngine.ts.
//
// HOW TO ADD A NEW SCAM CATEGORY:
//   1. Add its id to ScamCategoryId in lib/types.ts
//   2. Append one ScamCategory object below — no engine changes needed
//   3. Add positive + negative cases to knowledge/testCases.ts and run `npm test`
//
// PATTERN RULES (important):
//   - Pattern `value` strings are matched against NORMALIZED text
//     (lowercase, Lithuanian diacritics stripped — see lib/textNormalize.ts).
//     So write "uzblokuota", NOT "užblokuota".
//   - Display strings (nameLt, explanationLt, redFlagsLt, ...) keep proper
//     Lithuanian spelling — they are shown to users.
//   - `weight`: how strongly a single pattern indicates this scam (2 = generic
//     hint, 5 = very specific scam phrasing). A category counts as detected
//     only when the sum of matched pattern weights reaches the engine
//     threshold, so one generic word never flags a normal message.
//   - In regexes, [^!?\n]{0,N} means "within the same sentence-ish window".
//
// SOURCES are reference labels for the category as a whole (which kind of
// institution warns about this scheme). They are NOT verified citations for
// a specific analyzed message — the UI must present them accordingly.

import { ScamCategoryId } from '@/lib/types'

export interface TextPattern {
  kind: 'phrase' | 'regex'
  value: string
  noteLt?: string // red-flag explanation shown when this pattern matches
}

export interface ScamPattern extends TextPattern {
  weight: number
}

export type SourceLabel =
  | 'nksc_cert'
  | 'policija'
  | 'lietuvos_bankas'
  | 'institucijos'
  | 'platformos'
  | 'ziniasklaida'
  | 'demo'

export const SOURCE_LABELS_LT: Record<SourceLabel, string> = {
  nksc_cert: 'NKSC / CERT-LT įspėjimai',
  policija: 'Lietuvos policijos įspėjimai',
  lietuvos_bankas: 'Lietuvos banko įspėjimai',
  institucijos: 'Valstybės institucijų pranešimai',
  platformos: 'Platformų saugumo gairės',
  ziniasklaida: 'Žiniasklaidos pranešimai',
  demo: 'Demo šaltinis (vidinis)',
}

export interface ScamCategory {
  id: ScamCategoryId
  nameLt: string
  explanationLt: string
  redFlagsLt: string[]
  patterns: ScamPattern[]
  scammerGoalLt: string
  safeActionLt: string
  baseWeight: number
  examplesLt: string[]
  sources: SourceLabel[]
}

export const SCAM_CATEGORIES: ScamCategory[] = [

  // ── 1. Courier / parcel / customs fee ──────────────────────────────────────
  {
    id: 'courier_customs',
    nameLt: 'Siuntų / muitinės mokesčio sukčiavimas',
    explanationLt:
      'Apsimetama kurjeriu ar paštu (DPD, Omniva, LP Express, Lietuvos paštas) ir prašoma '
      + 'sumokėti nedidelį „pristatymo“ ar „muito“ mokestį arba „atnaujinti adresą“ per netikrą nuorodą.',
    redFlagsLt: [
      'Netikėtas SMS apie sulaikytą ar nepristatytą siuntą',
      'Prašomas nedidelis mokestis (1–5 €) per nuorodą',
      'Nuoroda ne oficialiame kurjerio domene',
      'Skubinimas: „per 24 val. siunta bus grąžinta“',
    ],
    patterns: [
      { kind: 'phrase', value: 'siunta sulaikyta', weight: 4, noteLt: 'Pranešama apie tariamai sulaikytą siuntą' },
      { kind: 'phrase', value: 'sulaikyta muitin', weight: 4, noteLt: 'Siunta neva sulaikyta muitinėje' },
      { kind: 'phrase', value: 'negali buti pristatyta', weight: 4, noteLt: 'Siunta neva negali būti pristatyta' },
      { kind: 'phrase', value: 'nepavyko pristatyti', weight: 3 },
      { kind: 'regex', value: 'sumokek\\w*[^!?\\n]{0,40}mokest', weight: 5, noteLt: 'Prašoma sumokėti mokestį per žinutę' },
      { kind: 'regex', value: 'muit\\w{0,6} mokest', weight: 4, noteLt: 'Reikalaujamas „muito mokestis“' },
      { kind: 'phrase', value: 'pristatymo mokest', weight: 4, noteLt: 'Reikalaujamas „pristatymo mokestis“' },
      { kind: 'regex', value: 'atnaujin\\w*[^!?\\n]{0,30}adres', weight: 4, noteLt: 'Prašoma „atnaujinti adresą“ per nuorodą' },
      { kind: 'phrase', value: 'siunta bus grazinta', weight: 3 },
    ],
    scammerGoalLt: 'Paspausti nuorodą ir įvesti kortelės duomenis tariamam mokesčiui sumokėti.',
    safeActionLt:
      'Siuntos statusą tikrinkite tik oficialioje kurjerio programėlėje ar svetainėje, adresą įvedę ranka. '
      + 'Kurjeriai ir paštas mokesčių per SMS nuorodas neprašo.',
    baseWeight: 6,
    examplesLt: [
      'DPD: jūsų siunta sulaikyta muitinėje. Sumokėkite 2.49 EUR muito mokestį: http://dpd-lt-pay.com',
      'Omniva: nepavyko pristatyti siuntos. Atnaujinkite adresą per 24 val.',
    ],
    sources: ['nksc_cert', 'platformos'],
  },

  // ── 2. Bank / Smart-ID / account blocked ───────────────────────────────────
  {
    id: 'bank_account_block',
    nameLt: 'Banko / Smart-ID / blokuotos sąskaitos sukčiavimas',
    explanationLt:
      'Apsimetama banku: gąsdinama „užblokuota sąskaita“ ar „įtartina veikla“ ir prašoma prisijungti '
      + 'per nuorodą arba patvirtinti Smart-ID / Mobile-ID veiksmą.',
    redFlagsLt: [
      'Gąsdinimas užblokuota ar sustabdyta sąskaita',
      'Prašymas patvirtinti Smart-ID / Mobile-ID ne jūsų inicijuotam veiksmui',
      'Nuoroda į „banko“ puslapį ne oficialiame domene',
      'Skubinimas veikti nedelsiant',
    ],
    patterns: [
      { kind: 'regex', value: '(paskyra|saskaita)[^!?\\n]{0,30}(uzblokuota|sustabdyta|apribota|uzsaldyta)', weight: 5, noteLt: 'Gąsdinama užblokuota ar sustabdyta sąskaita' },
      { kind: 'regex', value: 'itartin\\w* (veikl|prisijungim|operacij)', weight: 4, noteLt: 'Minima „įtartina veikla“ paskyroje' },
      { kind: 'regex', value: 'neiprast\\w* (veikl|prisijungim)', weight: 4 },
      { kind: 'regex', value: 'patvirtink\\w*[^!?\\n]{0,30}(tapatyb|asmens duomen)', weight: 5, noteLt: 'Prašoma „patvirtinti tapatybę“ per žinutę' },
      { kind: 'phrase', value: 'smart-id', weight: 4, noteLt: 'Minimas Smart-ID — bankai jo nereikalauja per SMS' },
      { kind: 'phrase', value: 'mobile-id', weight: 3 },
      { kind: 'regex', value: 'atblokuo\\w*', weight: 4, noteLt: 'Siūloma „atblokuoti“ paskyrą per nuorodą' },
      { kind: 'phrase', value: 'banko duomen', weight: 4 },
    ],
    scammerGoalLt: 'Įvesti banko prisijungimus ar patvirtinti Smart-ID veiksmą, kuriuo sukčius prisijungia prie sąskaitos.',
    safeActionLt:
      'Niekada netvirtinkite Smart-ID veiksmo, kurio patys nepradėjote. Jei abejojate — skambinkite į banką '
      + 'oficialiu numeriu (nurodytu kortelėje ar banko svetainėje).',
    baseWeight: 8,
    examplesLt: [
      'SEB: jūsų sąskaita laikinai užblokuota dėl įtartinos veiklos. Patvirtinkite tapatybę su Smart-ID.',
      'Swedbank: pastebėjome neįprastą prisijungimą. Atblokuokite paskyrą per nuorodą.',
    ],
    sources: ['lietuvos_bankas', 'nksc_cert'],
  },

  // ── 3. Vinted / Marketplace fake payment ───────────────────────────────────
  {
    id: 'marketplace_fake_payment',
    nameLt: 'Vinted / Marketplace netikro mokėjimo sukčiavimas',
    explanationLt:
      '„Pirkėjas“ tvirtina jau sumokėjęs ir siunčia nuorodą „patvirtinti gavimą“ — netikrame puslapyje '
      + 'prašoma įvesti kortelės duomenis pinigams „gauti“.',
    redFlagsLt: [
      'Pirkėjas tvirtina jau sumokėjęs, nors platformoje mokėjimo nėra',
      'Nuoroda „patvirtinti gavimą“ ar „gauti pinigus“',
      'Siūlymas atsiųsti „kurjerį“, kuris viską sutvarkys',
      'Spaudimas viską daryti ne per platformą',
    ],
    patterns: [
      { kind: 'regex', value: 'patvirtink\\w*[^!?\\n]{0,20}gavim', weight: 5, noteLt: 'Prašoma „patvirtinti gavimą“ — platformos taip neveikia' },
      { kind: 'regex', value: 'patvirtink\\w*[^!?\\n]{0,20}mokejim', weight: 5, noteLt: 'Prašoma „patvirtinti mokėjimą“ per nuorodą' },
      { kind: 'regex', value: 'jau (sumokejau|apmokejau|pervedziau)', weight: 4, noteLt: 'Pirkėjas tvirtina jau sumokėjęs' },
      { kind: 'phrase', value: 'gavote mokejima', weight: 4 },
      { kind: 'regex', value: 'kurjer\\w*[^!?\\n]{0,20}atsius', weight: 4, noteLt: 'Žadama atsiųsti „kurjerį“ — dažna apgaulės detalė' },
      { kind: 'phrase', value: 'ne per platforma', weight: 3 },
    ],
    scammerGoalLt: 'Paspausti netikrą „pinigų gavimo“ nuorodą ir įvesti kortelės duomenis.',
    safeActionLt:
      'Vinted ir kitos platformos pinigus įskaito automatiškai — jokio „gavimo patvirtinimo“ nereikia. '
      + 'Bendraukite ir atsiskaitykite tik platformos viduje.',
    baseWeight: 7,
    examplesLt: [
      'Aš jau sumokėjau per Vinted, patvirtinkite gavimą čia: https://vinted-pay-lt.com/confirm',
      'Pinigus išsiunčiau, kurjerį atsiųsiu jūsų adresu, tik patvirtinkite mokėjimą nuorodoje.',
    ],
    sources: ['platformos', 'policija'],
  },

  // ── 4. Rental deposit ──────────────────────────────────────────────────────
  {
    id: 'rental_deposit',
    nameLt: 'Nuomos depozito sukčiavimas',
    explanationLt:
      'Skelbiamas patrauklus butas, bet „savininkas užsienyje“ ir buto parodyti negali — prašoma pervesti '
      + 'depozitą ar rezervacijos mokestį dar nepamačius būsto.',
    redFlagsLt: [
      'Savininkas „užsienyje“, buto parodyti negali',
      'Prašomas depozitas ar rezervacijos mokestis prieš apžiūrą',
      'Kaina aiškiai mažesnė nei rinkos',
      'Žadama atsiųsti raktus paštu',
    ],
    patterns: [
      { kind: 'regex', value: '(esu|savinink\\w*|seiminink\\w*)[^!?\\n]{0,40}uzsien', weight: 5, noteLt: 'Savininkas „užsienyje“ ir negali parodyti būsto' },
      { kind: 'regex', value: '(rezervacij|uzstat|depozit|avans)\\w*[^!?\\n]{0,40}(perves|sumokek|apmokek)', weight: 5, noteLt: 'Prašoma pervesti depozitą iš anksto' },
      { kind: 'regex', value: '(perves\\w*|sumokek\\w*)[^!?\\n]{0,40}(depozit|uzstat|avans|rezervacin)', weight: 5, noteLt: 'Prašoma pervesti depozitą iš anksto' },
      { kind: 'phrase', value: 'depozit', weight: 2 },
      { kind: 'phrase', value: 'uzstat', weight: 2 },
      { kind: 'regex', value: 'rakt\\w*[^!?\\n]{0,30}(atsius|persius|pastu)', weight: 4, noteLt: 'Žadama atsiųsti raktus paštu' },
    ],
    scammerGoalLt: 'Pervesti depozitą už būstą, kurio sukčius nevaldo arba kuris neegzistuoja.',
    safeActionLt:
      'Niekada nemokėkite depozito nepamatę buto ir nepasirašę sutarties. Susitikite gyvai, '
      + 'patikrinkite savininko tapatybę ir nuosavybę.',
    baseWeight: 6,
    examplesLt: [
      'Butas Vilniuje, esu užsienyje, buto parodyti negaliu, bet rezervacijai perveskite 400 € depozitą, raktus atsiųsiu paštu.',
    ],
    sources: ['policija', 'platformos'],
  },

  // ── 5. Investment / crypto / fake broker ───────────────────────────────────
  {
    id: 'investment_crypto',
    nameLt: 'Investicijų / kriptovaliutų / netikrų brokerių sukčiavimas',
    explanationLt:
      'Žadama „garantuota grąža“ ar greitas uždarbis investuojant; „asmeninis brokeris“ padeda registruotis '
      + 'netikroje platformoje ir prašo pradinės įmokos ar nuotolinės prieigos prie ekrano.',
    redFlagsLt: [
      'Žadama garantuota ar neįtikėtinai didelė grąža',
      'Priskiriamas „asmeninis brokeris“ ar konsultantas',
      'Prašoma įdiegti AnyDesk / TeamViewer',
      'Spaudimas greitai įnešti „pradinę įmoką“',
    ],
    patterns: [
      { kind: 'regex', value: 'garantuot\\w*[^!?\\n]{0,25}(graz|peln|pajam|procent)', weight: 5, noteLt: 'Žadama „garantuota grąža“ — teisėtos investicijos to negarantuoja' },
      { kind: 'regex', value: 'uzdirb\\w*[^!?\\n]{0,30}(per (diena|savaite|menesi)|is namu|namuose)', weight: 4, noteLt: 'Žadamas greitas uždarbis' },
      { kind: 'regex', value: 'asmenin\\w* (brokeri|konsultant|vadybinink)', weight: 4, noteLt: 'Priskiriamas „asmeninis brokeris“' },
      { kind: 'phrase', value: 'kript', weight: 3 },
      { kind: 'phrase', value: 'bitcoin', weight: 2 },
      { kind: 'phrase', value: 'anydesk', weight: 5, noteLt: 'Prašoma įdiegti nuotolinio valdymo programą — sukčiai taip perima ekraną' },
      { kind: 'phrase', value: 'teamviewer', weight: 5, noteLt: 'Prašoma įdiegti nuotolinio valdymo programą — sukčiai taip perima ekraną' },
      { kind: 'regex', value: '(pradine|minimali)[^!?\\n]{0,15}(imoka|investicija|suma)', weight: 4, noteLt: 'Prašoma „pradinė įmoka“' },
      { kind: 'regex', value: '(investicij|investicin)\\w*[^!?\\n]{0,15}platform', weight: 3 },
      { kind: 'regex', value: 'padvigubin\\w*', weight: 4 },
    ],
    scammerGoalLt: 'Pervesti „pradinę įmoką“ į netikrą platformą arba suteikti nuotolinę prieigą prie kompiuterio.',
    safeActionLt:
      'Patikrinkite, ar įmonė turi Lietuvos banko licenciją (lb.lt įspėjimų sąrašai). Niekada nediekite '
      + 'nuotolinės prieigos programų svetimų žmonių prašymu.',
    baseWeight: 7,
    examplesLt: [
      'Investuokite į kriptovaliutas su asmeniniu brokeriu — garantuota 15% grąža per mėnesį! Minimali pradinė įmoka 250 €.',
    ],
    sources: ['lietuvos_bankas', 'policija'],
  },

  // ── 6. Fake job / recruiter / task scam ────────────────────────────────────
  {
    id: 'fake_job',
    nameLt: 'Netikrų darbo pasiūlymų / užduočių sukčiavimas',
    explanationLt:
      'Siūlomas lengvas nuotolinis darbas ar „užduočių“ atlikimas už komisinius; galiausiai prašoma '
      + 'susimokėti „registracijos mokestį“ arba įnešti savų pinigų „užduotims atblokuoti“.',
    redFlagsLt: [
      'Žadamas didelis uždarbis be patirties',
      'Už įsidarbinimą prašoma susimokėti',
      'Darbas — „užduotys“ su komisiniais',
      'Bendravimas tik per Telegram / WhatsApp',
    ],
    patterns: [
      { kind: 'regex', value: '(darb|uzdarb|uzsidirb)\\w*[^!?\\n]{0,25}(namuose|internetu|nuotolin)|nuotolin\\w*[^!?\\n]{0,10}darb', weight: 4, noteLt: 'Siūlomas „lengvas darbas namuose / nuotoliniu“' },
      { kind: 'regex', value: '(registracijos|aktyvavimo|starto) mokest', weight: 5, noteLt: 'Už įsidarbinimą prašoma susimokėti — tikri darbdaviai to neprašo' },
      { kind: 'regex', value: 'atlik\\w*[^!?\\n]{0,30}uzduot', weight: 4, noteLt: 'Siūloma uždirbti atliekant „užduotis“' },
      { kind: 'regex', value: 'komisin\\w*[^!?\\n]{0,25}(uzduot|uzsakym)', weight: 4 },
      { kind: 'phrase', value: 'be patirties', weight: 3 },
      { kind: 'regex', value: 'uzdirb\\w*[^!?\\n]{0,15}iki \\d+', weight: 3 },
      { kind: 'phrase', value: 'lengvas uzdarbis', weight: 3 },
    ],
    scammerGoalLt: 'Sumokėti „registracijos mokestį“ arba įnešti savų pinigų į „užduočių“ platformą.',
    safeActionLt:
      'Tikri darbdaviai niekada neprašo mokėti už įdarbinimą. Patikrinkite įmonę Registrų centre '
      + 'ir ieškokite atsiliepimų internete.',
    baseWeight: 5,
    examplesLt: [
      'Siūlome nuotolinį darbą: atlikite paprastas užduotis ir uždirbkite iki 300 € per dieną. Registracijos mokestis 25 €.',
    ],
    sources: ['policija', 'ziniasklaida'],
  },

  // ── 7. Romance scam ────────────────────────────────────────────────────────
  {
    id: 'romance',
    nameLt: 'Romantinis sukčiavimas',
    explanationLt:
      'Po ilgesnio bendravimo pažinčių platformoje „partneris“ (dažnai karys, gydytojas ar inžinierius '
      + 'užsienyje) prašo pinigų bilietui, gydymui ar „muitinėje užstrigusiai dovanai“ atsiimti.',
    redFlagsLt: [
      'Žmogus, kurio niekada nematėte gyvai, prašo pinigų',
      'Dovana ar siuntinys „užstrigęs muitinėje“',
      'Dramatiškos aplinkybės: misija, liga, nelaimė',
      'Atsisako vaizdo skambučių',
    ],
    patterns: [
      { kind: 'phrase', value: 'myliu', weight: 3 },
      { kind: 'phrase', value: 'pazinci', weight: 3 },
      { kind: 'regex', value: '(siuntin|dovan)\\w*[^!?\\n]{0,40}muitin', weight: 5, noteLt: 'Dovana „užstrigusi muitinėje“ — klasikinė schema' },
      { kind: 'regex', value: '(karys|kareivis|gydytoj\\w*|inzinier\\w*)[^!?\\n]{0,40}(misij|uzsien|laivyn)', weight: 4, noteLt: 'Pasakojama apie „misiją užsienyje“' },
      { kind: 'regex', value: '(reikia|praso|prasau) pinig\\w*[^!?\\n]{0,40}(biliet|kelion|gydym|viz|muit|mokest)', weight: 5, noteLt: 'Prašoma pinigų bilietui, gydymui ar mokesčiui' },
      { kind: 'regex', value: 'niekada nesusitik', weight: 3 },
    ],
    scammerGoalLt: 'Pervesti pinigus žmogui, kurio auka niekada nėra mačiusi gyvai.',
    safeActionLt:
      'Niekada nesiųskite pinigų žmogui, kurio nesate sutikę gyvai. Pasiūlykite vaizdo skambutį — '
      + 'sukčiai jo vengia. Pasitarkite su artimaisiais.',
    baseWeight: 5,
    examplesLt: [
      'Mano meile, mano siuntinys tau užstrigo muitinėje, reikia pinigų mokesčiui, pervesk per Western Union.',
    ],
    sources: ['policija', 'ziniasklaida'],
  },

  // ── 8. "Hi mom / hi dad" family emergency ──────────────────────────────────
  {
    id: 'family_emergency',
    nameLt: '„Mama / tėti“ skubios pagalbos sukčiavimas',
    explanationLt:
      'Sukčius apsimeta vaiku ar artimuoju, rašančiu iš „naujo numerio“ (dažnai WhatsApp): telefonas neva '
      + 'sugedo, o pinigus reikia pervesti skubiai — kol auka nespėjo perskambinti tikruoju numeriu.',
    redFlagsLt: [
      'Žinutė iš nepažįstamo numerio: „čia mano naujas numeris“',
      'Pasakojimas apie sugedusį / pamestą telefoną',
      'Prašymas skubiai pervesti pinigų ar apmokėti sąskaitą',
      '„Negaliu kalbėti“ — vengiama skambučio',
    ],
    patterns: [
      { kind: 'regex', value: '(cia )?mano naujas numeris', weight: 5, noteLt: 'Rašoma iš „naujo numerio“ — apsimetama artimuoju' },
      { kind: 'regex', value: 'pasikeit\\w*[^!?\\n]{0,15}numer', weight: 4 },
      { kind: 'regex', value: '(sudauz|sugedo|suluzo|pamec|prarad|imec)\\w*[^!?\\n]{0,20}telefon|telefon\\w*[^!?\\n]{0,20}(sudu|sugedo|suluzo|vanden)', weight: 5, noteLt: 'Pasakojama apie sugedusį ar pamestą telefoną' },
      { kind: 'regex', value: '\\b(mama|mamyte|teti|tetis|mociute|seneli)\\b', weight: 2 },
      { kind: 'regex', value: 'rasau is (draugo|kito|naujo|svetimo)', weight: 5, noteLt: 'Rašoma neva iš svetimo numerio' },
      { kind: 'regex', value: 'negaliu (paskambinti|atsiliepti|kalbeti|skambinti)', weight: 4, noteLt: 'Vengiama skambučio balsu' },
      { kind: 'regex', value: 'gali (pervesti|paskolinti|apmoketi)', weight: 4, noteLt: 'Prašoma pervesti ar paskolinti pinigų' },
      { kind: 'regex', value: 'parasyk[^!?\\n]{0,20}(whatsapp|viber|telegram)', weight: 4 },
    ],
    scammerGoalLt: 'Skubus pavedimas į svetimą sąskaitą, kol auka nepatikrino, ar tikrai rašo artimasis.',
    safeActionLt:
      'Paskambinkite artimajam SENUOJU numeriu. Nepervesite pinigų, kol neišgirsite balso. '
      + 'Susitarkite šeimoje slaptą klausimą tokiems atvejams.',
    baseWeight: 8,
    examplesLt: [
      'Labas mama, čia mano naujas numeris. Sudaužiau telefoną. Parašyk man WhatsApp, reikia skubiai apmokėti sąskaitą.',
    ],
    sources: ['policija', 'nksc_cert'],
  },

  // ── 9. Fake government institution ─────────────────────────────────────────
  {
    id: 'gov_impersonation',
    nameLt: 'Netikri valstybės institucijų pranešimai',
    explanationLt:
      'Apsimetama VMI, Sodra, policija ar kita institucija: žadamas mokesčių grąžinimas ar išmoka, '
      + 'arba gąsdinama bauda — duomenys „patvirtinami“ netikrame puslapyje.',
    redFlagsLt: [
      'Netikėtas „mokesčių grąžinimas“ ar „išmoka“',
      'Prašoma įvesti banko duomenis grąžinimui gauti',
      'Nuoroda ne į oficialų .lt institucijos domeną',
      'Institucijos taip nebendrauja — jos naudoja oficialias sistemas',
    ],
    patterns: [
      { kind: 'regex', value: '\\b(vmi|sodra|regitra|epolicija|muitine)\\b', weight: 3 },
      { kind: 'regex', value: '(mokesci\\w*|gpm|pvm)[^!?\\n]{0,20}(grazinim|permok)', weight: 5, noteLt: 'Žadamas mokesčių grąžinimas per nuorodą' },
      { kind: 'regex', value: 'jums (priklauso|priskirta|skirta)[^!?\\n]{0,30}(ismoka|grazinim|kompensacij|permok)', weight: 5, noteLt: 'Žadama netikėta išmoka ar kompensacija' },
      { kind: 'phrase', value: 'kompensacij', weight: 3 },
      { kind: 'regex', value: 'deklaracij\\w*[^!?\\n]{0,30}(patvirtink|atnaujink)', weight: 3 },
      { kind: 'regex', value: 'bauda[^!?\\n]{0,30}(apmokek|sumokek)|(apmokek|sumokek)\\w*[^!?\\n]{0,20}bauda', weight: 4, noteLt: 'Reikalaujama skubiai apmokėti „baudą“' },
    ],
    scammerGoalLt: 'Paspausti nuorodą ir įvesti banko ar asmens duomenis „grąžinimui gauti“.',
    safeActionLt:
      'Institucijos pinigų negrąžina per SMS nuorodas. Prisijunkite tiesiogiai prie oficialios sistemos '
      + '(pvz., deklaravimas.vmi.lt, sodra.lt), adresą įvedę ranka.',
    baseWeight: 6,
    examplesLt: [
      'VMI: Jums priklauso 156 € mokesčių grąžinimas. Patvirtinkite banko duomenis čia: https://vmi-grazinimas.com',
    ],
    sources: ['institucijos', 'nksc_cert'],
  },

  // ── 10. Utility bill / parking fine / toll ─────────────────────────────────
  {
    id: 'utility_fine',
    nameLt: 'Komunalinių mokesčių / baudų sukčiavimas',
    explanationLt:
      'Pranešama apie „neapmokėtą“ sąskaitą, parkavimo baudą ar kelių mokestį; grasinama atjungimu ar '
      + 'antstoliais ir pateikiama netikra apmokėjimo nuoroda.',
    redFlagsLt: [
      'Netikėta „neapmokėta“ sąskaita ar bauda',
      'Grasinimas atjungimu, antstoliais ar teismu',
      'Apmokėjimo nuoroda ne oficialioje sistemoje',
      'Labai trumpas terminas sumokėti',
    ],
    patterns: [
      { kind: 'regex', value: 'neapmoket\\w*', weight: 4, noteLt: 'Pranešama apie „neapmokėtą“ sąskaitą ar baudą' },
      { kind: 'phrase', value: 'parkavimo bauda', weight: 5, noteLt: 'Netikėta „parkavimo bauda“' },
      { kind: 'regex', value: 'keli\\w{0,2} mokest', weight: 4 },
      { kind: 'regex', value: '(elektros|duj\\w{1,3}|vandens|silumos)[^!?\\n]{0,15}(saskait|skol)', weight: 4, noteLt: 'Tariama komunalinių paslaugų skola' },
      { kind: 'phrase', value: 'skola', weight: 2 },
      { kind: 'regex', value: 'gresia (atjungim|antstol)', weight: 4, noteLt: 'Grasinama atjungimu ar antstoliais' },
      { kind: 'regex', value: '(antstol|ieskinys|teismas)', weight: 3 },
    ],
    scammerGoalLt: 'Apmokėti netikrą sąskaitą ar baudą per sukčių pateiktą nuorodą.',
    safeActionLt:
      'Skolas tikrinkite tik prisijungę prie oficialios tiekėjo savitarnos (adresą įveskite ranka) '
      + 'arba paskambinę oficialiu numeriu.',
    baseWeight: 5,
    examplesLt: [
      'Pranešimas: neapmokėta parkavimo bauda 15 €. Apmokėkite per 24 val., kitaip bus perduota antstoliams.',
    ],
    sources: ['institucijos', 'nksc_cert'],
  },

  // ── 11. AI voice / deepfake impersonation ──────────────────────────────────
  {
    id: 'voice_deepfake',
    nameLt: 'AI balso / deepfake apsimetinėjimas',
    explanationLt:
      'Skambutis ar balso žinutė, kurioje artimojo ar vadovo balsas (galimai klonuotas dirbtinio intelekto) '
      + 'prašo skubiai pervesti pinigus. Dažnai aukos pačios aprašo tokį įvykį.',
    redFlagsLt: [
      'Skambutis iš nežinomo numerio pažįstamu balsu',
      'Skubus prašymas pervesti pinigus',
      'Spaudimas niekam nepasakoti',
      'Negalima perskambinti įprastu numeriu',
    ],
    patterns: [
      { kind: 'regex', value: 'balsas[^!?\\n]{0,30}(panasus|kaip|identisk|toks pat)', weight: 5, noteLt: 'Balsas „kaip artimojo“ — galimas AI balso klastojimas' },
      { kind: 'regex', value: 'skambin\\w*[^!?\\n]{0,40}(sunus|dukra|dukte|vaikas|anuk|mama|tetis|vadov|direktor)', weight: 4, noteLt: 'Skambino neva artimasis ar vadovas' },
      { kind: 'regex', value: '(vadov\\w*|direktor\\w*|virsinink\\w*)[^!?\\n]{0,50}(perves|pavedim|apmoke|sumoke)', weight: 5, noteLt: 'Nurodymas pervesti pinigus neva iš vadovo' },
      { kind: 'phrase', value: 'deepfake', weight: 4 },
      { kind: 'regex', value: '(liepe|prase|reikalavo)[^!?\\n]{0,15}skubiai[^!?\\n]{0,15}(perves|apmoke|sumoke)', weight: 5, noteLt: 'Reikalaujama skubaus pavedimo' },
      { kind: 'regex', value: 'nezinomo numerio', weight: 3 },
    ],
    scammerGoalLt: 'Skubus pavedimas po emocinio spaudimo „artimojo“ ar „vadovo“ balsu.',
    safeActionLt:
      'Padėkite ragelį ir perskambinkite tikruoju artimojo ar įmonės numeriu. Joks tikras vadovas '
      + 'nereikalaus slapto skubaus pavedimo telefonu.',
    baseWeight: 7,
    examplesLt: [
      'Skambino sūnus iš nežinomo numerio, balsas buvo identiškas, prašė skubiai pervesti 800 € už operaciją.',
    ],
    sources: ['nksc_cert', 'ziniasklaida'],
  },

  // ── 12. Invoice / business email compromise ────────────────────────────────
  {
    id: 'invoice_bec',
    nameLt: 'Sąskaitų / verslo el. pašto (BEC) sukčiavimas',
    explanationLt:
      'Įmonei ar buhalterijai pranešama apie „pasikeitusius tiekėjo rekvizitus“ arba „vadovas“ liepia '
      + 'skubiai apmokėti sąskaitą — pinigai nukreipiami į sukčių sąskaitą.',
    redFlagsLt: [
      'Pranešimas apie pasikeitusius banko rekvizitus',
      'Skubus „vadovo“ nurodymas apmokėti sąskaitą',
      'Siuntėjo adresas panašus, bet ne identiškas tikram',
      'Spaudimas apeiti įprastą patvirtinimo tvarką',
    ],
    patterns: [
      { kind: 'regex', value: '(pasikeite|nauji|atnaujint\\w*|pakeite)[^!?\\n]{0,25}rekvizit', weight: 5, noteLt: 'Pranešama apie „pasikeitusius rekvizitus“ — dažna BEC schema' },
      { kind: 'regex', value: 'rekvizit\\w*[^!?\\n]{0,20}(pasikeite|atnaujint)', weight: 5, noteLt: 'Pranešama apie „pasikeitusius rekvizitus“ — dažna BEC schema' },
      { kind: 'regex', value: 'i nauj\\w*[^!?\\n]{0,20}saskait', weight: 4, noteLt: 'Prašoma mokėti į „naują sąskaitą“' },
      { kind: 'regex', value: 'apmok\\w*[^!?\\n]{0,30}saskait', weight: 3 },
      { kind: 'regex', value: '(direktor\\w*|vadov\\w*)[^!?\\n]{0,20}(prase|liepe|nurode)', weight: 4, noteLt: 'Nurodymas neva iš vadovo' },
      { kind: 'phrase', value: 'priseguta saskaita', weight: 3 },
      { kind: 'regex', value: 'skub\\w*[^!?\\n]{0,15}(apmoke|pavedim|saskait)', weight: 3 },
    ],
    scammerGoalLt: 'Apmokėti tikrai atrodančią sąskaitą į sukčiaus banko sąskaitą.',
    safeActionLt:
      'Rekvizitų pakeitimą visada patvirtinkite skambučiu žinomu tiekėjo numeriu (ne tuo, kuris '
      + 'nurodytas laiške). Skubius vadovo prašymus patikrinkite tiesiogiai.',
    baseWeight: 6,
    examplesLt: [
      'Informuojame, kad pasikeitė mūsų banko rekvizitai. Prašome apmokėti prisegtą sąskaitą į naują sąskaitą šiandien.',
    ],
    sources: ['nksc_cert', 'policija'],
  },

  // ── 13. Short-link / suspicious domain ─────────────────────────────────────
  {
    id: 'shortlink_domain',
    nameLt: 'Trumpųjų nuorodų / įtartinų domenų sukčiavimas',
    explanationLt:
      'Žinutė ragina spausti sutrumpintą (bit.ly, tinyurl) ar kitaip maskuotą nuorodą — tikrasis adresas '
      + 'nematomas, o paskirties puslapis prašo prisijungti ar įvesti duomenis.',
    redFlagsLt: [
      'Sutrumpinta nuoroda slepia tikrąjį adresą',
      'Raginimas skubiai paspausti nuorodą',
      'Nuoroda „galioja ribotą laiką“',
      'Prašoma prisijungti prie paskyros per nuorodą',
    ],
    patterns: [
      { kind: 'phrase', value: 'bit.ly', weight: 4, noteLt: 'Sutrumpinta nuoroda slepia tikrąjį adresą' },
      { kind: 'phrase', value: 'tinyurl', weight: 4, noteLt: 'Sutrumpinta nuoroda slepia tikrąjį adresą' },
      { kind: 'phrase', value: 'cutt.ly', weight: 4, noteLt: 'Sutrumpinta nuoroda slepia tikrąjį adresą' },
      { kind: 'phrase', value: 'rb.gy', weight: 4, noteLt: 'Sutrumpinta nuoroda slepia tikrąjį adresą' },
      { kind: 'phrase', value: 'is.gd', weight: 3 },
      { kind: 'phrase', value: 'goo.gl', weight: 3 },
      { kind: 'regex', value: '(pa)?spausk\\w*[^!?\\n]{0,20}nuorod', weight: 3, noteLt: 'Raginama spausti nuorodą' },
      { kind: 'regex', value: 'nuoroda galios[^!?\\n]{0,15}(val|min|dien)', weight: 3, noteLt: 'Nuoroda neva galioja ribotą laiką' },
      { kind: 'regex', value: 'prisijunk\\w*[^!?\\n]{0,25}paskyr', weight: 4, noteLt: 'Prašoma prisijungti prie paskyros per nuorodą' },
      { kind: 'regex', value: 'atsisiusk\\w*', weight: 2 },
    ],
    scammerGoalLt: 'Paspausti maskuotą nuorodą ir paskirties puslapyje įvesti prisijungimo ar kortelės duomenis.',
    safeActionLt:
      'Nespauskite sutrumpintų nuorodų iš nepažįstamų siuntėjų. Reikiamą svetainę pasiekite '
      + 'adresą įvedę ranka naršyklėje.',
    baseWeight: 4,
    examplesLt: [
      'Jūsų dokumentas paruoštas. Atsisiųskite čia: bit.ly/3xKd9 — nuoroda galios 24 val.',
    ],
    sources: ['nksc_cert', 'demo'],
  },
]

export function getScamCategory(id: ScamCategoryId): ScamCategory | undefined {
  return SCAM_CATEGORIES.find(c => c.id === id)
}
