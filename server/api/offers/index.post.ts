import { randomBytes } from "node:crypto";
import { useDb } from "~~/server/utils/db";
import { dedupeKey } from "~~/server/utils/offerCalc";
import { offerPayloadSchema } from "~~/server/utils/offerSchema";
import { computeWithRates, offerResponse, requireOffersAuth } from "~~/server/utils/offerApi";

// Create or, for the same contact + address, update an offer. Same link on resend.
export default defineEventHandler(async (event) => {
  requireOffersAuth(event);

  const parsed = offerPayloadSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid offer payload",
      data: parsed.error.flatten(),
    });
  }
  const body = parsed.data;
  const result = await computeWithRates(body);
  const { now, expiresAt } = result;

  const { sql, ready } = useDb();
  await ready;
  const token = randomBytes(12).toString("base64url");
  const rows = await sql`
    insert into offers (token, data, dedupe_key, view, created_at, updated_at, expires_at)
    values (
      ${token}, ${JSON.stringify(body)}::jsonb, ${dedupeKey(body.contact.id, body.property.address)},
      ${JSON.stringify(result.view)}::jsonb, ${now.toISOString()}, ${now.toISOString()}, ${expiresAt.toISOString()}
    )
    on conflict (dedupe_key) do update set
      data = excluded.data,
      view = excluded.view,
      updated_at = excluded.updated_at,
      expires_at = excluded.expires_at
    returning token, (xmax = 0) as created`;

  return offerResponse(event, rows[0]!.token, rows[0]!.created, result, expiresAt);
});
