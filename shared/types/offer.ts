// What the seller page gets from GET /api/offers/:token.
// Computed once at POST/PATCH time and stored, so the page never changes on its own.
// Never include: offerPct, assignmentFee, contact info, messages, analysis.

export interface OfferComp {
  address: string;
  url: string;
  beds: number;
  baths: number;
  totalFinishedSqft: number;
  yearBuilt: number | null;
  soldPrice: number;
  soldDate: string;
  distanceMi: number;
  pricePerSqft: number;
  photoUrl: string | null;
}

export interface OfferRentComp {
  address: string;
  url: string;
  source: string | null;
  beds: number;
  baths: number;
  monthlyRent: number;
  distanceMi: number;
  photoUrl: string | null;
}

export interface OfferListing {
  address: string;
  url: string;
  listPrice: number;
  beds: number | null;
  baths: number | null;
  totalFinishedSqft: number | null;
  daysOnMarket: number | null;
  photoUrl: string | null;
}

export interface OfferView {
  status: "active" | "expired";
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  sellerFirstName: string | null;
  property: {
    address: string;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    county: string | null;
    propertyType: string;
    units: number;
    beds: number;
    baths: number;
    totalFinishedSqft: number;
    aboveGradeFinishedSqft: number;
    lotAcres: number | null;
    yearBuilt: number | null;
    annualTaxes: number;
    photos: string[]; // best first; may be empty
  };
  // Our suggested offer, rounded down to the nearest $1,000.
  offer: number;
  // "What homes like yours sell for fixed up." Internally ARV.
  fixedUpValue: {
    value: number;
    avgPricePerSqft: number;
    comps: OfferComp[];
  };
  repairs: {
    total: number;
    perSqft: number | null; // null when Stevie set a flat total
    sqft: number; // finished above-grade
    summary: string | null;
    knownIssues: string[];
  };
  landlord: {
    purchasePrice: number;
    downPaymentPct: number;
    downPayment: number;
    loanAmount: number;
    interestRate: number; // fraction, e.g. 0.075
    loanTermYears: number;
    closingCosts: number;
    rehab: number;
    holdingMonths: number;
    holdingCosts: number; // holdingMonths x (mortgage + taxes + insurance + sewer/trash)
    cashNeeded: number; // down + closing + rehab + holding
    monthly: {
      units: number;
      rentPerUnit: number;
      grossRent: number;
      vacancy: number;
      propertyMgmt: number;
      maintenanceCapex: number;
      mortgage: number; // principal + interest
      taxes: number;
      insurance: number;
      sewerTrash: number;
      cashflow: number;
    };
    cashflowPerUnit: number;
    targetPerUnit: number;
    meetsTarget: boolean;
    rentComps: OfferRentComp[];
  };
  flipper: {
    purchasePrice: number;
    closingCosts: number;
    rehab: number;
    holdingMonths: number;
    holdingCosts: number; // holdingMonths x (taxes + insurance + sewer/trash)
    totalCost: number;
    salePrice: number; // fixed-up value
    profit: number;
  };
  // "Fix it up and sell it yourself."
  retail: {
    salePrice: number; // fixed-up value
    repairs: number;
    holdingMonths: number;
    holdingCosts: number;
    sellingCosts: number;
    netToOwner: number;
    sellingCostsBasis: string | null;
  };
  activeListings: OfferListing[];
  estimatesNote: string; // e.g. "Insurance, closing, and selling costs are estimates."
  researchedAt: string;
}
