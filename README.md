# ScamCheck LT — Prototipas v0.1

Lietuviškas AI sukčiavimo rizikos vertinimo įrankis.

## Greitas startas

```bash
npm install
npm run dev
```

Atidarykite: http://localhost:3000

## Reikalavimai

- Node.js 18+
- npm 9+

## Kas įdiegta šiame prototype

- Pagrindinis puslapis su pateikimo forma
- Kategorijų pasirinkimas (7 kategorijos)
- Teksto įvedimo laukas + URL laukas
- Privatumo įspėjimas
- Animuota įkėlimo būsena
- Rezultatų puslapis su pilna analize
- Greiti atsakymai: Ar spausti? / Ar mokėti? / Ar atrašyti?
- Kritinė rizika: skubios situacijos blokas su konkrečiais veiksmais
- Pasyvus URL šablonų tikrinimas (be tinklo užklausų)
- Žmogaus peržiūros UI (be aktyvaus backend'o)
- Mobiliems pritaikytas dizainas
- Lietuviška vartotojo sąsaja

## Kas NEĮDIEGTA (v0.1 prototipas)

- Tikros Claude / OpenAI API užklausos (naudojamas mock)
- Supabase duomenų bazė
- Autentifikacija
- Tikros URL reputacijos API (Google Safe Browsing, VirusTotal)
- Ekranvaizdžio įkėlimas / OCR
- Mokėjimai
- Žmogaus peržiūros admin skydelis
- PDF ataskaitos

## Failų struktūra

```
app/
  page.tsx                    # Pagrindinis puslapis
  layout.tsx                  # Root layout
  globals.css                 # Stiliai + šriftai
  rezultatai/[caseId]/
    page.tsx                  # Rezultatų puslapis

components/
  Header.tsx                  # Navigacija
  SubmissionForm.tsx          # Forma + įkėlimo būsena
  ResultDisplay.tsx           # Pilnas rezultatų rodymas

lib/
  types.ts                    # TypeScript tipai
  generateCaseId.ts           # Bylos ID generatorius
  urlAnalysis.ts              # Pasyvus URL analizės modulis
  mockAnalysis.ts             # Mock AI analizės variklis

constants/
  categories.ts               # Kategorijų etiketės (LT)
  officialDomains.ts          # Oficialių domenų sąrašas
```

## Tolesni žingsniai (v0.2)

1. Prijungti tikrą Claude API (pakeisti `getMockAnalysis`)
2. Pridėti Supabase bylų saugojimui
3. Aktyvuoti URL reputacijos API (Google Safe Browsing)
4. Pridėti ekranvaizdžio įkėlimą + OCR
5. Sukurti žmogaus peržiūros admin skydelį

## Techninė informacija

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- DM Sans šriftas (Google Fonts)
- Mock analizė — veikia be API raktų
