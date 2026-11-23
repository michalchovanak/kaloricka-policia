# Kalorická polícia: design system

A playful, chunky, mobile-first design system for a calorie-tracking PWA with a Slovak UI.
It borrows the *principles* behind Duolingo's playfulness. It uses none of Duolingo's brand assets: no owl, no green brand colour, no Feather/DIN fonts and no names.

- Tokens: `design/tokens.css`
- Mascot: `public/mascot/{grumpy,watching,angry,approve,arrest,jail}.webp` (512×512, transparent)
- App icon: `public/icon-{192,512}.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`

---

## 1. What makes it feel playful (research notes)

These notes come from Duolingo iOS screens on Mobbin: onboarding flow, home path, lesson-complete, streak, quests, profile and answer feedback.

| Observed pattern | Why it works | How we use it |
|---|---|---|
| **Everything has a hard bottom "lip"**: buttons, path nodes, option cards, even the unit header | Objects look physical and pressable. Pressing pushes the face down into the lip, so a tap feels like clicking a real key | `.btn-3d`, `.option-3d`, `.card-3d`: a hard box-shadow lip that collapses on `:active` |
| **One question per screen** with a thin rounded progress bar on top and a back arrow | Low cognitive load. The bar shows constant progress, so you feel momentum | Onboarding: top `ProgressBar` + mascot bubble + 3–6 big `OptionCard`s + sticky CTA |
| **Mascot plus speech bubble** asks the question instead of a form label | Makes it feel like a conversation, and gives the app a personality | `MascotBubble` on every onboarding step, empty state and feedback moment |
| **Big tappable option cards**: full-width, 2px grey border and lip; selected = tinted fill + coloured border + coloured lip | Thumb-friendly, and the state is clear without checkboxes | `OptionCard` |
| **Celebration screens**: big mascot, a bold coloured headline, a short witty subline, then 3 stat tiles in different colours, each with a coloured header strip | A reward moment with a quick summary of the numbers | `CelebrationScreen` + `StatTile` |
| **A bold, rounded, heavy type**, with uppercase tracked labels on buttons | Friendly but confident | Nunito 800/900, uppercase buttons |
| **Saturated flat colours**, no gradients except subtle glossy highlights | Reads like a toy or cartoon | Flat tokens + a white 35% highlight stripe on bars and mascot |
| **Header counters** (streak, gems, hearts) shown as icon + number in matching colour | Status at a glance, and a light collection mechanic | `CounterChip` row in the top bar |
| **Streak as a character moment**: a huge number plus "day streak", with the mascot | Turns a streak into an emotional event | `StreakBadge` uses a *siren beacon* instead of a flame (our original twist) |
| **Answer feedback sheet**: a tinted bottom panel with an icon + "Correct!" and a coloured CTA | Immediate, colour-coded feedback | `Toast` / feedback sheet in mint, gold or siren |
| **Bottom tab bar** of chunky, colourful illustrated icons. The active tab gets a tinted rounded square with a coloured border | Navigation feels like part of the toy | `BottomTabBar` |
| **Micro-motion everywhere**: pop-in, bounce, count-up, confetti | Rewards attention, so the app feels alive | Motion spec in section 8 |

**Playfulness formula:** thick physical shapes, one loud colour per moment, a character who reacts and witty short copy, plus motion that confirms every tap.

---

## 2. Brand concept

**Kalorická polícia** (Calorie Police) is a friendly neighbourhood patrol for your plate. It never shames anyone. It "issues warnings" with a wink, and it celebrates good behaviour loudly.

**Mascot: Strážnik Paťo Paradajka** ("Officer Paťo Tomato"). Paťo is a round, chubby tomato in an oversized blue patrol cap with a gold star badge. A green tomato leaf peeks from under the cap. He has stubby arms, small feet, kawaii oval eyes and rosy cheeks, plus a gold star on his chest.
- Why a tomato: it's healthy, round and cheerful, and its red contrasts strongly with the blue UI.
- The cap and badge are generic cartoon props: a 5-point star in a circle. They are not modelled on any real police force's insignia.
- Expressions (all on the same 200×200 grid; body circle `cx=100 cy=118 r=62`; cap always on top):

| File | Use when |
|---|---|
| `happy.svg` | Default, waving. Onboarding, home header, a normal meal was logged |
| `thinking.svg` | Magnifying glass. AI or photo analysis is running, or a lookup is loading |
| `celebrate.svg` | Arms up, confetti. Goal hit, streak kept, level up |
| `strict.svg` | Furrowed brow, whistle, "stop" hand, ❗ burst. Too much sugar, over the limit (always a playful tone) |
| `sleepy.svg` | Cap slipped over his eyes, Zzz. No meals logged today, an empty state |

---

## 3. Colour tokens

Every interactive colour comes as a set: **base** (face), **lip** (the 3D bottom edge, also used for the pressed and focus border), **tint** (selected or feedback background) and **ink** (text on the tint).

### Brand and semantic

| Token | Base | Hover | Lip | Tint | Ink on tint | Role |
|---|---|---|---|---|---|---|
| `--kp-blue` "Hliadková modrá" | `#3B5BF6` | `#5572FF` | `#2A40C2` | `#E5EAFF` | `#2A40C2` | Primary: CTAs, selected states, links, progress |
| `--kp-siren` "Siréna" | `#FF4F64` | `#FF6679` | `#D42F48` | `#FFE6E9` | `#B0203A` | Danger, strict warnings, the streak beacon |
| `--kp-gold` "Odznak" | `#FFC21A` | `#FFCC3D` | `#D99A00` | `#FFF5D6` | `#8A5F00` | XP, badges, rewards, the app icon background |
| `--kp-mint` "V poriadku" | `#1FC77E` | `#3AD28F` | `#13985E` | `#DDF7EA` | `#0E7A4B` | Success, "goal met", correct |

### Macros

Use these consistently in rings, bars, chips and charts. Always pair a colour with an icon and a label, never colour alone.

| Macro (SK label) | Token | Base | Lip | Tint |
|---|---|---|---|---|
| Kalórie (kcal) | `--kp-kcal` | `#FF7A1A` | `#D65C00` | `#FFEDDF` |
| Bielkoviny | `--kp-protein` | `#F0436B` | `#C2264F` | `#FDE4EA` |
| Sacharidy | `--kp-carbs` | `#2FA4F0` | `#1A7FC2` | `#E0F2FD` |
| Cukry | `--kp-sugar` | `#B85CF5` | `#8E3BCC` | `#F4E8FE` |
| Tuky | `--kp-fat` | `#FFB020` | `#D68A00` | `#FFF3DA` |
| Vláknina | `--kp-fiber` | `#43C45B` | `#2F9944` | `#E3F7E6` |

> Fat (`#FFB020`) and reward gold (`#FFC21A`) are close. Gold is reserved for XP and badges and never appears inside macro widgets.

### Mascot

`--kp-tomato #FF5B45`, `--kp-tomato-shade #E3412D` (arms, body shade), `--kp-tomato-deep #C73422` (feet), `--kp-cheek #FF9E8C`, `--kp-leaf #43C45B`, `--kp-mouth #6B1A22`, `--kp-tongue #FF8A9A`. The cap uses `--kp-blue` / `--kp-blue-lip`, the visor uses `--kp-ink` and the badge uses gold.

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `--kp-ink` | `#1E2446` | Main text and icons (a navy ink, never pure black) |
| `--kp-ink-2` | `#4A5072` | Secondary text |
| `--kp-muted` | `#8A8FA8` | Captions, placeholders, inactive tab labels |
| `--kp-line` | `#E6E2DA` | 2px card borders, dividers, the lip under white cards |
| `--kp-line-strong` | `#D6D1C6` | The lip under secondary buttons |
| `--kp-surface` | `#FFFFFF` | Cards, sheets, tab bar |
| `--kp-bg` | `#FBF7F0` | Warm cream app background (less clinical than white) |
| `--kp-bg-sunken` | `#F3EEE5` | Progress tracks, ring backgrounds |
| `--kp-disabled` / `-lip` / `-ink` | `#E9E6DF` / `#D6D2C9` / `#B3AFA6` | Disabled buttons |

**Contrast rules**
- White text works on blue, siren and mint, but only at **bold, ≥15px**, which all buttons are.
- On gold and fat, text is **always `--kp-ink`**, never white.
- Body text uses `--kp-ink` on `--kp-bg` or `--kp-surface`.

---

## 4. Typography

**Nunito** (Google Fonts, SIL OFL). It's rounded, heavy at 800/900, and has full **latin-ext** support for Slovak (č ď ľ ĺ ň ô ŕ š ť ž ä).
Load weights 600, 700, 800 and 900. The fallback stack goes through `ui-rounded` / SF Pro Rounded on iOS.

| Style | Size / line height | Weight | Notes |
|---|---|---|---|
| Display | 40 / 44 | 900 | Celebration numbers ("1 850 kcal", "7"), tabular numbers |
| H1 | 28 / 34 | 900 | Screen titles, celebration headline (coloured) |
| H2 | 22 / 28 | 900 | Section titles |
| H3 | 18 / 24 | 800 | Card titles |
| Body L | 17 / 24 | 700 | Mascot bubbles, option cards |
| Body | 16 / 23 | 700 | Default. Inputs never go below 16px (stops iOS zooming in) |
| Button | 15 / 18 | 900, UPPERCASE, +0.06em | All 3D buttons |
| Caption | 13 / 18 | 700 | Meta, units |
| Overline | 12 / 14 | 900, UPPERCASE, +0.08em | Stat tile headers ("BIELKOVINY") |

- Numbers always use `font-variant-numeric: tabular-nums` (class `.kp-num`).
- Slovak number format: **1 850 kcal** (with a non-breaking space ` `) and **12,5 g** (decimal comma). Use `Intl.NumberFormat('sk-SK')`.
- Never use weight 400. The thinnest weight in the app is 600, and only for long help text.

---

## 5. Spacing, radii and layout

**Spacing (4-pt):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (`--kp-space-1…16`). The screen gutter is 16. Gaps between cards are 12. Gaps between sections are 24–32.

**Radii**

| Token | px | Use |
|---|---|---|
| `xs` | 8 | Chips, tags |
| `sm` | 12 | Inputs, small buttons |
| `md` | 16 | Buttons, option cards |
| `lg` | 20 | Cards, stat tiles |
| `xl` | 28 | Bottom sheets, celebration panels |
| `pill` | 999 | Progress bars, counters, toasts |

**Mobile-first and iPhone safe areas**
- Use `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and `<meta name="theme-color" content="#FBF7F0">`.
- The top bar gets `padding-top: env(safe-area-inset-top)`.
- The tab bar height is `64px + env(safe-area-inset-bottom)`. Content padding-bottom clears both.
- A sticky footer CTA gets `padding-bottom: 16px + env(safe-area-inset-bottom)` and a cream fade above it.
- Landscape: also pad left and right with `safe-area-inset-left/right`.
- Use `100dvh`, never `100vh`.
- Minimum touch target is **48×48**. Primary buttons are **52px** tall and full width inside the gutter.
- Design canvas is 390×844 (iPhone 14/15). Test at 375 and 430. Cap content at `max-width: 480px`, centred, on larger screens.

---

## 6. Shadows and the 3D lip

The lip **is** the shadow. Avoid blurred drop shadows. The exceptions are floating layers (toasts, sheets) that use `--kp-shadow-float`.

**Lip spec**

| Element | Border | Lip depth | Lip colour |
|---|---|---|---|
| Primary / colour button | none | 4px (`--kp-lip`) | `*-lip` of the face colour |
| Secondary button | 2px `--kp-line` | 4px | `--kp-line-strong` |
| Large hero button / path node | none | 6px (`--kp-lip-lg`) | `*-lip` |
| Small button / chip | 2px | 3px (`--kp-lip-sm`) | `*-lip` or `--kp-line` |
| Card / stat tile | 2px `--kp-line` | 4px | `--kp-line` (or the macro lip for coloured tiles) |
| Option card (selected) | 2px `--kp-blue` | 3px | `--kp-blue` |
| Speech bubble | 2px `--kp-line` | 2px | `--kp-line-strong` |

**Implementation:** `box-shadow: 0 var(--depth) 0 0 var(--lip)`, with `margin-bottom: var(--depth)` to reserve the space.
- **Pressed:** `transform: translateY(var(--depth)); box-shadow: 0 0 0 0 var(--lip)` over 70ms ease-out.
- **Release:** springs back over 120ms with `--kp-ease-spring`.
- This never shifts layout. See `.btn-3d` in `tokens.css`.

---

## 7. Components

### Button: `.btn-3d`
- **Primary:** blue face, white label, blue lip. One per screen, usually in a sticky footer. Labels are verbs in UPPERCASE: `POKRAČOVAŤ`, `ZAPÍSAŤ JEDLO`, `ROZUMIEM`.
- **Secondary** (`--secondary`): white face, 2px line border, grey lip, blue label. For alternatives like `PRESKOČIŤ` or `UPRAVIŤ`.
- **Ghost** (`.btn-ghost`): no face and no lip, blue uppercase label. For dismissals like `TERAZ NIE`. On press it scales to 0.96 and drops to 0.7 opacity.
- **Colour variants:**
  - `--success`: feedback sheet CTA when the result is OK
  - `--danger`: CTA on a strict warning
  - `--gold`: claiming a reward
  - `--white`: CTA on full-bleed coloured screens
- **Sizes:** default 52px, `--sm` 40px, `--lg` 60px (6px lip).
- **Disabled:** grey face, grey lip, grey label, no press motion. Keep the button visible, so users learn what unlocks it.
- **Loading:** the label turns into 3 bouncing dots. Width stays fixed.
- **Icon + label:** 20px icon on the left, 8px gap.

### OptionCard: `.option-3d`
- Full width, min height 60, padding 12×16, radius 16, 2px border and 3px lip in `--kp-line`.
- Layout: leading visual (a 36px emoji/illustration or level bars), then a bold 17px label, an optional trailing caption in muted text (e.g. "Bežný" or "Prísny"), and an optional `ODPORÚČANÉ` pill pinned to the top-right corner (blue face, white overline text, 8px radius).
- **Selected** (`aria-checked="true"`, `role="radio"` inside a `role="radiogroup"`): blue tint fill, blue border, blue lip and blue label. Play a 1-frame pop (scale 0.98 → 1) plus a light haptic.
- Cards are stacked with a 12px gap. Single-select enables the CTA. Multi-select uses `role="checkbox"`.

### ProgressBar: `.progress-3d`
- Height 16 (onboarding and XP) or 10 (macro rows), pill shaped, track `--kp-bg-sunken`.
- The fill uses the semantic or macro colour and has a white 35% highlight stripe 3px from the top.
- Fill changes width over 600ms with ease-out.
- Onboarding: the bar sits in the top bar next to a back chevron (`←`, 24px, muted), with 16px gutters. When a step completes, the fill gets a small "sparkle" pulse at its leading edge.
- Over goal: the fill stays full and turns `--kp-siren`. Never let it overflow visually.

### Ring (daily goal and macros)
- An SVG circle with stroke-linecap round. The track is `--kp-bg-sunken`.
  - Main kcal ring: 180px, stroke 18.
  - Mini macro rings: 56px, stroke 8.
- The centre shows a display-size number (remaining kcal) plus the caption `zostáva` (remaining). When over the limit, it shows `+120` in siren with the caption `nad limit` (over limit).
- Animate `stroke-dashoffset` over 900ms with `--kp-ease-out`, in sync with the number count-up.
- At 100%, swap in a mint ring + a check badge pop-in, then the mascot reacts.

### StatTile (celebration summary, daily recap)
- Width = ⅓ of the row (gap 8), radius 16, 2px border in the tile colour and a 4px lip in the tile's lip colour.
- **Header strip:** the full-width top band in the tile colour, with an overline label in white (ink on gold and fat), e.g. `BIELKOVINY`.
- **Body:** a white face with an icon (20px) + a bold number in the tile colour, e.g. `92 g`.
- Use 3 tiles max per row, each a different colour (e.g. kcal, protein, streak).
- Tiles pop in one after another, 80ms apart.

### StreakBadge (siren beacon, an original twist on the streak flame)
- **Icon:** a rounded police-siren dome. Red (`--kp-siren`) when active, grey when inactive, plus a white glint.
- **Counter chip** (top bar): icon + number in siren red, weight 900.
- **Streak screen:** a 96px beacon that pulses (`.kp-siren`, a glowing drop-shadow), with a giant number (display size, siren) and the label `dní v rade` (days in a row). Paťo's bubble sits above it.
- **Week strip:** 7 circles (32px) labelled Po Ut St Št Pi So Ne (Mon to Sun). Done days are filled siren with a white check. Today has a ring outline. Future days are grey.
- **At risk** (evening, nothing logged): the beacon blinks slowly and a strict-tone toast appears.

### XP bar and counters
- XP is shown as gold `odznaky` (badges). Each logged meal is +10, hitting the goal is +30, and a full macro day is +20.
- **XP bar:** a gold `ProgressBar` showing `120 / 200 XP` to the next rank, with the rank chip at the right.
  - **Ranks:** Kadet → Strážnik → Strážmajster → Inšpektor → Komisár → Šéf stanice (Cadet, Officer, Sergeant, Inspector, Commissioner, Station chief).
  - Offer feminine rank forms if the user chooses them in their profile.
- **Counters row** (top bar, left to right): streak beacon, XP badge, then "šťavy" ("juice", optional energy). Each counter is a 20px icon + a 900-weight number in its colour, with no background. Tapping one opens a popover sheet.
- **XP gain:** a floating `+10 XP` chip rises 24px and fades over 700ms from the tap point, then the counter bumps (scale 1.2 → 1).

### BottomTabBar: `.kp-tabbar`
- White, 2px top border, height 64 + safe area. Shows 4–5 tabs:
  - `Dnes` (Today, home: rings and meals)
  - `Zapísať` (Log: big centre action)
  - `Štatistiky` (Stats)
  - `Hliadka` (Patrol: streak, rank and friends)
  - `Profil` (Profile)
- Icons are **28px, chunky, full-colour** illustrations (not line icons), with no labels or with an 11px label.
- **Active tab:** the icon sits in a 44px rounded square (radius 12) with a blue tint fill and a 2px blue border. The icon does a 200ms pop.
- **Inactive tabs** are desaturated to 60% opacity.
- The centre `Zapísať` button can be raised: a 56px circle, blue, with a 4px lip and a white `+`.

### MascotBubble
- **Layout:** the mascot (64–96px) on the left with the bubble on the right in onboarding, or the mascot below with the bubble above on hero screens.
- **Bubble:** white, 2px `--kp-line` border, radius 16, padding 12×16, Body L 700. It has a 2px `--kp-line-strong` lip and a 12px triangular tail pointing to the mascot, with the tail's border included.
- Copy is at most **2 lines** and about 12 words.
- **Motion:**
  - The mascot pops in, then the bubble pops in 120ms later.
  - The text can type on at 20ms per character. Tapping skips it.
  - The mascot does an idle bob (2.4s loop).
- When the user does something, the mascot swaps expression with a 480ms wiggle. Never swap more than once per 2s.

### CelebrationScreen
- Full screen, cream background (or a full-bleed colour for big moments: gold for level up, siren for streak milestones).
- **Stack, top to bottom:**
  1. A sparkle field
  2. A 160–200px `celebrate.svg` that pops in, then bobs
  3. A headline in H1 in the moment's colour, e.g. `Prípad uzavretý!` ("Case closed!")
  4. A subline in Body L, ink-2, one witty sentence
  5. A row of 3 StatTiles
  6. A sticky `.btn-3d--lg` button: `ZOBRAŤ ODZNAKY` (claim badges) or `POKRAČOVAŤ` (continue)
- **Confetti:** about 40 pieces (rects 8×5 and circles 6) in blue, siren, gold, mint, purple and sky. They fall over 1.6s with random drift (±60px) and spin (360–720°), one burst only.
- **Numbers** count up over 900ms (ease-out). The XP chip flies to the counter in the top bar on claim.
- **Never auto-dismiss.** The user taps to continue.

### Toast / feedback sheet
- **Toast:** floats 12px above the tab bar (plus safe area). Pill or radius-16 card, white with a 2px border in the semantic colour, `--kp-shadow-float`.
  - Left: a mini mascot head (32px) or an icon.
  - Middle: a bold message.
  - Right: an optional action as `.btn-ghost`.
  - Slides up and pops in over 320ms. Auto-dismisses after 3.5s. Swipe down to dismiss.
- **Feedback sheet** (after logging a meal or a photo analysis): a bottom panel in the tint colour (mint, gold or siren tint), radius 28 at the top.
  - It holds an icon + a heading in the ink colour (`Výborne!`, `Pozor na cukor!`), one line of detail, and a full-width colour button.
  - Slides up over 320ms with `--kp-ease-out`.
- **Variants:** success (mint), warning (gold), strict (siren, `strict.svg`, plus a shake on the offending macro chip), info (blue).

### Other atoms
- **MacroChip:** pill, tint background, dot + label + value in the ink colour, e.g. `● Cukry 38 g`.
- **Card:** `.card-3d`, padding 16, radius 20.
- **Input:** 52px tall, radius 12, 2px `--kp-line` border, 16px text. Focus: 2px blue border + a 3px blue-tint ring.
- **Segmented control:** a sunken track holding 3D mini-buttons. The active segment is white with a lip.

---

## 8. Motion

| Interaction | Duration | Easing | Detail |
|---|---|---|---|
| Press (down) | 70ms | `--kp-ease-out` | translateY(lip), lip → 0 |
| Release | 120ms | `--kp-ease-spring` `cubic-bezier(.18,1.6,.4,1)` | Springs back with a tiny overshoot |
| Pop-in | 320ms | `--kp-ease-pop` `cubic-bezier(.34,1.56,.64,1)` | scale .6 → 1.08 → 1, opacity 0 → 1 |
| Stagger | +60–80ms per item | — | Option cards, stat tiles |
| Screen transition (onboarding) | 280ms | `--kp-ease-out` | The new screen slides in 24px from the right and fades. The progress bar fills at the same time |
| Progress / ring fill | 600–900ms | `--kp-ease-out` | Number counts up in sync |
| Counter bump | 200ms | pop | scale 1 → 1.2 → 1 |
| Mascot idle | 2.4s loop | ease-in-out | translateY 0 → −4px |
| Mascot reaction | 480ms | ease-out | Wiggle (±6° → 0), origin at the feet |
| Warning shake | 360ms | ease-out | ±6px horizontal |
| Toast in / out | 320 / 200ms | ease-out / ease-in | slide + fade |
| Confetti | 1600ms | linear fall | 40 pieces, drift ±60px, spin 360–720° |
| Streak beacon | 1.6s loop | ease-in-out | Glowing drop-shadow pulse |

- **Haptics:** call `navigator.vibrate?.(8)` on primary press, `[10,40,10]` on success and `[30]` on warning. This works on Android only; iOS Safari ignores it, which is fine.
- **Sound:** optional, off by default, with a toggle in Profile. Use short marimba "pop" sounds for success and a soft whistle for strict. Never play sound on errors.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, there's no confetti, idle bob, shake or wiggle. Fades are capped at 150ms and numbers appear at their final value. `tokens.css` handles this globally.

---

## 9. Key screens (composition recipes)

1. **Onboarding step:** top bar (back + ProgressBar) → MascotBubble (mascot left, 64px) → 3–6 OptionCards → sticky footer with a primary CTA, disabled until an option is chosen. Steps:
   - goal: lose / maintain / gain
   - sex and age
   - height and weight
   - activity
   - daily kcal target (shown as a reveal celebration)
   - reminder time
2. **Dnes (home):**
   - Counters row (beacon, XP).
   - A hero card holding the kcal Ring + 3 mini macro rings (protein, carbs, fat), plus sugar and fiber as MacroChips.
   - A meal list grouped as Raňajky, Desiata, Obed, Olovrant and Večera (breakfast, morning snack, lunch, afternoon snack, dinner). Each group is a card with a `+` mini 3D button.
   - Paťo peeks in the corner with a contextual bubble: sleepy if the day is empty.
3. **Zapísať (log):** search field + a camera button (`--lg`, blue). Photo → `thinking.svg` with the text `Vyšetrujem tanier…` (inspecting the plate) → a result sheet with editable items → a feedback sheet (success, warning or strict) → +XP.
4. **Daily goal hit:** CelebrationScreen with the tiles kcal / Bielkoviny / Séria.
5. **Hliadka (patrol):** StreakBadge hero, week strip, XP bar + rank, achievements grid (badges with a lip, grey when locked).

---

## 10. Slovak copy and tone guide

**Voice:** Paťo is a good-natured neighbourhood officer. He's strict about the rules but a softie at heart. Think "a cop who hands out stickers, not fines".

**Rules**
1. **Tykanie** (informal "ty") everywhere. Keep it short: bubbles ≤ 12 words, toasts ≤ 8.
2. **Police puns** are seasoning, not the meal: hliadka (patrol), zápisnica (report book), priestupok (offence), napomenutie (warning), pokuta (fine), odznak (badge), prípad uzavretý (case closed), dôkaz (evidence), výsluch (interrogation), stanica (station), smena (shift), siréna (siren).
3. **Never shame** the body, weight or the person. Warnings target the *food or choice* and always come with a way forward. No words like "zlyhal/a", "tučný" or "zlý" (failed, fat, bad).
4. **Gender-neutral toward the user.** Slovak past tense is gendered, so use present tense, nouns or impersonal phrasing ("Čo bolo na raňajky?", "What was breakfast?", not "Čo si jedol?", "What did you eat?"). Paťo himself is masculine ("nevidel", "I didn't see").
5. Use **UPPERCASE** only on buttons. Headlines use sentence case and end with "!" at most once per screen.
6. **Numbers:** `1 850 kcal`, `12,5 g`, `7 dní v rade`. Use Slovak plurals: 1 deň / 2–4 dni / 5+ dní.
7. Use no real institutions (Policajný zbor SR, the Slovak police), no real insignia, and no references to arrests or violence. Write "zapíšem do zápisnice" (I'll note it in my book), never "zatknem" (I'll arrest you).

**Sample mascot lines**

| # | Moment | Expression | Line |
|---|---|---|---|
| 1 | Welcome (onboarding) | happy | „Ahoj! Som Paťo, strážnik Kalorickej polície. Postrážim ti tanier – s úsmevom.“ |
| 2 | Goal question | happy | „Aký je tvoj cieľ? Pýtam sa len kvôli zápisnici.“ |
| 3 | Morning, nothing logged | happy | „Dobré ráno! Hliadka začína. Čo bolo na raňajky?“ |
| 4 | Empty day / evening | sleepy | „Na stanici zatiaľ ticho… Zapíš prvé jedlo a zobuď ma.“ |
| 5 | Photo analysis | thinking | „Moment, vyšetrujem tento tanier…“ |
| 6 | Analysis result | thinking | „Skúmam dôkazy. Vyzerá to na cestoviny s parmezánom.“ |
| 7 | High protein | celebrate | „Bielkoviny na výbornú! Svaly ti práve zasalutovali.“ |
| 8 | Too much sugar | strict | „Stáť, kontrola cukru! Tretí dezert? Píšem do zápisnice.“ |
| 9 | Sugar over the limit (mild) | strict | „Cukor prekročil povolenú rýchlosť. Tentoraz len napomenutie.“ |
| 10 | Good fiber | happy | „Vláknina hlási: všetko pod kontrolou.“ |
| 11 | Fat in range | happy | „Tuky v norme. Avokádo môže ísť domov.“ |
| 12 | Carbs before training | happy | „Sacharidy natankované. Energie máš na celú smenu.“ |
| 13 | Daily goal hit | celebrate | „Cieľ splnený! Prípad uzavretý.“ |
| 14 | Over the kcal limit | strict (soft) | „Dnes trochu nad limit. Žiadna pokuta – zajtra je nová smena.“ |
| 15 | Streak kept | celebrate | „7 dní v rade! Séria drží ako bezpečnostný pás.“ |
| 16 | Streak at risk (evening) | strict | „Pozor, siréna! Séria je v ohrození – stačí jedno jedlo.“ |
| 17 | Streak lost | sleepy → happy | „Séria padla. Nevadí, aj najlepší detektívi začínajú odznova.“ |
| 18 | Comeback after a break | happy | „Vitaj späť! Bez teba bolo na stanici smutno.“ |
| 19 | Rank up | celebrate | „Povýšenie! Nová hodnosť: Strážmajster.“ |
| 20 | Late-night snack | thinking | „Polnočný snack? Tvárim sa, že som nič nevidel.“ |
| 21 | Weekend | happy | „Víkendová hliadka! Aj pizza má právo na obhajobu.“ |
| 22 | Photo prompt | happy | „Odfoť dôkaz a ja ho preverím.“ |
| 23 | Balanced plate | celebrate | „Vzorný tanier! Odznak cti je tvoj.“ |
| 24 | Network error | thinking | „Ups, vysielačka zlyhala. Skúsim to znova.“ |

**Microcopy:**
- Buttons: `POKRAČOVAŤ` (continue), `ZAPÍSAŤ JEDLO` (log meal), `ODFOTIŤ JEDLO` (photograph meal), `TERAZ NIE` (not now), `ROZUMIEM` (got it), `ZOBRAŤ ODZNAKY` (claim badges), `UPRAVIŤ` (edit), `ULOŽIŤ` (save)
- Tile overlines: `KALÓRIE`, `BIELKOVINY`, `SACHARIDY`, `CUKRY`, `TUKY`, `VLÁKNINA`, `SÉRIA` (streak), `ODZNAKY` (badges)
- Ring captions: `zostáva` (remaining), `nad limit` (over limit), `prijaté` (eaten)

---

## 11. Accessibility checklist
- Every option card, tab and button is reachable by keyboard and shows a visible `:focus-visible` ring (3px blue, 3px offset).
- Colour is never the only signal: macros always carry a label and icon, and states carry an icon (check or ❗).
- Mascot SVGs carry `<title>`. When the mascot is purely decorative next to a bubble, mark it `aria-hidden="true"` and put the message in live text (`aria-live="polite"` for feedback sheets).
- Ring and progress elements use `role="progressbar"` with `aria-valuenow/min/max` and a Slovak `aria-label` ("Kalórie: 1 250 z 2 000").
- Respect `prefers-reduced-motion`. Never convey information only through animation.
