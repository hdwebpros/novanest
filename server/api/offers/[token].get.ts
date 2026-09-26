import { useDb } from "~~/server/utils/db";
import type { OfferView } from "~~/shared/types/offer";

// Public. Returns only the stored seller view, never the raw payload.
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  setHeader(event, "cache-control", "no-store");
  setHeader(event, "x-robots-tag", "noindex");

  const { sql, ready } = useDb();
  await ready;
  const rows = await sql`select view, created_at, updated_at, expires_at from offers where token = ${token}`;
  const row = rows[0];
  if (!row?.view) {
    throw createError({ statusCode: 404, statusMessage: "Offer not found" });
  }

  const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);
  const expiresAt = iso(row.expires_at);
  if (expiresAt && Date.now() > Date.parse(expiresAt)) {
    return { status: "expired" as const, expiresAt };
  }

  const createdAt = iso(row.created_at)!;
  return {
    ...row.view,
    status: "active",
    createdAt,
    updatedAt: iso(row.updated_at) ?? createdAt,
    expiresAt: expiresAt ?? createdAt,
  } as OfferView;
});
