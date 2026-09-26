import { useDb } from "~~/server/utils/db";
import { offerPayloadSchema, offerUpdateSchema } from "~~/server/utils/offerSchema";
import { computeWithRates, offerResponse, requireOffersAuth } from "~~/server/utils/offerApi";

// Stevie updates condition, estimates, or assumptions. Recomputes with a fresh prime rate.
export default defineEventHandler(async (event) => {
  requireOffersAuth(event);
  const token = getRouterParam(event, "token");

  const parsed = offerUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid offer update",
      data: parsed.error.flatten(),
    });
  }
  const upd = parsed.data;

  const { sql, ready } = useDb();
  await ready;
  const rows = await sql`select data from offers where token = ${token}`;
  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: "Offer not found" });
  }

  const data = rows[0]!.data;
  const merged = {
    ...data,
    research: {
      ...data.research,
      condition: { ...data.research?.condition, ...upd.condition },
      estimates: { ...data.research?.estimates, ...upd.estimates },
    },
    assumptions: { ...data.assumptions, ...upd.assumptions }, // merge by key
  };
  const reparsed = offerPayloadSchema.safeParse(merged);
  if (!reparsed.success) {
    // Old-format rows (pre-research) can't be recomputed. Resend with POST.
    throw createError({
      statusCode: 409,
      statusMessage: "Stored offer is not a valid payload after the update; resend it with POST",
      data: reparsed.error.flatten(),
    });
  }
  const body = reparsed.data;
  const result = await computeWithRates(body);
  const { now, expiresAt } = result;

  await sql`
    update offers set
      data = ${JSON.stringify(body)}::jsonb,
      view = ${JSON.stringify(result.view)}::jsonb,
      updated_at = ${now.toISOString()},
      expires_at = ${expiresAt.toISOString()}
    where token = ${token}`;

  return offerResponse(event, token!, false, result, expiresAt);
});
