/**
 * Deterministic JSON serialization: object keys are sorted recursively and
 * undefined values dropped, so the same world state always produces the same
 * bytes to sign.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] === undefined) continue;
      out[key] = normalize(source[key]);
    }
    return out;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  return value;
}
