// Current US prime rate from FRED (DPRIME), no API key. Cached in memory.
const FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DPRIME";
const TTL_MS = 12 * 60 * 60 * 1000;

let cache: { rate: number; at: number } | null = null;

// Last non-empty value in the CSV, percent → fraction.
export function parseFredCsv(csv: string): number | null {
  const lines = csv.trim().split(/\r?\n/).slice(1);
  for (let i = lines.length - 1; i >= 0; i--) {
    const raw = lines[i]!.split(",")[1]?.trim();
    if (raw && Number.isFinite(Number(raw))) return Math.round(Number(raw) * 100) / 10000;
  }
  return null;
}

export async function getPrimeRate(): Promise<number> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rate;
  try {
    const res = await fetch(FRED_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`FRED responded ${res.status}`);
    const rate = parseFredCsv(await res.text());
    if (rate == null) throw new Error("No prime rate value in FRED CSV");
    cache = { rate, at: Date.now() };
    return rate;
  } catch (err) {
    if (cache) return cache.rate; // stale beats nothing
    throw createError({
      statusCode: 503,
      statusMessage: "Could not fetch the prime rate from FRED",
      data: { reason: (err as Error).message, fix: "Retry later, or send assumptions.interestRate." },
    });
  }
}
