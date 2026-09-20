import { isLegalId, type Fixture, type Prediction, type RoutingMode } from "@jev-routing/schema";

export type Router = {
  mode: RoutingMode;
  route(fixture: Fixture): Promise<Prediction>;
};

export function missingEnv(name: string): Error {
  return new Error(
    `${name} is not set. Copy .env.example to .env and add the key. Live routing modes will not run without it.`,
  );
}

export function emptyPrediction(
  fixture: Fixture,
  mode: RoutingMode,
  extras: Partial<Prediction>,
): Prediction {
  return {
    fixture_id: fixture.id,
    mode,
    raw_output: "",
    parsed_id: null,
    next_hop: null,
    legal: false,
    parse_fail: true,
    illegal_id: false,
    gated: true,
    gate_reason: "parse_fail",
    latency_ms: 0,
    ...extras,
  };
}

export function legalFromParsed(
  fixture: Fixture,
  parsedId: string | null,
): { legal: boolean; illegalId: boolean } {
  if (parsedId === null) return { legal: false, illegalId: false };
  const legal = isLegalId(parsedId, fixture.roster);
  return { legal, illegalId: !legal };
}
