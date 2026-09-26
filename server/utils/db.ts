import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let ready: Promise<unknown> | null = null;

// Idempotent: safe on every cold start. Old rows keep nulls in the new columns.
async function migrate(sql: NeonQueryFunction<false, false>) {
  await sql`
    create table if not exists offers (
      token text primary key,
      data jsonb not null,
      created_at timestamptz not null default now()
    )`;
  await sql`
    alter table offers
      add column if not exists dedupe_key text,
      add column if not exists view jsonb,
      add column if not exists updated_at timestamptz,
      add column if not exists expires_at timestamptz`;
  await sql`create unique index if not exists offers_dedupe_key_key on offers (dedupe_key)`;
}

export function useDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw createError({ statusCode: 500, statusMessage: "DATABASE_URL is not set" });
  }
  const sql = neon(url);
  ready ??= migrate(sql).catch((err) => {
    ready = null; // retry on the next request
    throw err;
  });
  return { sql, ready };
}
