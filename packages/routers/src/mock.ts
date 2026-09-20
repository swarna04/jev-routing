import { NONE_ID, type Fixture, type Prediction } from "@jev-routing/schema";
import type { Router } from "./types.ts";
import { emptyPrediction } from "./types.ts";

export type MockScript = "demo" | "gold" | "bare_like" | "constrained_like" | "jev_like";

function goldPred(fixture: Fixture): Prediction {
  return {
    fixture_id: fixture.id,
    mode: "mock",
    raw_output: fixture.gold_route,
    parsed_id: fixture.gold_route,
    next_hop: fixture.gold_route,
    legal: true,
    parse_fail: false,
    illegal_id: false,
    gated: false,
    gate_reason: "pass",
    latency_ms: 0,
  };
}

/**
 * Deterministic mock predictions so the scorer and metrics table can be
 * exercised without network calls or fabricated live-model numbers.
 */
export function mockPrediction(fixture: Fixture, script: MockScript): Prediction {
  if (script === "gold") return goldPred(fixture);

  if (script === "jev_like") {
    if (fixture.bucket === "D_inventable") {
      return {
        ...goldPred(fixture),
        raw_output: "file_delete",
        parsed_id: "file_delete",
        next_hop: NONE_ID,
        gated: true,
        gate_reason: "high_noul",
        noul: 0.91,
        confidence: 0.74,
      };
    }
    return goldPred(fixture);
  }

  if (script === "constrained_like") {
    if (fixture.bucket === "D_inventable") {
      return {
        ...goldPred(fixture),
        raw_output: "file_delete",
        parsed_id: "file_delete",
        next_hop: "file_delete",
      };
    }
    if (fixture.bucket === "C_near_miss") {
      return {
        ...goldPred(fixture),
        raw_output: "slack_post",
        parsed_id: "slack_post",
        next_hop: "slack_post",
      };
    }
    return goldPred(fixture);
  }

  if (script === "bare_like") {
    if (fixture.id === "A08") {
      return emptyPrediction(fixture, "mock", {
        raw_output: "I think you want the cli package maybe file_read or slack_post?",
        parse_fail: true,
      });
    }
    if (fixture.bucket === "E_ambiguous") {
      return emptyPrediction(fixture, "mock", {
        raw_output: "shell_exec",
        parsed_id: "shell_exec",
        next_hop: null,
        parse_fail: false,
        illegal_id: true,
        gate_reason: "illegal_id",
      });
    }
    if (fixture.bucket === "D_inventable") {
      return {
        ...goldPred(fixture),
        raw_output: "file_delete",
        parsed_id: "file_delete",
        next_hop: "file_delete",
      };
    }
    return goldPred(fixture);
  }

  // demo: one of each failure class so every metric column is populated.
  switch (fixture.id) {
    case "A01":
      return {
        ...goldPred(fixture),
        raw_output: NONE_ID,
        parsed_id: NONE_ID,
        next_hop: NONE_ID,
      };
    case "A08":
      return emptyPrediction(fixture, "mock", {
        raw_output: "sure, I'll handle that (no id)",
        parse_fail: true,
      });
    case "B01":
      return {
        ...goldPred(fixture),
        raw_output: "slack_post",
        parsed_id: "slack_post",
        next_hop: "slack_post",
      };
    case "E01":
      return emptyPrediction(fixture, "mock", {
        raw_output: "shell_exec",
        parsed_id: "shell_exec",
        next_hop: null,
        parse_fail: false,
        illegal_id: true,
        gate_reason: "illegal_id",
      });
    case "F01":
      return {
        ...goldPred(fixture),
        raw_output: NONE_ID,
        parsed_id: NONE_ID,
        next_hop: NONE_ID,
      };
    case "D01":
      return {
        ...goldPred(fixture),
        raw_output: "file_delete",
        parsed_id: "file_delete",
        next_hop: "file_delete",
      };
    default:
      return goldPred(fixture);
  }
}

export function createMockRouter(script: MockScript = "demo"): Router {
  return {
    mode: "mock",
    async route(fixture) {
      return mockPrediction(fixture, script);
    },
  };
}
