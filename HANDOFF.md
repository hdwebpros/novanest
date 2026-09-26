# Hand-off: Hermes → offer dashboard (smoke test done, 2026-09-25)

## Goal
Emily's Hermes agent picks up starred items from AI Speakly, turns each into a JSON deal record, and POSTs it to this site. The site saves it, returns a private link, and Hermes sends Emily that link. The page is a dashboard that lays out the deal and a *draft* offer for Emily to review. It is not a legal purchase agreement.

Principles agreed so far:
- Hermes extracts and structures data only. Offer math (repairs, MAO, cash vs terms) lives in plain code on the site, not in the LLM.
- Emily reviews/edits before anything goes to a seller.
- Keep this separate from the public marketing pages. Offer pages are unlisted (random token) and `noindex`.

## What exists (uncommitted in the working tree)
- `server/utils/db.ts` – Neon client (`@neondatabase/serverless`), creates the `offers` table on first use (`token text pk, data jsonb, created_at`).
- `server/api/offers/index.post.ts` – requires `Authorization: Bearer <NUXT_OFFERS_API_SECRET>`, stores the body, returns `{ token, url }`.
- `server/api/offers/[token].get.ts` – returns the stored record or 404.
- `app/pages/offers/[token].vue` – placeholder page that dumps the JSON. Needs a real design.
- `nuxt.config.ts` – added `runtimeConfig.offersApiSecret`.

Junk from the Neon install to delete before committing: `.agents/`, `.claude/skills/`, `skills-lock.json`.

## Infra
- Vercel project `novanest` is on Ryan's personal scope `ryan-happydogdigs-projects` (Hobby). Pass `--scope ryan-happydogdigs-projects` to every `npx vercel` command; the default scope is the Happy Dog team. Repo is already linked (`.vercel/`).
- Neon DB `novanest-db` provisioned via Vercel Marketplace (free). It injected `DATABASE_URL` and friends into all environments.
- `NUXT_OFFERS_API_SECRET` exists in Vercel **Preview only**. Needs adding to Production before Hermes can use the live site.
- Preview deploys sit behind Vercel login. Use `npx vercel curl <path> --deployment <url>` to hit them from the CLI. Real Hermes traffic should go to production.
- Hobby plan is non-commercial per Vercel's terms; flag for Ryan to decide on Pro.

## Smoke test result
Preview deploy accepted a fake deal, returned a link, and the page rendered it in Playwright. Bad tokens show "Offer not found." Production untouched.

## Plan (agreed 2026-09-25)

### Split
- **Stevie (Hermes skill, `hermes/offer-research/SKILL.md` in this repo, Emily sends it to Stevie to install):** all research in Chromium. Determine county, Zillow facts (beds, baths, total finished sqft, lot acres, year built, type, last sale), county site (current-year annual taxes, confirm owner), sale comps, active listings, rent comps, condition notes from the conversation. Estimates insurance, closing costs, property mgmt (default 5%). Every number carries a source URL.
- **Nuxt site:** validate, filter comps against the rules in code, do all math, render the seller page. Pulls prime rate from FRED itself. No research, no scraping.

### Endpoints
- `POST /api/offers`: Speakly payload + research. A resend for the same contact + address updates the existing record and link.
- Update endpoint for Stevie to change repairs/condition later. Same bearer secret.
- Links expire after 14 days. Expired page: "This offer has expired, contact Emily."

### Comp rules (enforced in code)
- Sale comps: same type, same beds + baths, total finished sqft within 20%, year built within 15 yrs, sold in last 12 months, within 0.5 mi. Widen to 1 mi max. Need 3; fewer = no link, Stevie tells Emily "not enough comps."
- Rent comps: same type and bed/bath, 0.5 mi (widen to 1 mi), at least 3. Sources: Zillow rentals, Rentometer free.
- Active listings: context only, not in the math.
- All property types (SFH, duplex, townhome, condo, multi-unit).

### Math
- Fixed-up value (internally ARV) = average comp $/sqft (total finished) x subject total finished sqft.
- Repairs = $45 x finished above-grade sqft, labeled "potential, subject to inspection." Stevie can override once condition is known.
- Offer = 70% x ARV - repairs - $10k assignment fee. The 70% rule and fee are not shown on the page.
- Landlord scenario (at the offer price): 20% down, prime rate, 30 yr, county taxes, insurance (Stevie), vacancy 5%, PM 5%, maintenance + capex 5%, sewer/trash $75/mo, rehab $45/sqft cash, 3 months holding. Target $500/mo/door after all costs. Always shown, even when it misses.
- Flipper scenario (at the offer price): rehab $45/sqft above-grade, 2 months holding, closing costs (Stevie), no agent fees.
- Retail scenario (default until Emily confirms): "Fix it up and sell it yourself." Fixed-up value minus repairs, 2 months holding, and selling + closing costs (Stevie estimate) = what the owner walks away with, and how long it takes.

### Stevie's judgment vs hardcoded rules (decided 2026-09-25)
Emily trusts Stevie's judgment, so the numbers above are **defaults, not guardrails**:
- Every assumption (70%, fee, $45/sqft, vacancy, PM, capex, holding months, rates, etc.) can be overridden per deal in the payload. Code uses the default only when Stevie sends nothing.
- Comp rules don't reject. Comps that break a rule get accepted and flagged back to Stevie in the POST response so she can explain or fix. Only hard stop: fewer than 3 sale comps.
- The math itself still runs in code so the same inputs always give the same offer.

### Build order (use subagents)
1. Me: lock the payload schema (Speakly payload + `research` + `assumptions` overrides) in `server/utils/offerSchema.ts` and a fixture JSON. Everything else depends on this.
2. Then in parallel:
   - Agent A: calc module (`server/utils/offerCalc.ts`) + unit tests, FRED prime rate, POST upsert/update/expiry routes.
   - Agent B: seller page (`app/pages/offers/[token].vue`) with shadcn, built against the fixture, verified in Playwright.
   - Agent C: Stevie's skill `hermes/offer-research/SKILL.md`, producing exactly the fixture shape.
3. Me: wire together, end-to-end test on a Preview deploy, review.

### Progress (2026-09-25)
- Step 1 done: schema locked in `server/utils/offerSchema.ts`, page contract in `shared/types/offer.ts` (`OfferView`), example payload `hermes/offer-research/example-payload.json`.
- Step 2 done: calc + routes (`server/utils/offerCalc.ts`, 26 vitest tests), seller page (`app/components/offer/`), Stevie's skill (`hermes/offer-research/`). Photos: `subject.photos[]` + `photoUrl` on comps/listings.
- Sample page (fixture, no DB): `/offers/example`, `?variant=duplex`, `?state=expired`. Live in prod on purpose so Emily can review; noindex.
- Upgraded Nuxt 4.2 → 4.5 (4.2 dev server broke on Node 26); css path in nuxt.config changed to `~/assets/...`.
- Next: step 3 end-to-end on Preview (real POST → link → page), then give Stevie the skill. Don't send the skill before that.
- Waiting on Emily: flipper selling costs (currently none, flip profit looks big), OK to show retail net ($274k vs $186k offer), "Cash" claim + Call Emily number (612) 440-2899, sewer/trash per unit vs per property, Hennepin site bans bots (Ryan's call).
- Calc decisions: offer rounds down to nearest $1,000. Result is computed at POST/PATCH and stored (prime rate frozen at that moment). Sewer/trash is per unit. Flipper has no selling costs (Ryan: "no agent fees") – this makes flip profit look bigger; confirm with Emily. POST/PATCH reset the 14-day expiry.

### Seller page
- One page, seller-facing. Plain words, no "ARV," "MAO," or investor jargon. Explains the offer by showing what each kind of buyer has to spend and earn.
- Contact CTA (contact info is already on the site). NovaNest branding. Unlisted token, `noindex`.

### Open
- Retail scenario lines. Emily didn't define it; using the default in Math until she does.
- Vercel Hobby is non-commercial; seller-facing page is commercial. Ryan to decide on Pro.
- Production `NUXT_OFFERS_API_SECRET` not set yet.

## Ryan's rules
Commit on main, never branch. Verify UI in Playwright before calling it done. Never print secret values.
