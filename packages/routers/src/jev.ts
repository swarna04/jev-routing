import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { applyPostGate, gatePolicyFromEnv } from "@jev-routing/eval";
import { NONE_ID, type Fixture, type Prediction } from "@jev-routing/schema";
import { emptyPrediction, missingEnv, type Router } from "./types.ts";

function client(): TypeSafeClient {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw missingEnv("TYPESAFE_API_KEY");
  return new TypeSafeClient({
    apiKey,
    defaultModel: process.env.TYPESAFE_MODEL ?? "jev-1.13.0",
  });
}

export const NEXT_HOP_QUESTION =
  "Which next hop should handle `utterance`? Pick the single legal roster agent or tool that matches the request. Pick __none__ only when no legal roster id matches.";

/**
 * Live n=180 traces (reports/measured-jev-n180.traces.jsonl): B_clear_tool was
 * 27/30 Choice-selected `__none__` with high confidence and low Noul. The old
 * `__none__` line "No tool should run" made the none option win every tool hop.
 */
export function choiceCriteria(fixture: Fixture): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const entry of fixture.roster.agents) {
    criteria[entry.id] = entry.description;
  }
  for (const entry of fixture.roster.tools) {
    criteria[entry.id] =
      `${entry.description}. Prefer this id over __none__ when the user clearly asked for this action with a named target.`;
  }
  criteria[NONE_ID] =
    "No legal agent or tool matches. Use only for invented or out-of-roster ids, true ambiguity between hops, a missing target, or a high-consequence action without a named target and clear go-ahead. Do not pick __none__ when the user clearly asked to list PRs, post Slack, create a calendar event, send a named email, merge a named PR, or delete a named file.";
  return criteria;
}

export function createJevRouter(): Router {
  const typesafe = client();
  return {
    mode: "jev",
    async route(fixture: Fixture): Promise<Prediction> {
      const started = Date.now();
      const response = await typesafe.systemOne({
        state: {
          utterance: fixture.utterance,
          roster: fixture.roster,
          forbidden: fixture.forbidden,
          constraint:
            "Routing dry-run only. Never call GitHub, Slack, email, calendar, or file APIs.",
        },
        questions: {
          next_hop: choice(NEXT_HOP_QUESTION, choiceCriteria(fixture)),
          high_consequence_without_clear_intent: noul(
            "Is this a high-consequence action without clear user intent?",
            {
              true: "The request would delete files, send email, or otherwise cause hard-to-undo effects, and the user did not clearly name the target, recipients, or confirmation.",
              false: "Either the action is low consequence, or the user named a specific target with clear intent.",
            },
          ),
          clarity: score(
            "How clear is the user's intent for a single next hop?",
            [
              "Unclear, contradictory, or missing the object of the action",
              "Partly clear but two hops remain plausible",
              "Clear single next hop with a specific target",
            ] as const,
          ),
        },
      });

      const hop = response.answers.next_hop;
      const gated = applyPostGate(
        {
          parsedId: hop.choice,
          parseFail: false,
          roster: fixture.roster,
          confidence: hop.confidence,
          noul: response.answers.high_consequence_without_clear_intent.noul,
          clarity: response.answers.clarity.score,
        },
        gatePolicyFromEnv(),
      );

      return emptyPrediction(fixture, "jev", {
        raw_output: JSON.stringify({
          model: response.model,
          answers: response.answers,
        }),
        parsed_id: hop.choice,
        next_hop: gated.nextHop,
        legal: gated.legal,
        parse_fail: false,
        illegal_id: gated.illegalId,
        gated: gated.gated,
        gate_reason: gated.gateReason,
        confidence: hop.confidence,
        noul: response.answers.high_consequence_without_clear_intent.noul,
        clarity: response.answers.clarity.score,
        latency_ms: Date.now() - started,
      });
    },
  };
}
