# Prompt: Strážmajsterka Kačka (6 póz)

Postup: najprv vygeneruj **grumpy**. Keď sedí, pridávaj ju ako referenčný obrázok ku každej ďalšej póze (a pridaj aj `public/mascot/grumpy.webp` od Paťa, kvôli štýlu). Výstup: 512×512, priehľadné pozadie, uložiť ako `public/mascot/kacka/{mood}.webp`.

## Spoločný základ (vlož pred každú pózu)

```
Cartoon mascot sticker for a playful Slovak calorie-tracking app called "Calorie Police".
Character: "Officer Kačka", a female police duck. Same art style as a bold modern cartoon
police officer mascot: thick dark navy outlines (#1E2446), flat cel-shaded fills with one
soft shadow tone, clean vector look, no gradients, no texture, no text.

Design: a sturdy, athletic white duck (warm white feathers #FFFFFF with light blue-grey
shading), bright orange beak and feet (#FF8A1F), expressive big eyes with a few bold lashes,
confident eyebrows. Navy blue police uniform shirt with rolled short sleeves (#2A3A8C, darker
navy shading), two chest pockets, shoulder epaulettes with small gold buttons, gold shield
badge on the chest (#FFC21A). Navy police peaked cap with a gold shield emblem, a small
feather tuft sticking out from under the cap at the back like a short ponytail.
Wings work like arms, with feather tips that can grip objects and make hand gestures.

Personality: sharp, witty, sassy best friend with a badge. Strict about food, never mean.
Strong and capable, not cute-baby, not sexualized, no makeup beyond the lashes.

Framing: bust / upper-body shot, head and cap near the top, chest cropped by the bottom edge,
centered, square 1:1 canvas, fully transparent background, no drop shadow on the background.
```

## Pózy (pridaj za základ)

| Súbor | Kedy ju appka ukazuje | Prompt |
|---|---|---|
| `grumpy.webp` | predvolená, 1–2 hviezdy | `Pose: wings crossed firmly over her chest, one eyebrow raised high, skeptical side-eye at the viewer, beak in a tight unimpressed smirk. "I see you."` |
| `watching.webp` | analýza fotky, „čo si dnes jedla?“ | `Pose: holding a big magnifying glass up to one eye with her right wing, the eye hugely magnified through the lens, other wing on her hip, leaning slightly forward, investigating, curious and suspicious.` |
| `angry.webp` | 3–5 hviezd, zlé jedlo | `Pose: indignant and fired up, cheeks flushed red, beak wide open mid-scold, right wing pointing straight at the viewer, left wing on her hip, two small white steam puffs above the cap. Exasperated, not monstrous.` |
| `approve.webp` | dobrý deň, dobré jedlo | `Pose: one eye winking, confident half-smile, right wing raised in a feather thumbs-up, left wing relaxed. Proud of the viewer, "that's my girl".` |
| `arrest.webp` | zatykač, plán v onboardingu | `Pose: blowing a silver police whistle on a lanyard, cheeks puffed, left wing raised flat in a firm "STOP" gesture toward the viewer, a pair of silver handcuffs dangling from her right wing.` |
| `jail.webp` | „basa“ = zapečatená kuchyňa do 7:00 | `Pose: eyes calmly closed, smug satisfied smile, twirling a ring of old silver keys on one raised wing feather (small motion lines around the keys), other wing resting on her belt. "Kitchen is closed, sweetie."` |

Voliteľne ikona appky: `App icon variant: only Officer Kačka's head with the police cap, slightly tilted, raised eyebrow, centered on a solid #3B5BF6 blue rounded square, thick navy outline, no text.`

## Na čo dať pozor

- Rovnaký odtieň uniformy a odznaku ako má Paťo, nech pôsobia ako kolegovia z jednej stanice.
- Žiadny text v obrázku, žiadne pozadie, žiadny rámček.
- Postava nesmie byť sexualizovaná ani „diétna“ (žiadne meter, váha, chudé pásy). Jej témy sú jedlo, sila a dohľad.
