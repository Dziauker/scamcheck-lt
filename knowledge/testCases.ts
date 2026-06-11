// ─── ScamCheck LT v0.2 — scam engine test cases ──────────────────────────────
//
// Run by tests/scamEngine.test.ts via `npm test`.
//
// Each case goes through the full getMockAnalysis() pipeline (situation 'none').
//   expectMinLevel       — result must be at least this strict
//   expectMaxLevel       — result must be at most this strict (false-positive control)
//   expectCategories     — each listed scam type must appear in detected_scam_types
//
// All texts are fabricated demo messages; domains and numbers are not real.

import { RiskLevel, MessageCategory, ScamCategoryId } from '@/lib/types'

export interface ScamTestCase {
  id: string
  description: string
  category: MessageCategory
  text: string
  url?: string
  expectMinLevel: RiskLevel
  expectMaxLevel?: RiskLevel
  expectCategories?: ScamCategoryId[]
}

export const SCAM_TEST_CASES: ScamTestCase[] = [

  // ── Courier / customs fee ──────────────────────────────────────────────────
  {
    id: 'courier_customs_fee',
    description: 'DPD muitinės mokesčio SMS su netikra nuoroda',
    category: 'sms',
    text: 'DPD: jusu siunta sulaikyta muitineje. Sumokekite 2.49 EUR muito mokesti: http://dpd-lt-pay.com',
    expectMinLevel: 'kritine',
    expectCategories: ['courier_customs'],
  },
  {
    id: 'courier_address_update',
    description: 'Lietuvos pašto „atnaujinkite adresą" SMS (be diakritikų)',
    category: 'sms',
    text: 'Lietuvos pastas: nepavyko pristatyti siuntos, atnaujinkite adresa per 24 val: post-lt-adresas.info',
    expectMinLevel: 'kritine',
    expectCategories: ['courier_customs'],
  },

  // ── Bank / Smart-ID / account blocked ──────────────────────────────────────
  {
    id: 'bank_blocked_smartid',
    description: 'SEB užblokuotos sąskaitos SMS su Smart-ID prašymu',
    category: 'sms',
    text: 'SEB bankas: jusu saskaita laikinai uzblokuota del itartinos veiklos. Patvirtinkite tapatybe su Smart-ID.',
    expectMinLevel: 'kritine',
    expectCategories: ['bank_account_block'],
  },
  {
    id: 'bank_unblock_link',
    description: 'Swedbank „atblokuokite paskyrą" su apsimetinėjimo domenu',
    category: 'sms',
    text: 'Swedbank: pastebejome neiprasta prisijungima. Atblokuokite paskyra: https://swedbank-login-lt.com',
    expectMinLevel: 'kritine',
    expectCategories: ['bank_account_block'],
  },

  // ── Vinted / Marketplace fake payment ──────────────────────────────────────
  {
    id: 'marketplace_confirm_receipt',
    description: 'Vinted „patvirtinkite gavimą" nuoroda',
    category: 'vinted',
    text: 'As jau sumokejau per Vinted, patvirtinkite gavima cia: https://vinted-pay-lt.com/confirm',
    expectMinLevel: 'kritine',
    expectCategories: ['marketplace_fake_payment'],
  },
  {
    id: 'marketplace_courier_pickup',
    description: 'Marketplace pirkėjas su „kurjerio" schema',
    category: 'facebook_marketplace',
    text: 'Pinigus issiunciau per apmokejimo sistema, kurjeri atsiusiu jusu adresu, tik patvirtinkite mokejima nuorodoje.',
    expectMinLevel: 'kritine',
    expectCategories: ['marketplace_fake_payment'],
  },

  // ── Rental deposit ─────────────────────────────────────────────────────────
  {
    id: 'rental_abroad_deposit',
    description: 'Nuomos skelbimas: savininkas užsienyje, prašo depozito',
    category: 'classified_ad',
    text: 'Butas Vilniuje 300 eur/men. Esu uzsienyje, buto parodyti negaliu, bet rezervacijai perveskite 400 eur depozita, raktus atsiusiu pastu.',
    expectMinLevel: 'kritine',
    expectCategories: ['rental_deposit'],
  },
  {
    id: 'rental_large_deposit',
    description: 'Nuoma su dideliu išankstiniu depozitu',
    category: 'classified_ad',
    text: 'Nuomoju buta, depozitas 250 eur, pervesti reikia is anksto rezervacijai.',
    expectMinLevel: 'kritine',
    expectCategories: ['rental_deposit'],
  },

  // ── Investment / crypto / fake broker ──────────────────────────────────────
  {
    id: 'invest_guaranteed_return',
    description: 'Kripto investicija su garantuota grąža ir brokeriu',
    category: 'other',
    text: 'Investuokite i kriptovaliutas su asmeniniu brokeriu — garantuota 15% graza per menesi! Minimali pradine imoka tik 250 eur. Registruokites: https://lt-investpro.xyz',
    expectMinLevel: 'auksta',
    expectCategories: ['investment_crypto'],
  },
  {
    id: 'invest_anydesk',
    description: '„Konsultantas" prašo įdiegti AnyDesk',
    category: 'other',
    text: 'Sveiki, esu finansu konsultantas. Galiu padeti uzdirbti 500 eur per diena is namu. Tereikia idiegti AnyDesk programa.',
    expectMinLevel: 'auksta',
    expectCategories: ['investment_crypto'],
  },

  // ── Fake job / task scam ───────────────────────────────────────────────────
  {
    id: 'job_task_telegram',
    description: 'Užduočių darbas per Telegram su registracijos mokesčiu',
    category: 'other',
    text: 'Siulome nuotolini darba: atlikite paprastas uzduotis ir uzdirbkite iki 300 eur per diena. Registracijos mokestis tik 25 eur. Rasykite Telegram: @darbaslt',
    expectMinLevel: 'auksta',
    expectCategories: ['fake_job'],
  },
  {
    id: 'job_activation_fee',
    description: 'Uždarbis namuose su aktyvavimo mokesčiu',
    category: 'email',
    text: 'Uzsidirbkite namuose be patirties! Apmokame kasdien. Pradzioje reikia sumoketi 20 eur aktyvavimo mokesti.',
    expectMinLevel: 'auksta',
    expectCategories: ['fake_job'],
  },

  // ── Romance scam ───────────────────────────────────────────────────────────
  {
    id: 'romance_customs_gift',
    description: 'Romantinis sukčiavimas: dovana muitinėje, Western Union',
    category: 'other',
    text: 'Mano meile, as tave myliu. Mano siuntinys tau uzstrigo muitineje, reikia pinigu mokesciui sumoketi, pervesk per Western Union.',
    expectMinLevel: 'auksta',
    expectCategories: ['romance'],
  },
  {
    id: 'romance_soldier_ticket',
    description: 'Karys misijoje prašo pinigų bilietui',
    category: 'other',
    text: 'Susipazinome pazinciu programele. Jis karys, tarnauja misijoje uzsienyje, dabar praso pinigu bilietui namo.',
    expectMinLevel: 'auksta',
    expectCategories: ['romance'],
  },

  // ── "Hi mom / hi dad" family emergency ─────────────────────────────────────
  {
    id: 'family_new_number',
    description: '„Mama, čia mano naujas numeris" su skubiu mokėjimu',
    category: 'sms',
    text: 'Labas mama, cia mano naujas numeris. Sudauziau telefona. Parasyk man WhatsApp, reikia skubiai apmoketi saskaita.',
    expectMinLevel: 'auksta',
    expectCategories: ['family_emergency'],
  },
  {
    id: 'family_broken_phone',
    description: '„Tėti, sugedo telefonas" prašymas pervesti (be v0.1 raktažodžių)',
    category: 'sms',
    text: 'Teti, sugedo mano telefonas, rasau is draugo numerio. Gali pervesti 180 eur? Veliau paaiskinsiu.',
    expectMinLevel: 'auksta',
    expectCategories: ['family_emergency'],
  },

  // ── Fake government institution ────────────────────────────────────────────
  {
    id: 'gov_tax_refund',
    description: 'VMI mokesčių grąžinimo nuoroda',
    category: 'sms',
    text: 'VMI: Jums priklauso 156 eur mokesciu grazinimas. Patvirtinkite banko duomenis cia: https://vmi-grazinimas.com',
    expectMinLevel: 'kritine',
    expectCategories: ['gov_impersonation'],
  },
  {
    id: 'gov_sodra_benefit',
    description: 'Sodra išmokos žinutė su įtartinu domenu',
    category: 'sms',
    text: 'Sodra: jums priskirta 89 eur ismoka. Atsiimkite uzpilde forma: sodra-ismokos.info',
    expectMinLevel: 'auksta',
    expectCategories: ['gov_impersonation'],
  },

  // ── Utility bill / parking fine / toll ─────────────────────────────────────
  {
    id: 'utility_parking_fine',
    description: 'Netikra parkavimo bauda su antstolių grasinimu',
    category: 'sms',
    text: 'Pranesimas: neapmoketa parkavimo bauda 15 eur. Apmokekite per 24 val, kitaip bus perduota antstoliams: bauda-lt.com',
    expectMinLevel: 'kritine',
    expectCategories: ['utility_fine'],
  },
  {
    id: 'utility_electricity_debt',
    description: 'Netikra elektros skola su atjungimo grasinimu',
    category: 'sms',
    text: 'ESO: Jusu elektros saskaita neapmoketa. Gresia atjungimas. Apmokekite: eso-mokejimai.top',
    expectMinLevel: 'kritine',
    expectCategories: ['utility_fine'],
  },

  // ── AI voice / deepfake ────────────────────────────────────────────────────
  {
    id: 'voice_cloned_son',
    description: 'Vartotojas aprašo skambutį klonuotu sūnaus balsu',
    category: 'other',
    text: 'Skambino sunus is nezinomo numerio, balsas buvo identiskas, verke ir prase skubiai pervesti 800 eur uz operacija. Padejo rageli ir nebeatsiliepia.',
    expectMinLevel: 'auksta',
    expectCategories: ['voice_deepfake'],
  },

  // ── Invoice / BEC ──────────────────────────────────────────────────────────
  {
    id: 'bec_changed_requisites',
    description: 'Tiekėjo „pasikeitę rekvizitai" laiškas',
    category: 'email',
    text: 'Sveiki, informuojame, kad pasikeite musu banko rekvizitai. Prasome apmoketi priseguta saskaita nr. 2024-156 i nauja saskaita siandien.',
    expectMinLevel: 'auksta',
    expectCategories: ['invoice_bec'],
  },
  {
    id: 'bec_ceo_urgent',
    description: 'Skubus „direktoriaus" nurodymas apmokėti sąskaitą',
    category: 'email',
    text: 'Direktorius prase skubiai apmoketi sia saskaita siandien iki 15 val. Pavedima atlikite i nauja tiekejo saskaita.',
    expectMinLevel: 'auksta',
    expectCategories: ['invoice_bec'],
  },

  // ── Short-link / suspicious domain ─────────────────────────────────────────
  {
    id: 'shortlink_bitly',
    description: 'bit.ly nuoroda su ribotu galiojimu',
    category: 'sms',
    text: 'Jusu dokumentas paruostas. Atsisiuskite cia: bit.ly/3xKd9 Nuoroda galios 24 val.',
    expectMinLevel: 'auksta',
    expectCategories: ['shortlink_domain'],
  },
  {
    id: 'shortlink_xyz_login',
    description: 'Įtartinas .xyz domenas su prisijungimo prašymu',
    category: 'email',
    text: 'Perziurekite gautas nuotraukas: https://foto-lt.xyz/album Paspauskite nuoroda ir prisijunkite su savo paskyra.',
    expectMinLevel: 'auksta',
    expectCategories: ['shortlink_domain'],
  },

  // ═══ NEGATIVE CASES — normal messages must NOT become false positives ══════

  {
    id: 'neg_vinted_question',
    description: 'Normalus Vinted klausimas apie prekę',
    category: 'vinted',
    text: 'Labas! Ar preke dar yra? Koks dydis? Ar galite issiusti rytoj?',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_omniva_pickup',
    description: 'Tikras paštomato pranešimas be nuorodos ir mokesčio',
    category: 'sms',
    text: 'Omniva: Jusu siunta atvyko i pastomata Vilniuje. Atsiemimo kodas 1234. Atsiimkite per 7 dienas.',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_dpd_delivery_tomorrow',
    description: 'Tikras DPD pristatymo pranešimas',
    category: 'sms',
    text: 'DPD: kurjeris pristatys jusu siunta rytoj 9-17 val. Siuntos nr. 0512345.',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_bank_info',
    description: 'Informacinis banko pranešimas be nuorodų ir prašymų',
    category: 'sms',
    text: 'SEB primena: nuo geguzes 1 d. keiciasi ikainiai. Daugiau informacijos musu interneto banke.',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_friend_transfer',
    description: 'Draugo prašymas pervesti už pietus',
    category: 'other',
    text: 'Labas, ar gali pervesti man 10 eur uz vakarykscius pietus? Aciu!',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_rental_viewing',
    description: 'Normalus nuomos skelbimo atsakymas su apžiūra',
    category: 'classified_ad',
    text: 'Sveiki, butas dar nuomojamas. Galite atvykti apziureti rytoj 18 val. Adresas: Gedimino pr. 5.',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_job_interview',
    description: 'Tikras kvietimas į darbo pokalbį',
    category: 'email',
    text: 'Sveiki, gavome jusu CV. Kvieciame i pokalbi pirmadieni 10 val. musu biure.',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_internet_bill',
    description: 'Įprastas interneto sąskaitos priminimas',
    category: 'email',
    text: 'Primename: jusu saskaita uz interneta — 19,99 Eur. Apmoketi galite kaip iprastai iki menesio 25 d.',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_vmi_eds_reminder',
    description: 'Tikras VMI deklaravimo priminimas be nuorodos',
    category: 'sms',
    text: 'VMI primena: pajamu deklaracija pateikite iki geguzes 2 d. per EDS sistema.',
    expectMinLevel: 'zema',
    expectMaxLevel: 'zema',
  },
  {
    id: 'neg_whatsapp_move',
    description: 'Pasiūlymas bendrauti per WhatsApp (įtartina, bet ne aukšta)',
    category: 'vinted',
    text: 'Gal galim susirasineti per WhatsApp? Man taip patogiau del nuotrauku.',
    expectMinLevel: 'vidutine',
    expectMaxLevel: 'vidutine',
  },
]
