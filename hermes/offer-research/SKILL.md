---
name: offer-research
description: Research a starred seller lead and post a draft offer.
version: 1.0.0
author: NovaNest (Emily), built with Ryan Boog
license: Proprietary
platforms: [linux, macos]
metadata:
  hermes:
    tags: [real-estate, offers, comps, ai-speakly, novanest]
    category: real-estate
    config:
      - key: novanest.site_url
        description: "Base URL of the NovaNest site that hosts offer pages (no trailing slash)"
        default: "https://novanest.homes"
        prompt: "NovaNest site URL (confirm with Ryan)"
required_environment_variables:
  - name: NOVANEST_OFFERS_API_SECRET
    prompt: NovaNest offers API secret
    help: Ask Ryan. It is the same value as NUXT_OFFERS_API_SECRET on the site's Vercel Production env.
    required_for: posting and updating offer pages
---
# Offer research (NovaNest)

Turn a starred AI Speakly seller lead into a researched deal record, POST it to the NovaNest site, and send Emily the private offer link. You research and structure data. The site does all the offer math. Emily reviews and sends the link to the seller herself.

## When to Use
- An `ai_speakly.starred_conversation` event arrives for a seller lead.
- Emily asks you to run or redo an offer for a lead.
- New condition or repair info arrives for a lead that already has an offer link (use the Update step, not a new POST).

Do not use when:
- The property is outside the 7-county Twin Cities metro (Hennepin, Ramsey, Dakota, Anoka, Washington, Scott, Carver). Stop and tell Emily.
- The lead is a buyer, tenant, or anything other than an owner thinking about selling.

## Prerequisites
- `NOVANEST_OFFERS_API_SECRET` in your secret store. Never paste it in chat, logs, or messages.
- Site base URL from config `novanest.site_url` (below: `$SITE`).
- Chromium/Playwright browser. Free sources only: Zillow, Redfin, Rentometer free tier, county property/tax sites. No paid tools, no logins.
- References: `references/county-sites.md` (county lookup URLs), `references/estimates.md` (insurance, closing, seller costs), `references/defaults.md` (site defaults you may override), `templates/emily-message.md`, and the canonical payload `example-payload.json`.

## Hard rules
- Never contact the seller. Only Emily does.
- Every researched number needs a source URL (subject `zillowUrl`/`countyUrl`, comp `url`, estimate `url` when you have one).
- Units: whole dollars, percentages as fractions (`0.05`), miles, ISO dates (`2026-07-10`), ISO timestamps for `researchedAt`.
- Keep every original Speakly field exactly as received. Only fill `property.county` or `property.apn` if they arrive empty.
- Seller-facing words (condition summary, known issues, estimate basis, comp notes): no ARV, MAO, "wholesale", "assignment", or other investor jargon. Say "what homes like yours sell for fixed up" and "our suggested offer". Never mention the assignment fee or the 70% rule anywhere except in messages to Emily.

## Procedure

### 1. Intake
1. Read the event. Note `contact`, `property.address/city/postalCode`, and all `messages`.
2. Find the county (county field, or look the address up). If it is not one of the 7 counties, stop and message Emily: "<address> is in <county> County, outside our 7-county area. I didn't build an offer."

### 2. Subject property
From Zillow (fallback Redfin) and the county site (`references/county-sites.md`):
- `propertyType`: one of `single_family`, `townhome`, `condo`, `duplex`, `triplex`, `fourplex`, `multi_family`.
- `units` (1 for SFH/townhome/condo, 2/3/4 for duplex/triplex/fourplex, actual count for multi_family).
- `beds`, `baths` (half bath = 0.5), `totalFinishedSqft` (above + below grade finished), `aboveGradeFinishedSqft`, `lotAcres`, `yearBuilt`, `lastSale {price, date}`, `zillowUrl`.
- `photos`: direct image URLs from the Zillow/Redfin listing, best first (exterior front first), up to ~8. Full-size `https` image files (open one: it should show only the image), not the listing page URL. Off-market? Use the photos from the most recent listing in Zillow/Redfin history. None at all? Send `[]`. Never use Street View screenshots or unrelated images.
- From the county site: `annualTaxes` (current-year taxes payable, whole dollars), `taxYear`, `countyUrl` (the parcel page), `ownerName`, `ownerConfirmed` (true if the owner matches the contact's name, false if not).
- If Zillow and the county disagree on sqft or beds, prefer the county for sqft and year built, and Zillow for beds/baths. Note big conflicts to Emily.
- If you can't find above-grade sqft separately, and the house has no finished basement, use the total. Otherwise estimate it and tell Emily.

Done when: every required subject field has a value and a source.

### 3. Condition
Read every message. Write `condition.summary` (one or two plain sentences in the owner's terms) and `condition.knownIssues` (short items, e.g. "Old roof", "Spring basement water"). If nothing is mentioned, summary "Owner hasn't described the condition yet." and an empty list.

### 4. Sale comps (need at least 3)
Search Zillow and Redfin sold listings. Rules the site checks:
- Same `propertyType`, same beds and same baths.
- Total finished sqft within 20% of the subject.
- Year built within 15 years.
- Sold in the last 12 months.
- Within 0.5 mi. If fewer than 3, widen to 1 mi max.

Record per comp: `address`, `url`, `propertyType`, `beds`, `baths`, `totalFinishedSqft`, `yearBuilt`, `soldPrice`, `soldDate`, `distanceMi` (straight-line), `note`, and optional `photoUrl` (the listing's main photo, direct image URL, or `null`).
- Prefer fixed-up or updated comps, since the site uses them for the fixed-up value.
- You may keep a comp that breaks a rule when it is genuinely the best evidence. Put the reason in `note` (e.g. "Widened past 0.5 mi, only two matches inside it."). Otherwise `note: null`.
- Fewer than 3 usable comps even at 1 mi: do NOT POST. Message Emily "Not enough comps for <address>" plus what you found (address, price, date, distance, and which rule each misses).

### 5. Rent comps (aim for 3+)
Same type and bed/bath, 0.5 mi widening to 1 mi. Sources: Zillow rentals (active and recently rented), Rentometer free search. Record `address`, `url`, `source` (`zillow` | `rentometer` | other), `propertyType`, `beds`, `baths`, `monthlyRent`, `distanceMi`, `date`, `note`, optional `photoUrl` (main photo, `null` for Rentometer). For a Rentometer summary, use a descriptive `address` like "Rentometer 3bd/2ba within 0.5 mi" and note which stat you used. For multi-unit subjects, rent comps are per unit, matched to the unit's bed/bath.

### 6. Active listings (context only)
Up to ~5 nearby for-sale listings of similar homes: `address`, `url`, `listPrice`, `beds`, `baths`, `totalFinishedSqft`, `daysOnMarket`, `distanceMi`, optional `photoUrl`. Not used in the math.

### 7. Estimates
See `references/estimates.md`. Each is `{ amount, basis, url }`, `basis` is one plain line, `url` or `null`.
- `annualInsurance`: landlord/HO policy for this home.
- `buyerClosingCosts`: at roughly the expected offer price, no agent fees.
- `sellerCostsRetail`: if the owner fixed it up and listed it: commission + seller closing + MN deed tax.

### 8. Assumptions
Default is `"assumptions": {}`. The site fills every default (`references/defaults.md`). Emily trusts your judgment: override any field when the deal calls for it (e.g. `repairsTotal` once you know the roof needs replacing, `fixedUpValue` when comps are thin, `monthlyRentPerUnit`, `interestRate`) and always say why in `assumptions.reason`.

### 9. Build and POST
Payload = the original Speakly event + `research` + `assumptions`. Match `example-payload.json` exactly in shape.

```bash
curl -sS -X POST "$SITE/api/offers" \
  -H "Authorization: Bearer $NOVANEST_OFFERS_API_SECRET" \
  -H "Content-Type: application/json" \
  --data @payload.json
```

Photo fields inside `payload.json` look like this (URLs are direct image files):
```json
"subject": { "...": "...", "photos": ["https://photos.zillowstatic.com/fp/<id>-uncropped_scaled_within_1536_1152.jpg", "..."] },
"saleComps": [ { "...": "...", "photoUrl": "https://photos.zillowstatic.com/fp/<id>-uncropped_scaled_within_1536_1152.jpg" } ]
```

Responses:
- `200`: `{ token, url, created, offer, fixedUpValue, repairs, landlord: { cashflowPerUnit, meetsTarget }, flags, expiresAt }`. `created: false` means you updated an existing link (same contact + address).
- Each flag is `{ code, level: "info" | "warning", message, compAddress? }`. `compAddress` names the comp that broke a rule. `assumptions_unknown` means you sent an assumption key the site doesn't know; it was ignored, so fix the spelling (see `references/defaults.md`).
- Sanity reference: the example payload at 7% prime gives an offer of $186,000, landlord cash flow $299/unit (misses target), and 3 flags. Missing the landlord target is normal and still shown.
- `400`: validation error with details. Fix the named fields and resend.
- `401`: secret is wrong or missing. Stop and tell Emily ("the offer site rejected my key, Ryan needs to check it"). Don't retry in a loop.
- `5xx` or network error: retry once after a minute, then tell Emily.

Save `token` and `url` against the contact so you can update it later.

### 10. Review before messaging Emily
Look at the response. Fix and resend (or ask Emily) if:
- `offer` is 0 or negative, or above `fixedUpValue`.
- Comp $/sqft (soldPrice / totalFinishedSqft) varies more than ~30% between cheapest and dearest.
- `fixedUpValue` is far from nearby active listings or the Zestimate for a fixed-up home.
- `flags` has any `warning` you can't explain, or several warnings. `info` flags are usually fine (e.g. a comp you already explained in its `note`). For each flag, either fix the data, add a `note`, or pass it on to Emily.
- `repairs` looks wrong for what the owner described (override `repairsTotal` with a reason).

### 11. Message Emily
Use `templates/emily-message.md`: address, our suggested offer, the link, a one-line summary, flags worth knowing, and "link expires in 14 days" (use `expiresAt`). Remind her she sends it to the seller.

### 12. Updates (same deal, new info)
When new repair or condition info comes in, PATCH instead of POSTing again. Body can include any of `condition`, `assumptions`, `estimates` (partial is fine).

```bash
curl -sS -X PATCH "$SITE/api/offers/$TOKEN" \
  -H "Authorization: Bearer $NOVANEST_OFFERS_API_SECRET" \
  -H "Content-Type: application/json" \
  --data '{
    "condition": { "summary": "Roof leaks over the kitchen; furnace is 30 years old.", "knownIssues": ["Roof leak", "Old furnace"] },
    "assumptions": { "repairsTotal": 58000, "reason": "Roof replacement ~$16k and furnace ~$6k on top of the base $45/sqft." }
  }'
```

The link stays the same and the expiry resets to 14 days.
- `409`: the record predates the current format. Resend the full deal with POST (same contact + address keeps the same link).
- PATCH can't clear an override (no nulls). To go back to a site default, resend the full POST without that key in `assumptions`.
- `400`/`401`: same handling as POST.

Review the response as in step 10, then tell Emily what changed (old offer to new offer, and why).

## Field checklist
- [ ] Speakly fields unchanged: `event`, `locationId`, `conversation`, `contact`, `property`, `opportunity`, `messages`, `analysis`
- [ ] `research.researchedAt` (ISO timestamp)
- [ ] `research.subject`: propertyType, units, beds, baths, totalFinishedSqft, aboveGradeFinishedSqft, lotAcres, yearBuilt, lastSale, zillowUrl, photos[] (direct image URLs, front exterior first, or `[]`), annualTaxes, taxYear, countyUrl, ownerName, ownerConfirmed
- [ ] `research.condition`: summary, knownIssues[]
- [ ] `research.saleComps[]` (3+): address, url, propertyType, beds, baths, totalFinishedSqft, yearBuilt, soldPrice, soldDate, distanceMi, note, photoUrl?
- [ ] `research.rentComps[]` (aim 3+): address, url, source, propertyType, beds, baths, monthlyRent, distanceMi, date, note, photoUrl?
- [ ] `research.activeListings[]`: address, url, listPrice, beds, baths, totalFinishedSqft, daysOnMarket, distanceMi, photoUrl?
- [ ] `research.estimates`: annualInsurance, buyerClosingCosts, sellerCostsRetail, each `{amount, basis, url}`
- [ ] `assumptions`: `{}` or overrides + `reason`

## Pitfalls
- Photo URLs must be the image file itself (e.g. `photos.zillowstatic.com/...jpg`, `ssl.cdn-redfin.com/...jpg`), not `zillow.com/homedetails/...`. The site rejects non-URLs; a page URL just shows a broken image.
- Zillow/Redfin block fast scraping. Browse like a person, one page at a time; if blocked, switch source.
- Zillow's "sqft" is often above-grade only. Check the facts section and the county record for basement finish.
- "Sold" dates on Zillow can be off by a few days from the county sale date; either is fine, keep it consistent.
- County tax amounts: use taxes payable for the current year, not the prior year or the estimated market value.
- Don't POST without 3 sale comps; the site rejects it anyway.
- Resending for the same contact + address overwrites the record. Don't POST a different house under the same contact expecting a second link unless the address differs.

## Verification
- POST returned 200 with a `url`, you opened the link in the browser, and it shows the address and offer.
- Emily got the message with the link and expiry date.
