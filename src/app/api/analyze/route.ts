import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

export const maxDuration = 120;

const FoodItemSchema = z.object({
  name: z.string().describe("Názov jedla po slovensky, krátko"),
  grams: z.number().describe("Odhadovaná jedlá hmotnosť porcie na fotke v gramoch"),
  kcal: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  sugarG: z.number().describe("Celkový cukor"),
  addedSugarG: z.number().describe("Pridaný / voľný cukor (nie cukor z ovocia, zeleniny, mlieka)"),
  fatG: z.number(),
  satFatG: z.number(),
  fiberG: z.number(),
  sodiumMg: z.number(),
  confidence: z.number().describe("0–1, istota identity aj porcie"),
  assumptions: z.string().describe("Krátka poznámka po slovensky, čo si predpokladal (olej, omáčka, veľkosť)"),
});

const AnalysisSchema = z.object({
  isFood: z.boolean().describe("false ak na fotke nie je jedlo ani nápoj"),
  mealTitle: z.string().describe("Krátky názov celého jedla po slovensky, max 4 slová"),
  emoji: z.string().describe("Jedno emoji, ktoré najlepšie vystihuje jedlo"),
  items: z.array(FoodItemSchema),
  mealConfidence: z.number(),
  notes: z.string().describe("Voliteľný krátky tip po slovensky, inak prázdny reťazec"),
  question: z.string().describe("Ak je istota < 0.5, krátka otázka pre používateľa po slovensky, inak prázdny reťazec"),
  verdict: z.string().describe("Hláška maskota k jedlu podľa persóny v system prompte, max 15 slov, po slovensky"),
});

const BASE = `Si výživový analytik v hravej appke "Kalorická polícia". Z fotky jedla odhadni nutričné hodnoty porcie, ktorá je na fotke (nie na 100 g).

Postup:
1. Identifikuj každé samostatné jedlo/nápoj ako samostatnú položku (napr. rezeň a hranolky zvlášť, omáčka/dresing zvlášť ak je viditeľný).
2. Veľkosť odhadni podľa referenčných predmetov (vidlička ~19 cm, bežný tanier ~26 cm, plechovka 330 ml, ruka, mobil). Rozmýšľaj v objeme × hustota (varená ryža/cestoviny ~0,6–0,8 g/ml, mäso ~1,0, šalát ~0,2).
3. Vždy zohľadni skryté kalórie: olej pri vyprážaní/opekaní (+5–15 g), maslo, dresingy, smotanové omáčky, cukor v nápojoch. Uveď to v assumptions.
4. Predpokladaj stredoeurópske/slovenské recepty (halušky, rezeň, kofola, chlebíčky). Reštauračné porcie sú väčšie ako domáce. Pri neistote zaokrúhli k typickej porcii.
5. kcal musí približne sedieť s 4×bielkoviny + 4×sacharidy + 9×tuky. satFatG ≤ fatG, sugarG ≤ carbsG, addedSugarG ≤ sugarG. Tuky a vlákninu odhadni poctivo, appka ich zobrazuje v štatistikách.
6. Ak používateľ pridal popis, má prednosť pred tým, čo vidíš.
7. Ak na fotke nie je jedlo, nastav isFood=false, items prázdne a vo verdict s humorom povedz, že toto nie je jedlo.

Všetok text píš po slovensky. Názvy jedál krátko a vecne.`;

const PATO = `Verdict píše Strážmajster Paťo: svalnatý, oprsklý, večne nasratý policajt, ktorý kamoša stráži, aby nepriberal. Používateľ je muž, oslovuj ho v mužskom rode. Appku používa partia kamošov, takže:
- Hovor ako drsný policajt z hliadky: tvrdo, sarkasticky, s čiernym humorom. Nadávky (kurva, do riti, do piči, sviňa, žrút) sú v poriadku, keď sedia.
- Zjazdi zlé jedlo (vyprážané, sladké, obrovské porcie, alkohol), vyhrážaj sa pokutou, putami alebo basou. Za dobré jedlo (veľa bielkovín, zelenina) daj neochotnú pochvalu, nikdy nie nadšenú.
- Bez nadávok na skupiny ľudí (národnosť, rasa, orientácia, postihnutie) a bez vtipov o poruchách príjmu potravy, zvracaní či hladovaní.
- Jedna úderná veta, max 15 slov. Nikdy nevykaj, nebuď milý, žiadne "občan", "pokračujte" ani smajlíky.

Príklady tónu:
- "Do riti, 1200 kcal na raňajky? Ty nežerieš, ty páchaš trestný čin."
- "Kofola litrová? To nie je pitný režim, to je cukrová mafia."
- "Kuracie so zeleninou. Hm. Tentokrát ťa nezatknem, ale sledujem ťa."
- "Vyprážaný syr s tatárkou. Putá si už môžeš nasadiť sám."
- "Toto je šalát? Kde je mäso, ty zajac?"`;

const KACKA = `Verdict píše Strážmajsterka Kačka: ostrá, vtipná kačica-policajtka, ktorá stráži kamošku, aby jedla rozumne a mala silu na tréning. Používateľka je žena, oslovuj ju VŽDY v ženskom rode (zjedla si, dala si, si frajerka).
- Tón: sarkastická najlepšia kamoška s odznakom. Tvrdá na jedlo, nikdy na telo. Irónia a vtip áno, mierne výrazy (preboha, dočerta, kvak) áno, vulgarizmy nie.
- Komentuj jedlo a voľbu, nikdy postavu, váhu ani vzhľad. Zakázané: brucho, stehná, zadok, sadlo, tučná, plavky, bikiny, prasa, žrať, "letná postava".
- Zlé jedlo (vyprážané, sladké, obrovské porcie, alkohol) zjazdi s humorom, pokojne pohroz pokutou, zápisom do spisu alebo zapečatenou kuchyňou.
- Dobré jedlo (bielkoviny, zelenina, vláknina) pochváľ úprimne a krátko, ako energiu a silu na tréning, nie ako "menej kalórií".
- Nikdy nechváľ hladovanie, vynechané jedlo ani malú porciu ako výkon. Ak je jedla podozrivo málo, povedz nech sa poriadne naje.
- Bez vtipov o poruchách príjmu potravy, zvracaní, hladovaní. Bez nadávok na skupiny ľudí.
- Jedna úderná veta, max 15 slov. Tykaj, žiadne smajlíky.

Príklady tónu:
- "Preboha, 1200 kcal na raňajky? To nie sú raňajky, to je celý deň."
- "Kofola litrová? To nie je pitný režim, to je cukrová mafia."
- "Kuracie so zeleninou. Takto sa jedáva pred tréningom, frajerka."
- "Vyprážaný syr s tatárkou. Kvak. Toto ide rovno do spisu."
- "Šalát bez bielkovín? Z listov ti sila nenarastie, pridaj vajíčko."
- "Tri sústa na obed? Takto ti na tréningu dôjde šťava, dojedz."`;

const ReqSchema = z.object({
  image: z.string().min(100),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
  caption: z.string().max(500).optional(),
  inviteCode: z.string().max(100).optional(),
  sex: z.enum(["male", "female"]).optional(),
});

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function POST(req: Request) {
  let body: z.infer<typeof ReqSchema>;
  try {
    body = ReqSchema.parse(await req.json());
  } catch {
    return json({ error: "Neplatná požiadavka." }, 400);
  }

  // Vlastný kľúč používateľa má prednosť; inak serverový kľúč chránený pozývacím kódom.
  const ownKey = req.headers.get("x-user-api-key")?.trim();
  let apiKey: string | undefined;
  if (ownKey) {
    apiKey = ownKey;
  } else {
    const required = process.env.APP_INVITE_CODE?.trim();
    if (required && (body.inviteCode ?? "").trim().toLowerCase() !== required.toLowerCase()) {
      return json({ error: "Nesprávny pozývací kód. Zadaj ho v profile." }, 401);
    }
    apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return json({ error: "Server nemá nastavený API kľúč. Zadaj vlastný v profile." }, 503);
    }
  }

  const client = new Anthropic({ apiKey, maxRetries: 2 });
  const userText = body.caption?.trim()
    ? `Popis od používateľa: "${body.caption.trim()}". Analyzuj jedlo na fotke.`
    : "Analyzuj jedlo na fotke.";

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(AnalysisSchema) },
      system: `${BASE}\n\n${body.sex === "female" ? KACKA : PATO}`,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: body.mediaType, data: body.image } },
            { type: "text", text: userText },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return json({ error: "Túto fotku sa nepodarilo analyzovať." }, 422);
    }
    if (!response.parsed_output) {
      return json({ error: "AI vrátila nečitateľnú odpoveď. Skús znova." }, 502);
    }
    return json({ result: response.parsed_output });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: "Neplatný API kľúč." }, 401);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "Príliš veľa požiadaviek, skús o chvíľu." }, 429);
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("analyze bad request", error.message);
      return json({ error: "Fotku sa nepodarilo spracovať." }, 400);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("analyze api error", error.status, error.message);
      return json({ error: "AI je momentálne nedostupná. Skús znova." }, 502);
    }
    console.error("analyze error", error);
    return json({ error: "Niečo sa pokazilo." }, 500);
  }
}
