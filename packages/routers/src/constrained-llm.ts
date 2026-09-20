import OpenAI from "openai";
import { applyPostGate } from "@jev-routing/eval";
import { legalIds, type Fixture, type Prediction } from "@jev-routing/schema";
import { routingUserPrompt } from "./prompt.ts";
import { emptyPrediction, missingEnv, type Router } from "./types.ts";

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw missingEnv("OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

export function createConstrainedLlmRouter(): Router {
  const openai = client();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  return {
    mode: "constrained_llm",
    async route(fixture: Fixture): Promise<Prediction> {
      const started = Date.now();
      const ids = legalIds(fixture.roster);
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a next-hop router. Return JSON with next_hop set to one legal roster id or __none__.",
          },
          { role: "user", content: routingUserPrompt(fixture) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "next_hop_route",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["next_hop"],
              properties: {
                next_hop: {
                  type: "string",
                  enum: ids,
                  description: "Legal roster id or __none__",
                },
              },
            },
          },
        },
      });
      const raw = completion.choices[0]?.message?.content ?? "";
      let parsed: string | null = null;
      try {
        const body = JSON.parse(raw) as { next_hop?: unknown };
        parsed = typeof body.next_hop === "string" ? body.next_hop : null;
      } catch {
        parsed = null;
      }
      const gated = applyPostGate({
        parsedId: parsed,
        parseFail: parsed === null,
        roster: fixture.roster,
      });
      return emptyPrediction(fixture, "constrained_llm", {
        raw_output: raw,
        parsed_id: parsed,
        next_hop: gated.nextHop,
        legal: gated.legal,
        parse_fail: parsed === null,
        illegal_id: gated.illegalId,
        gated: gated.gated,
        gate_reason: gated.gateReason,
        latency_ms: Date.now() - started,
      });
    },
  };
}
