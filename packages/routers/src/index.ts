import type { RoutingMode } from "@jev-routing/schema";
import { createBareLlmRouter } from "./bare-llm.ts";
import { createConstrainedLlmRouter } from "./constrained-llm.ts";
import { createJevRouter } from "./jev.ts";
import { createMockRouter, type MockScript } from "./mock.ts";
import type { Router } from "./types.ts";

export { parseBareHop } from "./parse.ts";
export { createBareLlmRouter } from "./bare-llm.ts";
export { createConstrainedLlmRouter } from "./constrained-llm.ts";
export { createJevRouter } from "./jev.ts";
export { createMockRouter, mockPrediction, type MockScript } from "./mock.ts";
export type { Router } from "./types.ts";

export function createRouter(
  mode: RoutingMode,
  options: { script?: MockScript } = {},
): Router {
  switch (mode) {
    case "mock":
      return createMockRouter(options.script ?? "demo");
    case "bare_llm":
      return createBareLlmRouter();
    case "constrained_llm":
      return createConstrainedLlmRouter();
    case "jev":
      return createJevRouter();
    default: {
      const exhausted: never = mode;
      throw new Error(`unknown mode: ${String(exhausted)}`);
    }
  }
}
