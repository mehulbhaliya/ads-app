# DigiNerve Ad Creative Studio

Builds compliant Meta and Google ad creatives and copy for DigiNerve courses:

1. **Brief:** course, audience, angle and offer.
2. **Design & Export:** 3 finished ad variants in DigiNerve layouts, exported as a Meta set (4:5, 1:1, 9:16) or a Google set.
3. **Meta Copy:** 5 fact-grounded concepts.
4. **Names & UTMs:** naming-convention names, UTMs and a pre-launch checklist.
5. **Learning Loop.**

## Run in Google AI Studio

1. Import this repo (branch `main`).
2. Use a Gemini API key **with billing enabled**. Free-tier keys have no image generation; the app then shows a neutral placeholder photo, and copy still works.
3. Upload the DigiNerve logo and faculty photos in the app. Brand images are not stored in the repo.

## Run locally

```bash
npm install
echo "GEMINI_API_KEY=your_key" > .env.local
npm run dev
```

Open http://localhost:3000. Optional: OpenArt image generation runs through the local MCP proxy in `server/`.

## What keeps the output on-brand

| File | What it holds |
| :-- | :-- |
| `constants/courseFacts.ts` | Approved claims per course. The only numbers allowed on ads. |
| `constants/expertPlaybook.ts` | Expert rules (r7): angle order, busy-doctor hook formulas, visual rules, and the advice panel checks. |
| `services/adContent.ts` | Blocking checks: approved claims only, no em dashes, no competitor names, no pass guarantees. Outcome claims need an "X of Y" footnote. |
| `tools/creative-kit/` | Dev-only canvas layouts used for hand-built drafts. |
