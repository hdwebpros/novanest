# Site defaults (assumptions)

The site applies these when `assumptions` leaves a field out. Send `"assumptions": {}` unless you have a reason to change something. Any override needs `assumptions.reason`.

| Field | Default | Notes |
|---|---|---|
| `offerPct` | `0.70` | Share of the fixed-up value. Internal only, never mention to sellers. |
| `assignmentFee` | `10000` | Internal only, never mention to sellers. |
| `repairPerSqft` | `45` | Times `aboveGradeFinishedSqft`. |
| `repairsTotal` | none | Replaces `repairPerSqft` x above-grade sqft. Use once condition is known. |
| `fixedUpValue` | none | Replaces the comp average ($/sqft x total finished sqft). |
| `monthlyRentPerUnit` | none | Replaces the rent comp average. |
| `interestRate` | current prime | Site fetches prime itself. Override only with a reason (e.g. DSCR loan rate). Fraction: `0.0725`. |
| `downPaymentPct` | `0.20` | |
| `loanTermYears` | `30` | |
| `vacancyPct` | `0.05` | |
| `propertyMgmtPct` | `0.05` | |
| `maintenanceCapexPct` | `0.05` | |
| `sewerTrashMonthlyPerUnit` | `75` | |
| `landlordHoldingMonths` | `3` | |
| `flipHoldingMonths` | `2` | |
| `retailHoldingMonths` | `2` | |
| `targetCashflowPerUnit` | `500` | Monthly, per unit, after all costs. |
| `reason` | none | Required whenever you override anything. One or two plain sentences. |

## How the site uses them
- Fixed-up value = average sale comp $/sqft (total finished) x subject total finished sqft.
- Repairs = $45 x finished above-grade sqft ("potential, subject to inspection").
- Suggested offer = offerPct x fixed-up value - repairs - assignmentFee.
- Landlord, flipper, and "fix it up and sell it yourself" scenarios are all computed at that offer.

## Example override
```json
"assumptions": {
  "repairsTotal": 62000,
  "reason": "Owner says roof leaks and the furnace is original; added ~$20k over the base $45/sqft."
}
```
