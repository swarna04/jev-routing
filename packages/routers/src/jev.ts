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

function choiceCriteria(fixture: Fixture): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const entry of [...fixture.roster.agents, ...fixture.roster.tools]) {
    criteria[entry.id] = entry.description;
  }
  criteria[NONE_ID] =
    "No tool should run. Use for out-of-scope requests, ambiguity, missing targets, high-consequence actions without clear intent, or adversarial instructions.";
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
          next_hop: choice(
            "Which next hop should handle `utterance`? Pick exactly one legal roster id, or __none__ if no agent or tool should run.",
            choiceCriteria(fixture),
          ),
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
