import { MessageCategory } from '@/lib/types'

export interface CategoryOption {
  value: MessageCategory
  label: string         // Full label (used on result page)
  chipLabel: string     // Short label (used in the chip selector)
  description: string
  emoji: string
}

export const CATEGORIES: CategoryOption[] = [
  {
    value: 'vinted',
    label: 'Vinted',
    chipLabel: 'Vinted',
    description: 'Pirkėjo ar pardavėjo žinutė',
    emoji: '👗',
  },
  {
    value: 'facebook_marketplace',
    label: 'Facebook Marketplace',
    chipLabel: 'Marketplace',
    description: 'Pirkimo ar pardavimo žinutė',
    emoji: '🛒',
  },
  {
    value: 'sms',
    label: 'SMS žinutė',
    chipLabel: 'SMS',
    description: 'Kurjeris, bankas, paštas, muitinė',
    emoji: '📱',
  },
  {
    value: 'email',
    label: 'El. laiškas',
    chipLabel: 'El. laiškas',
    description: 'Įtartinas elektroninis laiškas',
    emoji: '✉️',
  },
  {
    value: 'classified_ad',
    label: 'Skelbimas',
    chipLabel: 'Skelbimas',
    description: 'Skelbiu.lt, Aruodas.lt ir kt.',
    emoji: '📋',
  },
  {
    value: 'payment_request',
    label: 'Mokėjimo prašymas',
    chipLabel: 'Mokėjimas',
    description: 'Sąskaita, nuoroda, patvirtinimas',
    emoji: '💳',
  },
  {
    value: 'other',
    label: 'Kita',
    chipLabel: 'Kita',
    description: 'Nepriklauso jokiai kategorijai',
    emoji: '❓',
  },
]

// FIX H3: get human-readable label from category value
export function getCategoryLabel(value: MessageCategory): string {
  return CATEGORIES.find(c => c.value === value)?.label ?? value
}

export function getCategoryEmoji(value: MessageCategory): string {
  return CATEGORIES.find(c => c.value === value)?.emoji ?? '❓'
}
