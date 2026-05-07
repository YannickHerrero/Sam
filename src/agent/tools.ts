import type { ToolDefinition } from "../voice/types";

export interface Tool<TArgs = Record<string, unknown>, TResult = unknown> {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: TArgs): TResult | Promise<TResult>;
}

const registry = new Map<string, Tool>();

export function registerTool<TArgs, TResult>(
  tool: Tool<TArgs, TResult>,
): void {
  registry.set(tool.name, tool as unknown as Tool);
}

export function getTool(name: string): Tool | undefined {
  return registry.get(name);
}

export function allTools(): Tool[] {
  return [...registry.values()];
}

export function toolDefinitions(): ToolDefinition[] {
  return allTools().map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const tool = registry.get(name);
  if (!tool) throw new Error(`unknown tool: ${name}`);
  return tool.execute(args);
}
