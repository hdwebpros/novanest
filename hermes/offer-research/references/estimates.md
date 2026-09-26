# Estimates

Each estimate is `{ "amount": <whole dollars>, "basis": "<one plain line>", "url": "<source or null>" }`. The basis may show up on the seller page, so no jargon.

## Expected offer price (for sizing closing costs)
Rough guide only; the site computes the real offer:
`0.70 x (average comp $/sqft x subject total finished sqft) - ($45 x above-grade sqft) - 10000`
(Use your overrides if you're sending any.)

## annualInsurance
- Landlord (DP-3) or homeowner (HO-3) policy on the dwelling, sized to rebuild cost, not sale price.
- Start from a current Minnesota average from a free source (Bankrate, NerdWallet, Insurance Information Institute, MN Commerce Dept) and adjust for age, roof, size, and value. Older roofs and water issues push it up.
- Put that source in `url`. Example basis: "Typical landlord policy for a 1950s Richfield home this size; MN average adjusted for an older roof."
- Multi-unit: one policy for the building.

## buyerClosingCosts (no agent fees)
At the expected offer price, a buyer typically pays:
- Title/closing fee, owner's and lender's title policy, recording (~$1,500-2,500 combined around $200k-$300k).
- If financed: lender fees and appraisal (~$1,500-3,000) and MN mortgage registry tax 0.0024 x loan amount (https://www.revenue.state.mn.us/mortgage-registry-tax).
- Rule of thumb: about 2-3% of price financed, ~1% cash. Say which you used.

## sellerCostsRetail (owner fixes up and lists)
- Agent commission: ~5-6% of the fixed-up value (say what you used).
- Seller closing: title/closing fee, prorated items, ~1%.
- MN deed tax: 0.0033 x sale price; Hennepin and Ramsey add 0.0001 (0.0034 total, through 2027 unless extended). Source: https://www.revenue.state.mn.us/deed-tax-rate
- Example basis: "About 5.5% agent commission, 1% closing, and 0.34% state deed tax on a ~$350k sale."
