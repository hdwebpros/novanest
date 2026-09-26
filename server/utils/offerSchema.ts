import { z } from "zod";

const str = z.string().nullish();

const message = z
  .object({
    id: z.string(),
    direction: z.enum(["inbound", "outbound"]),
    type: str,
    date: z.string(),
    body: z.string().default(""),
  })
  .passthrough();

// Conventions: money in whole dollars, percentages as fractions (0.05 = 5%),
// distances in miles, dates as ISO strings. Every researched number should carry a source URL.

const propertyType = z.enum(["single_family", "townhome", "condo", "duplex", "triplex", "fourplex", "multi_family"]);

const sale = z
  .object({ price: z.number().positive(), date: z.string() })
  .passthrough();

const subject = z
  .object({
    propertyType,
    units: z.number().int().min(1).default(1),
    beds: z.number().nonnegative(),
    baths: z.number().nonnegative(),
    totalFinishedSqft: z.number().positive(),
    aboveGradeFinishedSqft: z.number().positive(),
    lotAcres: z.number().nonnegative().nullish(),
    yearBuilt: z.number().int().nullish(),
    lastSale: sale.nullish(),
    zillowUrl: str,
    photos: z.array(z.string().url()).default([]), // listing photo URLs, best first
    annualTaxes: z.number().nonnegative(),
    taxYear: z.number().int().nullish(),
    countyUrl: str,
    ownerName: str,
    ownerConfirmed: z.boolean().optional(),
  })
  .passthrough();

const saleComp = z
  .object({
    address: z.string().min(1),
    url: z.string(),
    propertyType,
    beds: z.number().nonnegative(),
    baths: z.number().nonnegative(),
    totalFinishedSqft: z.number().positive(),
    yearBuilt: z.number().int().nullish(),
    soldPrice: z.number().positive(),
    soldDate: z.string(),
    distanceMi: z.number().nonnegative(),
    note: str, // Stevie's reason for keeping a comp that breaks a rule
    photoUrl: z.string().url().nullish(),
  })
  .passthrough();

const rentComp = z
  .object({
    address: z.string().min(1),
    url: z.string(),
    source: str, // "zillow" | "rentometer" | other
    propertyType,
    beds: z.number().nonnegative(),
    baths: z.number().nonnegative(),
    monthlyRent: z.number().positive(),
    distanceMi: z.number().nonnegative(),
    date: str,
    note: str,
    photoUrl: z.string().url().nullish(),
  })
  .passthrough();

const activeListing = z
  .object({
    address: z.string().min(1),
    url: z.string(),
    listPrice: z.number().positive(),
    beds: z.number().nonnegative().nullish(),
    baths: z.number().nonnegative().nullish(),
    totalFinishedSqft: z.number().positive().nullish(),
    daysOnMarket: z.number().int().nonnegative().nullish(),
    distanceMi: z.number().nonnegative().nullish(),
    photoUrl: z.string().url().nullish(),
  })
  .passthrough();

const condition = z
  .object({
    summary: str, // from the conversation, e.g. "roof is 25 yrs old, basement leaks"
    knownIssues: z.array(z.string()).default([]),
  })
  .passthrough();

const estimate = z
  .object({ amount: z.number().nonnegative(), basis: str, url: str })
  .passthrough();

export const researchSchema = z
  .object({
    researchedAt: z.string(),
    subject,
    condition: condition.default({}),
    saleComps: z.array(saleComp).min(3, "Need at least 3 sale comps"),
    rentComps: z.array(rentComp).default([]),
    activeListings: z.array(activeListing).default([]),
    estimates: z
      .object({
        annualInsurance: estimate,
        buyerClosingCosts: estimate, // a buyer's closing costs at the offer price, no agent fees
        sellerCostsRetail: estimate, // selling + closing costs if the owner fixes up and lists
      })
      .passthrough(),
  })
  .passthrough();

// Per-deal overrides. Anything left out uses the default in offerCalc.ts.
export const assumptionsSchema = z
  .object({
    offerPct: z.number().positive().max(1),
    assignmentFee: z.number().nonnegative(),
    repairPerSqft: z.number().nonnegative(),
    repairsTotal: z.number().nonnegative(), // replaces repairPerSqft x above-grade sqft
    fixedUpValue: z.number().positive(), // replaces the comp average
    monthlyRentPerUnit: z.number().positive(), // replaces the rent comp average
    interestRate: z.number().nonnegative().max(1), // replaces FRED prime
    downPaymentPct: z.number().nonnegative().max(1),
    loanTermYears: z.number().int().positive(),
    vacancyPct: z.number().nonnegative().max(1),
    propertyMgmtPct: z.number().nonnegative().max(1),
    maintenanceCapexPct: z.number().nonnegative().max(1),
    sewerTrashMonthlyPerUnit: z.number().nonnegative(),
    landlordHoldingMonths: z.number().nonnegative(),
    flipHoldingMonths: z.number().nonnegative(),
    retailHoldingMonths: z.number().nonnegative(),
    targetCashflowPerUnit: z.number(),
    reason: str, // why Stevie changed anything
  })
  .partial()
  .passthrough();

// AI Speakly starred-conversation payload plus Stevie's research.
// Only what the dashboard can't render without is required; unknown fields are kept.
export const offerPayloadSchema = z
  .object({
    event: z.literal("ai_speakly.starred_conversation"),
    locationId: str,
    conversation: z
      .object({
        id: z.string(),
        starred: z.boolean().optional(),
        lastMessageDate: str,
        lastMessageDirection: str,
        lastMessageType: str,
        lastMessageBody: str,
      })
      .passthrough(),
    contact: z
      .object({
        id: z.string(),
        firstName: str,
        lastName: str,
        fullName: str,
        email: str,
        phone: str,
        tags: z.array(z.string()).default([]),
        dnd: z.boolean().optional(),
        source: str,
        dateAdded: str,
      })
      .passthrough(),
    property: z
      .object({
        address: z.string().min(1),
        city: str,
        state: str,
        postalCode: str,
        county: str,
        apn: str,
      })
      .passthrough(),
    opportunity: z
      .object({
        id: str,
        pipelineName: str,
        stageName: str,
        status: str,
        assignedTo: str,
        monetaryValue: z.number().nullish(),
      })
      .passthrough()
      .nullish(),
    messages: z.array(message).default([]),
    analysis: z
      .object({
        needsEmilyAttention: z.boolean().optional(),
        actualOfferSent: z.boolean().optional(),
        actualOfferEvidence: str,
        excludeFromReport: z.boolean().optional(),
        excludeReason: str,
        leadSummary: str,
        recommendedNextAction: str,
      })
      .passthrough()
      .nullish(),
    research: researchSchema,
    assumptions: assumptionsSchema.default({}),
  })
  .passthrough();

// PATCH /api/offers/:token – Stevie updates a deal after learning more.
export const offerUpdateSchema = z
  .object({
    condition: condition.partial().optional(),
    assumptions: assumptionsSchema.optional(),
    estimates: researchSchema.shape.estimates.partial().optional(),
  })
  .passthrough();

export type OfferResearch = z.infer<typeof researchSchema>;
export type OfferAssumptions = z.infer<typeof assumptionsSchema>;
export type OfferUpdate = z.infer<typeof offerUpdateSchema>;
export type OfferPayload = z.infer<typeof offerPayloadSchema>;
