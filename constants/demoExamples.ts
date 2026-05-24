import { MessageCategory, Situation } from '@/lib/types'

export interface DemoExample {
  id: string
  label: string                  // Chip label shown to the user
  category: MessageCategory
  situation: Situation
  text: string
  url?: string
}

// Pre-filled examples that populate the form when clicked.
// All numbers / domains here are fabricated for demo purposes.
export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: 'vinted_pay',
    label: 'Vinted mokėjimo nuoroda',
    category: 'vinted',
    situation: 'none',
    text: 'Aš jau sumokėjau per Vinted, patvirtink mokėjimą čia: https://vinted-pay-lt.com/confirm',
    url: 'https://vinted-pay-lt.com/confirm',
  },
  {
    id: 'lp_address',
    label: 'Lietuvos pašto SMS dėl adreso',
    category: 'sms',
    situation: 'none',
    text: 'Lietuvos paštas: siunta negali būti pristatyta, atnaujinkite adresą per 24 val.: https://post-lt-adresas.com',
  },
  {
    id: 'dpd_fee',
    label: 'DPD SMS dėl mokesčio',
    category: 'sms',
    situation: 'none',
    text: 'DPD: jūsų siunta sulaikyta. Sumokėkite 2.99€ pristatymo mokestį: http://dpd-lt-pay.com',
  },
  {
    id: 'bank_smartid',
    label: 'Banko Smart-ID SMS',
    category: 'sms',
    situation: 'none',
    text: 'SEB: pastebėta įtartina veikla. Patvirtinkite tapatybę su Smart-ID kodu.',
  },
  {
    id: 'rent_deposit',
    label: 'Nuomos depozito prašymas',
    category: 'classified_ad',
    situation: 'none',
    text: 'Butas Vilniuje, savininkas užsienyje. Rezervacijai perveskite 400€ depozitą.',
  },
  {
    id: 'normal_vinted',
    label: 'Normalus Vinted klausimas',
    category: 'vinted',
    situation: 'none',
    text: 'Labas! Ar prekė dar yra? Koks dydis?',
  },
]
