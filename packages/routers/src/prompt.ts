import { NONE_ID, legalIds, type Fixture } from "@jev-routing/schema";

export function rosterBlock(fixture: Fixture): string {
  const agents = fixture.roster.agents
    .map((entry) => `- [agent] ${entry.id}: ${entry.description}`)
    .join("\n");
  const tools = fixture.roster.tools
    .map((entry) => `- [tool] ${entry.id}: ${entry.description}`)
    .join("\n");
  return `Agents:\n${agents}\nTools:\n${tools}`;
}

export function routingUserPrompt(fixture: Fixture): string {
  return [
    "Select the next hop for this user request.",
    "This is a routing dry-run. Do not call GitHub, Slack, email, calendar, or file APIs.",
    `Legal ids: ${legalIds(fixture.roster).join(", ")}`,
    `Use ${NONE_ID} when no tool or agent should run (out of scope, inventable id, ambiguous, or high consequence without clear intent).`,
    "",
    "Roster:",
    rosterBlock(fixture),
    "",
    "User request:",
    fixture.utterance,
  ].join("\n");
}
