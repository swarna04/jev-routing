import OpenAI from "openai";
import { applyPostGate } from "@jev-routing/eval";
import type { Fixture, Prediction } from "@jev-routing/schema";
import { parseBareHop } from "./parse.ts";
import { routingUserPrompt } from "./prompt.ts";
import { emptyPrediction, missingEnv, type Router } from "./types.ts";

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw missingEnv("OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

export function createBareLlmRouter(): Router {
  const openai = client();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  return {
    mode: "bare_llm",
    async route(fixture: Fixture): Promise<Prediction> {
      const started = Date.now();
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a next-hop router. Reply with the next hop id in free text. Prefer a single id, but you may add a short reason.",
          },
          { role: "user", content: routingUserPrompt(fixture) },
        ],
      });
      const raw = completion.choices[0]?.message?.content ?? "";
      const parsed = parseBareHop(raw, fixture);
      const gated = applyPostGate({
        parsedId: parsed,
        parseFail: parsed === null,
        roster: fixture.roster,
      });
      return {
        ...emptyPrediction(fixture, "bare_llm", {
          raw_output: raw,
          parsed_id: parsed,
          next_hop: gated.nextHop,
          legal: gated.legal,
          parse_fail: parsed === null,
          illegal_id: gated.illegalId,
          gated: gated.gated,
          gate_reason: gated.gateReason,
          latency_ms: Date.now() - started,
        }),
      };
    },
  };
}
