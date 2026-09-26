// Offer math. Pure: no I/O, same inputs always give the same numbers.
import type { OfferPayload } from "./offerSchema";
import type { OfferView } from "../../shared/types/offer";

export const DEFAULTS = {
  offerPct: 0.7,
  assignmentFee: 10000,
  repairPerSqft: 45,
  downPaymentPct: 0.2,
  loanTermYears: 30,
  vacancyPct: 0.05,
  propertyMgmtPct: 0.05,
  maintenanceCapexPct: 0.05,
  sewerTrashMonthlyPerUnit: 75,
  landlordHoldingMonths: 3,
  flipHoldingMonths: 2,
  retailHoldingMonths: 2,
  targetCashflowPerUnit: 500,
};

// Overrides that replace a computed value instead of a default.
const REPLACEMENTS = ["repairsTotal", "fixedUpValue", "monthlyRentPerUnit", "interestRate"] as const;

// Comp rules (defaults, not guardrails: breaking one only flags).
export const COMP_RULES = {
  sqftTolerance: 0.2,
  yearBuiltTolerance: 15,
  soldWithinMonths: 12,
  nearMi: 0.5,
  maxMi: 1,
  minRentComps: 3,
};

export interface OfferFlag {
  code: string;
  level: "info" | "warning";
  message: string;
  compAddress?: string;
}

// OfferView minus the fields that come from the DB row.
export type OfferViewBody = Omit<OfferView, "status" | "createdAt" | "updatedAt" | "expiresAt">;

export interface OfferResult {
  view: OfferViewBody;
  flags: OfferFlag[];
}

const round = (n: number) => Math.round(n);
const round2 = (n: number) => Math.round(n * 100) / 100;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Monthly principal + interest. rate is annual, as a fraction.
export function monthlyPayment(principal: number, rate: number, years: number) {
  const n = years * 12;
  if (principal <= 0 || n <= 0) return 0;
  if (rate === 0) return principal / n;
  const r = rate / 12;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

const TYPE_LABEL: Record<string, string> = {
  single_family: "single family",
  townhome: "townhome",
  condo: "condo",
  duplex: "duplex",
  triplex: "triplex",
  fourplex: "fourplex",
  multi_family: "multi-family",
};

const withNote = (msg: string, note: string | null | undefined) => (note ? `${msg} Note: ${note}` : msg);

function distanceFlag(kind: "sale" | "rent", address: string, mi: number, note?: string | null): OfferFlag | null {
  if (mi > COMP_RULES.maxMi) {
    return {
      code: `${kind}_comp_distance_far`,
      level: "warning",
      message: withNote(`${address} is ${mi} mi away, past the ${COMP_RULES.maxMi} mi max.`, note),
      compAddress: address,
    };
  }
  if (mi > COMP_RULES.nearMi) {
    return {
      code: `${kind}_comp_distance_wide`,
      level: "info",
      message: withNote(`${address} is ${mi} mi away, outside ${COMP_RULES.nearMi} mi.`, note),
      compAddress: address,
    };
  }
  return null;
}

function matchFlags(
  kind: "sale" | "rent",
  subject: { propertyType: string; beds: number; baths: number },
  comp: { address: string; propertyType: string; beds: number; baths: number; note?: string | null },
): OfferFlag[] {
  const flags: OfferFlag[] = [];
  const add = (code: string, message: string) =>
    flags.push({ code: `${kind}_comp_${code}`, level: "warning", message: withNote(message, comp.note), compAddress: comp.address });
  if (comp.propertyType !== subject.propertyType) {
    add("type", `${comp.address} is a ${TYPE_LABEL[comp.propertyType] ?? comp.propertyType}, subject is a ${TYPE_LABEL[subject.propertyType] ?? subject.propertyType}.`);
  }
  if (comp.beds !== subject.beds) add("beds", `${comp.address} has ${comp.beds} beds, subject has ${subject.beds}.`);
  if (comp.baths !== subject.baths) add("baths", `${comp.address} has ${comp.baths} baths, subject has ${subject.baths}.`);
  return flags;
}

export function computeOffer(payload: OfferPayload, opts: { primeRate: number | null; now: Date }): OfferResult {
  const { research, property, contact } = payload;
  const { subject, estimates } = research;
  const overrides = payload.assumptions ?? {};
  const a = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
    const v = overrides[k];
    if (typeof v === "number") a[k] = v;
  }
  const units = subject.units ?? 1;
  const flags: OfferFlag[] = [];

  // Sale comps. All of them count toward the value, flagged or not.
  const soldCutoff = new Date(opts.now);
  soldCutoff.setUTCMonth(soldCutoff.getUTCMonth() - COMP_RULES.soldWithinMonths);
  const comps = research.saleComps.map((c) => {
    flags.push(...matchFlags("sale", subject, c));
    const sqftDiff = (c.totalFinishedSqft - subject.totalFinishedSqft) / subject.totalFinishedSqft;
    if (Math.abs(sqftDiff) > COMP_RULES.sqftTolerance) {
      flags.push({
        code: "sale_comp_sqft",
        level: "warning",
        message: withNote(`${c.address} is ${c.totalFinishedSqft} sqft, ${Math.round(Math.abs(sqftDiff) * 100)}% ${sqftDiff > 0 ? "larger" : "smaller"} than the subject (${subject.totalFinishedSqft}).`, c.note),
        compAddress: c.address,
      });
    }
    if (c.yearBuilt != null && subject.yearBuilt != null && Math.abs(c.yearBuilt - subject.yearBuilt) > COMP_RULES.yearBuiltTolerance) {
      flags.push({
        code: "sale_comp_year_built",
        level: "warning",
        message: withNote(`${c.address} was built in ${c.yearBuilt}, subject in ${subject.yearBuilt}.`, c.note),
        compAddress: c.address,
      });
    }
    const sold = new Date(c.soldDate);
    if (Number.isNaN(sold.getTime())) {
      flags.push({ code: "sale_comp_sold_date_invalid", level: "warning", message: withNote(`${c.address} has an unreadable sold date "${c.soldDate}".`, c.note), compAddress: c.address });
    } else if (sold < soldCutoff) {
      flags.push({
        code: "sale_comp_sold_date",
        level: "warning",
        message: withNote(`${c.address} sold ${c.soldDate}, more than ${COMP_RULES.soldWithinMonths} months ago.`, c.note),
        compAddress: c.address,
      });
    }
    const d = distanceFlag("sale", c.address, c.distanceMi, c.note);
    if (d) flags.push(d);
    return {
      address: c.address,
      url: c.url,
      beds: c.beds,
      baths: c.baths,
      totalFinishedSqft: c.totalFinishedSqft,
      yearBuilt: c.yearBuilt ?? null,
      soldPrice: c.soldPrice,
      soldDate: c.soldDate,
      distanceMi: c.distanceMi,
      pricePerSqft: c.soldPrice / c.totalFinishedSqft,
      photoUrl: c.photoUrl ?? null,
    };
  });
  const avgPpsf = avg(comps.map((c) => c.pricePerSqft));
  const fixedUpValue = round(overrides.fixedUpValue ?? avgPpsf * subject.totalFinishedSqft);

  // Repairs
  const repairsTotal = round(overrides.repairsTotal ?? a.repairPerSqft * subject.aboveGradeFinishedSqft);

  // Offer, rounded down to the nearest $1,000
  // round2 first so float noise (0.7 x 350000 = 244999.99…) can't drop a whole $1,000
  const offer = Math.max(0, Math.floor(round2(a.offerPct * fixedUpValue - repairsTotal - a.assignmentFee) / 1000) * 1000);
  if (offer === 0) {
    flags.push({ code: "offer_zero", level: "warning", message: "Offer came out at $0 or less. Check the fixed-up value and repairs." });
  }

  // Rent
  const rentComps = research.rentComps ?? [];
  for (const r of rentComps) {
    flags.push(...matchFlags("rent", subject, r));
    const d = distanceFlag("rent", r.address, r.distanceMi, r.note);
    if (d) flags.push(d);
  }
  if (rentComps.length < COMP_RULES.minRentComps) {
    flags.push({ code: "rent_comps_few", level: "warning", message: `Only ${rentComps.length} rent comp${rentComps.length === 1 ? "" : "s"}, want at least ${COMP_RULES.minRentComps}.` });
  }
  let rentPerUnit = overrides.monthlyRentPerUnit;
  if (rentPerUnit == null) {
    if (rentComps.length) {
      rentPerUnit = avg(rentComps.map((r) => r.monthlyRent));
    } else {
      rentPerUnit = 0;
      flags.push({ code: "rent_missing", level: "warning", message: "No rent comps and no monthlyRentPerUnit override. Landlord numbers use $0 rent." });
    }
  }
  rentPerUnit = round(rentPerUnit);

  // Carrying costs, monthly. Rounded first so the page adds up.
  const interestRate = overrides.interestRate ?? opts.primeRate;
  if (interestRate == null) throw new Error("No interest rate: pass primeRate or assumptions.interestRate");
  const taxes = round(subject.annualTaxes / 12);
  const insurance = round(estimates.annualInsurance.amount / 12);
  const sewerTrash = round(a.sewerTrashMonthlyPerUnit * units);
  const carrying = taxes + insurance + sewerTrash;
  const closingCosts = round(estimates.buyerClosingCosts.amount);

  // Landlord, buying at the offer
  const downPayment = round(offer * a.downPaymentPct);
  const loanAmount = offer - downPayment;
  const mortgage = round(monthlyPayment(loanAmount, interestRate, a.loanTermYears));
  const grossRent = rentPerUnit * units;
  const vacancy = round(grossRent * a.vacancyPct);
  const propertyMgmt = round(grossRent * a.propertyMgmtPct);
  const maintenanceCapex = round(grossRent * a.maintenanceCapexPct);
  const cashflow = grossRent - vacancy - propertyMgmt - maintenanceCapex - mortgage - carrying;
  const cashflowPerUnit = round(cashflow / units);
  const landlordHolding = round(a.landlordHoldingMonths * (mortgage + carrying));
  const meetsTarget = cashflowPerUnit >= a.targetCashflowPerUnit;
  if (!meetsTarget) {
    flags.push({
      code: "landlord_below_target",
      level: "info",
      message: `Landlord cash flow is $${cashflowPerUnit}/mo per unit, under the $${a.targetCashflowPerUnit} target.`,
    });
  }

  // Flipper, buying at the offer. No agent fees.
  const flipHolding = round(a.flipHoldingMonths * carrying);
  const flipTotal = offer + closingCosts + repairsTotal + flipHolding;

  // Retail: owner fixes up and lists
  const retailHolding = round(a.retailHoldingMonths * carrying);
  const sellingCosts = round(estimates.sellerCostsRetail.amount);

  // Overrides
  const known = new Set<string>([...Object.keys(DEFAULTS), ...REPLACEMENTS]);
  const changed = Object.keys(overrides).filter((k) => known.has(k) && (overrides as Record<string, unknown>)[k] != null);
  const unknown = Object.keys(overrides).filter((k) => k !== "reason" && !known.has(k));
  if (changed.length) {
    const reason = overrides.reason ? ` Reason: ${overrides.reason}` : " No reason given.";
    flags.push({
      code: "assumptions_overridden",
      level: "info",
      message: `Overridden: ${changed.map((k) => `${k}=${(overrides as Record<string, unknown>)[k]}`).join(", ")}.${reason}`,
    });
  }
  if (unknown.length) {
    flags.push({ code: "assumptions_unknown", level: "warning", message: `Ignored unknown assumptions: ${unknown.join(", ")}.` });
  }

  const view: OfferViewBody = {
    sellerFirstName: contact.firstName ?? null,
    property: {
      address: property.address,
      city: property.city ?? null,
      state: property.state ?? null,
      postalCode: property.postalCode ?? null,
      county: property.county ?? null,
      propertyType: subject.propertyType,
      units,
      beds: subject.beds,
      baths: subject.baths,
      totalFinishedSqft: subject.totalFinishedSqft,
      aboveGradeFinishedSqft: subject.aboveGradeFinishedSqft,
      lotAcres: subject.lotAcres ?? null,
      yearBuilt: subject.yearBuilt ?? null,
      annualTaxes: round(subject.annualTaxes),
      photos: subject.photos ?? [],
    },
    offer,
    fixedUpValue: {
      value: fixedUpValue,
      avgPricePerSqft: round2(avgPpsf),
      comps: comps.map((c) => ({ ...c, pricePerSqft: round2(c.pricePerSqft) })),
    },
    repairs: {
      total: repairsTotal,
      perSqft: overrides.repairsTotal != null ? null : a.repairPerSqft,
      sqft: subject.aboveGradeFinishedSqft,
      summary: research.condition?.summary ?? null,
      knownIssues: research.condition?.knownIssues ?? [],
    },
    landlord: {
      purchasePrice: offer,
      downPaymentPct: a.downPaymentPct,
      downPayment,
      loanAmount,
      interestRate,
      loanTermYears: a.loanTermYears,
      closingCosts,
      rehab: repairsTotal,
      holdingMonths: a.landlordHoldingMonths,
      holdingCosts: landlordHolding,
      cashNeeded: downPayment + closingCosts + repairsTotal + landlordHolding,
      monthly: {
        units,
        rentPerUnit,
        grossRent,
        vacancy,
        propertyMgmt,
        maintenanceCapex,
        mortgage,
        taxes,
        insurance,
        sewerTrash,
        cashflow,
      },
      cashflowPerUnit,
      targetPerUnit: a.targetCashflowPerUnit,
      meetsTarget,
      rentComps: rentComps.map((r) => ({
        address: r.address,
        url: r.url,
        source: r.source ?? null,
        beds: r.beds,
        baths: r.baths,
        monthlyRent: r.monthlyRent,
        distanceMi: r.distanceMi,
        photoUrl: r.photoUrl ?? null,
      })),
    },
    flipper: {
      purchasePrice: offer,
      closingCosts,
      rehab: repairsTotal,
      holdingMonths: a.flipHoldingMonths,
      holdingCosts: flipHolding,
      totalCost: flipTotal,
      salePrice: fixedUpValue,
      profit: fixedUpValue - flipTotal,
    },
    retail: {
      salePrice: fixedUpValue,
      repairs: repairsTotal,
      holdingMonths: a.retailHoldingMonths,
      holdingCosts: retailHolding,
      sellingCosts,
      netToOwner: fixedUpValue - repairsTotal - retailHolding - sellingCosts,
      sellingCostsBasis: estimates.sellerCostsRetail.basis ?? null,
    },
    activeListings: (research.activeListings ?? []).map((l) => ({
      address: l.address,
      url: l.url,
      listPrice: l.listPrice,
      beds: l.beds ?? null,
      baths: l.baths ?? null,
      totalFinishedSqft: l.totalFinishedSqft ?? null,
      daysOnMarket: l.daysOnMarket ?? null,
      photoUrl: l.photoUrl ?? null,
    })),
    estimatesNote: "Insurance, closing, and selling costs are estimates.",
    researchedAt: research.researchedAt,
  };

  return { view, flags };
}

// contact.id + address, lowercased, punctuation stripped, whitespace collapsed.
export function dedupeKey(contactId: string, address: string) {
  const addr = address.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  return `${contactId}|${addr}`;
}
