import "./tools/index";
import type {
  TextMessage,
  TurnCallbacks,
  VoiceProvider,
} from "../voice/types";
import { executeTool, toolDefinitions } from "./tools";

export interface RunTurnOptions {
  audioPath: string;
  history: TextMessage[];
  voiceProvider: VoiceProvider;
  voice: string;
  signal?: AbortSignal;
  callbacks?: TurnCallbacks;
  maxToolHops?: number;
}

export interface RunTurnResult {
  history: TextMessage[];
  reply: string;
}

const DEFAULT_MAX_HOPS = 4;

export async function runAgentTurn(
  opts: RunTurnOptions,
): Promise<RunTurnResult> {
  const tools = toolDefinitions();
  const history: TextMessage[] = [...opts.history];

  let turn = await opts.voiceProvider.takeTurn({
    audioPath: opts.audioPath,
    history,
    tools,
    voice: opts.voice,
    signal: opts.signal,
    callbacks: opts.callbacks,
  });

  history.push({
    role: "assistant",
    content: turn.reply,
    toolCalls: turn.toolCalls.length ? turn.toolCalls : undefined,
  });

  const maxHops = opts.maxToolHops ?? DEFAULT_MAX_HOPS;
  let hops = 0;

  while (turn.toolCalls.length > 0 && hops < maxHops) {
    for (const call of turn.toolCalls) {
      let content: string;
      try {
        const result = await executeTool(call.name, call.arguments);
        console.log("[Sam] tool ok", call.name, "→", result);
        opts.callbacks?.onToolResult?.(call, { ok: true, value: result });
        content = JSON.stringify(result);
      } catch (err) {
        console.error("[Sam] tool failed", call.name, call.arguments, err);
        opts.callbacks?.onToolResult?.(call, {
          ok: false,
          error: String(err),
        });
        content = JSON.stringify({ error: String(err) });
      }
      history.push({ role: "tool", toolCallId: call.id, content });
    }

    turn = await opts.voiceProvider.takeTurn({
      history,
      tools,
      voice: opts.voice,
      signal: opts.signal,
      callbacks: opts.callbacks,
    });

    history.push({
      role: "assistant",
      content: turn.reply,
      toolCalls: turn.toolCalls.length ? turn.toolCalls : undefined,
    });
    hops++;
  }

  return { history, reply: turn.reply };
}
