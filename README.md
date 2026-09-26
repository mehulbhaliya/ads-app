# DigiNerve Ad Creative Studio

Plans and builds Meta ad tests the way a senior performance marketer does. Each step waits for your approval, and nothing downstream regenerates on its own.

1. **Brainstorm:** a chat with the strategist. Give it an idea, a problem or a reference ad; it returns angle cards (insight, persona, awareness stage, lever, hooks, approved proof, competitor saturation, risks). Optional live competitor research. Star 2-4 angles.
2. **Test plan:** campaign → ad sets (one angle each) → 2-3 hook ads, plus budget split, optimisation event, bidding, placements, hypotheses, KPIs and kill/iterate/scale rules. It flags thin budgets. Approve it.
3. **Creatives:** generate 3 concepts per approved angle, edit, and export 4:5 / 1:1 / 9:16.
4. **Launch pack:** copy for the approved creative, names, UTMs and a pre-launch checklist.
5. **Learn:** import results; lessons feed the next round.

Projects (one per course test) are saved in the browser, so you can come back to any step.

## Run in Google AI Studio

1. Import this repo (branch `main`).
2. Nothing to configure: the app uses the Gemini key of whichever AI Studio account opens it (header chip: "Gemini: account key").
   - **Free-tier key:** ad copy runs on Gemini; AI visuals are skipped after the first check (chip: "free tier (copy only)"). Use OpenArt or upload a photo for visuals.
   - **Billing-enabled key:** AI visuals generate too.
   - **Outside AI Studio:** click the chip and paste a key (stored in that browser only).
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
