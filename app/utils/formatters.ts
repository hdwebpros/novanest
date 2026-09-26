export function formatPrice(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// "$186,000", "−$120". Rounds to whole dollars.
export function formatMoney(n: number): string {
  const abs = Math.round(Math.abs(n)).toLocaleString("en-US");
  return n < -0.5 ? `−$${abs}` : `$${abs}`;
}

// Date-only strings ("2026-07-10") are shown as-is; timestamps in Minnesota time.
export function formatDate(iso: string, month: "short" | "long" = "short"): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return new Date(dateOnly ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-US", {
    month,
    day: "numeric",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : "America/Chicago",
  });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
