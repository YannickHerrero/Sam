import { registerTool, type Tool } from "../tools";

const TZ = "Europe/Paris";

export const currentTimeTool: Tool<Record<string, never>, {
  iso: string;
  local: string;
  timezone: string;
}> = {
  name: "current_time",
  description:
    "Returns the current date and time so you can resolve relative expressions like 'tomorrow at 3pm' or 'this evening'. Always call this before scheduling or filtering by date.",
  parameters: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  execute() {
    const now = new Date();
    const local = now.toLocaleString("fr-FR", {
      timeZone: TZ,
      dateStyle: "full",
      timeStyle: "short",
    });
    return { iso: now.toISOString(), local, timezone: TZ };
  },
};

registerTool(currentTimeTool);
