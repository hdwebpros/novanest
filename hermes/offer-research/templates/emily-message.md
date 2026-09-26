# Message to Emily

Keep it short. This goes to Emily only, never the seller.

## New offer
```
Offer ready: {address}
Suggested offer: ${offer}  (fixed up ~${fixedUpValue}, repairs ~${repairs})
Link: {url}
{one-line summary: who the owner is, why they're selling, condition}
Landlord cash flow: ${cashflowPerUnit}/mo per unit ({meets / misses} the $500 target)
Flags: {only the ones worth knowing, or "none"}
Overrides: {assumptions.reason, or "none, site defaults"}
Link expires {expiresAt as a date} (14 days). You send it to the seller when you're happy with it.
```

## Update
```
Updated offer: {address}
Was ${oldOffer}, now ${offer}. {why: what the owner told us}
Same link: {url}. Expiry reset to {expiresAt as a date}.
```

## Not enough comps
```
Not enough comps for {address}. Found {n} within 1 mi:
- {address}, ${soldPrice}, sold {soldDate}, {distanceMi} mi, misses: {rule}
No link created. Want me to widen the search or set a fixed-up value by hand?
```

## Outside our area
```
{address} is in {county} County, outside our 7-county area. I didn't build an offer.
```
