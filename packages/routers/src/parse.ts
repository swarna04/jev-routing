import { NONE_ID, isLegalId, legalIds, type Fixture } from "@jev-routing/schema";

const FENCE = /```(?:json)?\s*([\s\S]*?)```/i;

function normalize(value: string): string {
  return value.trim().replace(/^['"`]+|['"`]+$/g, "");
}

function tryJsonHop(text: string): string | null {
  const candidates = [text];
  const fenced = text.match(FENCE);
  if (fenced?.[1]) candidates.unshift(fenced[1]);
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) continue;
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const hop = parsed.next_hop ?? parsed.id ?? parsed.tool ?? parsed.choice;
      if (typeof hop === "string" && hop.trim()) return normalize(hop);
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Fragile free-text parse used by bare_llm.
 * Accepts a raw id, JSON, or a "next hop: id" line. Fails closed on ambiguity.
 */
export function parseBareHop(raw: string, fixture: Fixture): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (/^(none|__none__)$/i.test(text)) return NONE_ID;

  const fromJson = tryJsonHop(text);
  if (fromJson) return fromJson === "none" ? NONE_ID : fromJson;

  const labeled = text.match(
    /(?:next\s*hop|tool|id|choice)\s*[:=]\s*([A-Za-z0-9_]+)/i,
  );
  if (labeled?.[1]) {
    return /^(none|__none__)$/i.test(labeled[1]) ? NONE_ID : labeled[1];
  }

  const tokens = text
    .split(/[^A-Za-z0-9_]+/)
    .map(normalize)
    .filter(Boolean);
  const allowed = new Set(legalIds(fixture.roster));
  const hits = [...new Set(tokens.filter((token) => allowed.has(token)))];
  if (hits.length === 1) return hits[0] ?? null;
  if (hits.length > 1) return null;

  if (tokens.length === 1 && tokens[0]) {
    const only = tokens[0];
    if (/^(none|__none__)$/i.test(only)) return NONE_ID;
    if (only === NONE_ID || isLegalId(only, fixture.roster)) return only;
    return only;
  }

  return null;
}
