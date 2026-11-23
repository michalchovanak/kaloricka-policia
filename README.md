# 👮🍅 Kalorická polícia

Hravý tracker kalórií v štýle Duolinga. Odfotíš jedlo, Claude odhadne kalórie, bielkoviny, cukor, vlákninu a soľ, a maskot Paťo ti vedie štatistiky, sériu (streak), XP a odznaky.

## Ako to funguje

- **PWA (web appka na plochu).** Nepotrebuje Apple developer účet ani App Store. Pošleš link, kamoš otvorí v Safari → **Zdieľať → Pridať na plochu**. Beží na celú obrazovku s ikonou, fotoaparát sa otvorí na jeden klik.
- **Dáta sú v telefóne** (IndexedDB). Voliteľný účet (email + heslo, Supabase) ich synchronizuje, takže sa nestratia pri zmazaní appky ani pri novom mobile. Schéma je v `supabase/migrations`, nasadenie: `supabase db push`.
- **AI analýza** beží na serveri (`/api/analyze`) cez Claude API (model `claude-opus-5-5`, effort `low`, štruktúrovaný výstup). Fotka sa v telefóne zmenší na 1280 px, takže analýza stojí rádovo 1–3 centy.
- **Prístup:** predvolene sa používa tvoj serverový kľúč, chránený **pozývacím kódom** (`APP_INVITE_CODE`). Ktokoľvek si môže v profile zadať **vlastný Claude API kľúč**. Ten sa uloží len v jeho telefóne a posiela sa iba s jeho požiadavkami.

> Claude Pro/Max predplatné sa nedá použiť ako backend pre vlastnú appku. Potrebuješ API kľúč z [console.anthropic.com](https://console.anthropic.com).

## Lokálne spustenie

```bash
cp .env.example .env.local   # doplň ANTHROPIC_API_KEY a APP_INVITE_CODE
npm install
npm run dev
```

## Nasadenie (Vercel)

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add APP_INVITE_CODE production
vercel deploy --prod
```

## Štruktúra

| Súbor | Čo robí |
|---|---|
| `src/lib/nutrition.ts` | Ciele (Mifflin-St Jeor, WHO/EFSA limity) a skóre kvality 0–100 |
| `src/lib/game.ts` | XP, hodnosti, séria, odznaky, denné úlohy |
| `src/lib/capture.ts` | Fotka → okamžite uložené jedlo → analýza na pozadí |
| `src/app/api/analyze/route.ts` | Claude vision + štruktúrovaný JSON výstup |
| `docs/nutrition-research.md` | Rešerš: vzorce, limity, zdroje |
| `docs/design-system.md` | Dizajn systém, maskot, tón komunikácie |

Odhady AI nie sú lekárska rada.
