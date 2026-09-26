import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeOffer, dedupeKey, DEFAULTS, monthlyPayment } from "../server/utils/offerCalc";
import { offerPayloadSchema, type OfferPayload } from "../server/utils/offerSchema";
import { parseFredCsv } from "../server/utils/primeRate";

const raw = JSON.parse(readFileSync(new URL("../hermes/offer-research/example-payload.json", import.meta.url), "utf8"));
const now = new Date("2026-09-25T16:00:00Z");
const primeRate = 0.07;

// Fresh, parsed copy with optional tweaks to the raw JSON.
function payload(tweak?: (p: any) => void): OfferPayload {
  const p = structuredClone(raw);
  tweak?.(p);
  return offerPayloadSchema.parse(p);
}
const codes = (flags: { code: string }[]) => flags.map((f) => f.code);

describe("example payload", () => {
  const { view, flags } = computeOffer(payload(), { primeRate, now });

  it("fixed-up value is the avg comp $/sqft x subject sqft", () => {
    // 352000/1520, 329900/1380, 371000/1600, 338500/1400 → avg 236.0744 x 1450
    expect(view.fixedUpValue.avgPricePerSqft).toBe(236.07);
    expect(view.fixedUpValue.value).toBe(342308);
    expect(view.fixedUpValue.comps.map((c) => c.pricePerSqft)).toEqual([231.58, 239.06, 231.88, 241.79]);
  });

  it("repairs and offer", () => {
    expect(view.repairs).toMatchObject({ total: 42750, perSqft: 45, sqft: 950 });
    // 0.7 x 342308 - 42750 - 10000 = 186865.6 → 186000
    expect(view.offer).toBe(186000);
  });

  it("landlord", () => {
    const l = view.landlord;
    expect(l).toMatchObject({
      purchasePrice: 186000,
      downPayment: 37200,
      loanAmount: 148800,
      interestRate: 0.07,
      closingCosts: 3500,
      rehab: 42750,
      holdingMonths: 3,
      holdingCosts: 3 * (990 + 348 + 158 + 75),
      cashNeeded: 37200 + 3500 + 42750 + 4713,
      cashflowPerUnit: 299,
      targetPerUnit: 500,
      meetsTarget: false,
    });
    expect(l.monthly).toEqual({
      units: 1,
      rentPerUnit: 2200,
      grossRent: 2200,
      vacancy: 110,
      propertyMgmt: 110,
      maintenanceCapex: 110,
      mortgage: 990,
      taxes: 348,
      insurance: 158,
      sewerTrash: 75,
      cashflow: 299,
    });
    expect(l.rentComps).toHaveLength(3);
  });

  it("flipper", () => {
    expect(view.flipper).toEqual({
      purchasePrice: 186000,
      closingCosts: 3500,
      rehab: 42750,
      holdingMonths: 2,
      holdingCosts: 1162,
      totalCost: 233412,
      salePrice: 342308,
      profit: 108896,
    });
  });

  it("retail", () => {
    expect(view.retail).toMatchObject({
      salePrice: 342308,
      repairs: 42750,
      holdingMonths: 2,
      holdingCosts: 1162,
      sellingCosts: 24500,
      netToOwner: 342308 - 42750 - 1162 - 24500,
    });
  });

  it("flags the wide comp, the old comp, and the landlord miss, with notes", () => {
    expect(codes(flags)).toEqual(["sale_comp_distance_wide", "sale_comp_year_built", "landlord_below_target"]);
    expect(flags[0]).toMatchObject({ level: "info", compAddress: "7010 Demo Ln, Richfield, MN" });
    expect(flags[0]!.message).toContain("Widened past 0.5 mi");
    expect(flags[1]!.message).toContain("Built 18 years later");
  });

  it("never leaks internal numbers or contact info", () => {
    const s = JSON.stringify(view);
    for (const k of ["offerPct", "assignmentFee", "contact", "messages", "analysis", "phone", "email", "lastName"]) {
      expect(s).not.toContain(k);
    }
    expect(s).not.toContain("+16125550100");
  });

  it("is deterministic", () => {
    expect(computeOffer(payload(), { primeRate, now })).toEqual({ view, flags });
  });
});

describe("overrides", () => {
  it("replacement overrides win and get flagged with the reason", () => {
    const { view, flags } = computeOffer(
      payload((p) => {
        p.assumptions = { repairsTotal: 60000, fixedUpValue: 350000, monthlyRentPerUnit: 2400, interestRate: 0.065, reason: "Roof quote in hand" };
      }),
      { primeRate: null, now },
    );
    expect(view.fixedUpValue.value).toBe(350000);
    expect(view.fixedUpValue.avgPricePerSqft).toBe(236.07); // comps still shown
    expect(view.repairs).toMatchObject({ total: 60000, perSqft: null });
    expect(view.offer).toBe(175000); // 245000 - 60000 - 10000, exact despite 0.7 x 350000 float noise
    expect(view.landlord.interestRate).toBe(0.065);
    expect(view.landlord.monthly.rentPerUnit).toBe(2400);
    const f = flags.find((x) => x.code === "assumptions_overridden")!;
    expect(f.message).toContain("repairsTotal=60000");
    expect(f.message).toContain("interestRate=0.065");
    expect(f.message).toContain("Roof quote in hand");
  });

  it("default overrides change the math", () => {
    const { view } = computeOffer(
      payload((p) => {
        p.assumptions = { offerPct: 0.75, assignmentFee: 5000, repairPerSqft: 30, landlordHoldingMonths: 0, targetCashflowPerUnit: 200 };
      }),
      { primeRate, now },
    );
    // 0.75 x 342308 - 28500 - 5000 = 223231 → 223000
    expect(view.repairs.total).toBe(28500);
    expect(view.offer).toBe(223000);
    expect(view.landlord.holdingCosts).toBe(0);
    expect(view.landlord.targetPerUnit).toBe(200);
  });

  it("flags unknown assumption keys", () => {
    const { flags } = computeOffer(payload((p) => (p.assumptions = { bogus: 1 })), { primeRate, now });
    expect(codes(flags)).toContain("assumptions_unknown");
    expect(codes(flags)).not.toContain("assumptions_overridden");
  });

  it("DEFAULTS match the plan", () => {
    expect(DEFAULTS).toEqual({
      offerPct: 0.7, assignmentFee: 10000, repairPerSqft: 45, downPaymentPct: 0.2, loanTermYears: 30,
      vacancyPct: 0.05, propertyMgmtPct: 0.05, maintenanceCapexPct: 0.05, sewerTrashMonthlyPerUnit: 75,
      landlordHoldingMonths: 3, flipHoldingMonths: 2, retailHoldingMonths: 2, targetCashflowPerUnit: 500,
    });
  });

  it("throws without any interest rate", () => {
    expect(() => computeOffer(payload(), { primeRate: null, now })).toThrow(/interest rate/);
  });
});

describe("math edges", () => {
  it("rate 0 amortizes straight-line", () => {
    expect(monthlyPayment(360000, 0, 30)).toBe(1000);
    const { view } = computeOffer(payload((p) => (p.assumptions = { interestRate: 0 })), { primeRate: null, now });
    expect(view.landlord.monthly.mortgage).toBe(Math.round(148800 / 360)); // 413
  });

  it("standard amortization", () => {
    expect(monthlyPayment(100000, 0.06, 30)).toBeCloseTo(599.55, 2);
  });

  it("offer rounds down and floors at 0", () => {
    const a = computeOffer(payload((p) => (p.assumptions = { fixedUpValue: 101430, repairsTotal: 0, assignmentFee: 0 })), { primeRate, now });
    expect(a.view.offer).toBe(71000); // 71001 → 71000
    const b = computeOffer(payload((p) => (p.assumptions = { fixedUpValue: 50000, repairsTotal: 100000 })), { primeRate, now });
    expect(b.view.offer).toBe(0);
    expect(codes(b.flags)).toContain("offer_zero");
    expect(b.view.landlord.loanAmount).toBe(0);
  });

  it("multi-unit multiplies rent and sewer/trash", () => {
    const { view } = computeOffer(payload((p) => (p.research.subject.units = 2)), { primeRate, now });
    expect(view.landlord.monthly.grossRent).toBe(4400);
    expect(view.landlord.monthly.sewerTrash).toBe(150);
    expect(view.landlord.cashflowPerUnit).toBe(Math.round(view.landlord.monthly.cashflow / 2));
  });

  it("every dollar output is a whole number", () => {
    const { view } = computeOffer(payload((p) => (p.research.subject.annualTaxes = 4183.37)), { primeRate: 0.0712, now });
    const ints = [
      view.offer, view.fixedUpValue.value, view.repairs.total, view.property.annualTaxes,
      ...Object.values(view.landlord.monthly), view.landlord.cashNeeded, view.landlord.holdingCosts,
      ...Object.values(view.flipper), view.retail.netToOwner, view.retail.holdingCosts,
    ];
    for (const n of ints) expect(Number.isInteger(n)).toBe(true);
  });
});

describe("flags", () => {
  it("sale comp mismatches", () => {
    const { flags } = computeOffer(
      payload((p) => {
        Object.assign(p.research.saleComps[0], { propertyType: "townhome", beds: 4, baths: 1.5, totalFinishedSqft: 1800, soldDate: "2025-08-01", distanceMi: 1.3, note: "Best I could find" });
      }),
      { primeRate, now },
    );
    const mine = flags.filter((f) => f.compAddress === "6620 Example Ave S, Richfield, MN");
    expect(codes(mine)).toEqual([
      "sale_comp_type", "sale_comp_beds", "sale_comp_baths", "sale_comp_sqft", "sale_comp_sold_date", "sale_comp_distance_far",
    ]);
    expect(mine.find((f) => f.code === "sale_comp_distance_far")!.level).toBe("warning");
    for (const f of mine) expect(f.message).toContain("Best I could find");
  });

  it("sqft exactly 20% off and sold exactly 12 months ago are fine", () => {
    const { flags } = computeOffer(
      payload((p) => Object.assign(p.research.saleComps[0], { totalFinishedSqft: 1740, soldDate: "2025-09-26" })),
      { primeRate, now },
    );
    expect(codes(flags)).not.toContain("sale_comp_sqft");
    expect(codes(flags)).not.toContain("sale_comp_sold_date");
  });

  it("rent comp mismatches and too few", () => {
    const { flags } = computeOffer(
      payload((p) => {
        p.research.rentComps = [
          { ...p.research.rentComps[0], propertyType: "duplex", beds: 2, distanceMi: 0.8 },
          p.research.rentComps[1],
        ];
      }),
      { primeRate, now },
    );
    expect(codes(flags)).toEqual(expect.arrayContaining(["rent_comp_type", "rent_comp_beds", "rent_comp_distance_wide", "rent_comps_few"]));
  });

  it("no rent comps and no override still computes, flagged", () => {
    const { view, flags } = computeOffer(payload((p) => (p.research.rentComps = [])), { primeRate, now });
    expect(view.landlord.monthly.rentPerUnit).toBe(0);
    expect(codes(flags)).toEqual(expect.arrayContaining(["rent_comps_few", "rent_missing"]));
  });

  it("no rent comps with an override uses the override", () => {
    const { view, flags } = computeOffer(
      payload((p) => {
        p.research.rentComps = [];
        p.assumptions = { monthlyRentPerUnit: 2300 };
      }),
      { primeRate, now },
    );
    expect(view.landlord.monthly.rentPerUnit).toBe(2300);
    expect(codes(flags)).not.toContain("rent_missing");
  });

  it("fewer than 3 sale comps is a schema error", () => {
    const p = structuredClone(raw);
    p.research.saleComps = p.research.saleComps.slice(0, 2);
    expect(offerPayloadSchema.safeParse(p).success).toBe(false);
  });
});

describe("helpers", () => {
  it("dedupe key normalizes the address", () => {
    expect(dedupeKey("c1", "  6512 Example Ave. S,  ")).toBe("c1|6512 example ave s");
    expect(dedupeKey("c1", "6512 example   AVE S")).toBe(dedupeKey("c1", "6512 Example Ave. S"));
  });

  it("parses FRED CSV, skipping empty values", () => {
    expect(parseFredCsv("observation_date,DPRIME\n2026-09-18,7.00\n2026-09-21,7.25\n2026-09-22,\n2026-09-23,.\n")).toBe(0.0725);
    expect(parseFredCsv("observation_date,DPRIME\n")).toBeNull();
  });
});
