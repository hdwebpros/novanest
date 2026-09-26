import type { H3Event } from "h3";
import { computeOffer, type OfferResult } from "~~/server/utils/offerCalc";
import type { OfferPayload } from "~~/server/utils/offerSchema";
import { getPrimeRate } from "~~/server/utils/primeRate";

export const OFFER_TTL_DAYS = 14;

export function requireOffersAuth(event: H3Event) {
  const secret = useRuntimeConfig(event).offersApiSecret;
  if (!secret || getHeader(event, "authorization") !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
}

// Fresh prime rate (skipped when Stevie set interestRate), then the math.
export async function computeWithRates(payload: OfferPayload, now = new Date()) {
  const primeRate = payload.assumptions?.interestRate != null ? null : await getPrimeRate();
  const result = computeOffer(payload, { primeRate, now });
  const expiresAt = new Date(now.getTime() + OFFER_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { ...result, now, expiresAt };
}

// What Stevie gets back from POST/PATCH to sanity-check before sending the link.
export function offerResponse(
  event: H3Event,
  token: string,
  created: boolean,
  { view, flags }: OfferResult,
  expiresAt: Date,
) {
  return {
    token,
    url: `${getRequestURL(event).origin}/offers/${token}`,
    created,
    offer: view.offer,
    fixedUpValue: view.fixedUpValue.value,
    repairs: view.repairs.total,
    landlord: { cashflowPerUnit: view.landlord.cashflowPerUnit, meetsTarget: view.landlord.meetsTarget },
    flags,
    expiresAt: expiresAt.toISOString(),
  };
}
