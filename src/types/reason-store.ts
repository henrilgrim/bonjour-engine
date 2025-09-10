// Helper: normaliza qualquer tipo de date_event em ms (number) ou null
export function toMs(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number") {
    // segundos (10 dígitos) -> ms | já-ms (13 dígitos)
    return value > 1e12 ? value : value * 1000;
  }

  if (typeof value === "string") {
    // tenta ISO
    const iso = Date.parse(value);
    if (!Number.isNaN(iso)) return iso;

    // tenta numérico contido em string
    const n = Number(value);
    if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  }

  return null;
}
