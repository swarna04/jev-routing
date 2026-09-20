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
  "Which next hop should handle `utterance`? Pick the single legal roster agent or tool that matches the request. Picking a tool id is routing, not execution. Pick __none__ only when no legal roster id matches.";

export const DRY_RUN_CONSTRAINT =
  "Routing dry-run: return a next-hop id only. Selecting slack_post, email_send, calendar_create, gh_merge_pr, or file_delete does not call those APIs. Prefer the matching tool id when the user named the target and, for high-consequence actions, gave an explicit go-ahead.";

/**
 * Live traces: after removing "No tool should run", B_clear_tool exact went
 * 0/30 → 4/30, all `gh_list_prs`. Slack/calendar/email/merge/delete stayed
 * Choice `__none__`. The old state.constraint "Never call GitHub, Slack,
 * email, calendar, or file APIs" reads as "do not select those hops."
 */
export function choiceCriteria(fixture: Fixture): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const entry of fixture.roster.agents) {
    criteria[entry.id] = entry.description;
  }
  for (const entry of fixture.roster.tools) {
    criteria[entry.id] =
      `${entry.description}. This is a legal next hop. Prefer this id over __none__ when the user clearly asked for this action with a named target (and an explicit confirm when the action is destructive).`;
  }
  criteria[NONE_ID] =
    "No legal agent or tool matches. Use only for invented or out-of-roster ids, true ambiguity between hops, a missing target, or a destructive action without a named target and explicit confirmation. Named Slack channels, calendar times, email recipients, PR numbers, and file paths are enough to pick the matching tool in a dry-run. Explicit 'I confirm' / 'merge now' language is a go-ahead, not a reason to pick __none__.";
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
          constraint: DRY_RUN_CONSTRAINT,
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
