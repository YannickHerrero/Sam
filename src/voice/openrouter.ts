import type {
  TextMessage,
  ToolCall,
  ToolDefinition,
  TurnCallbacks,
  TurnInput,
  TurnResult,
  VoiceProvider,
} from "./types";

const OPENROUTER_CHAT_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TRANSCRIBE_URL =
  "https://openrouter.ai/api/v1/audio/transcriptions";

export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  transcriptionModel?: string;
  audioFormat?: "pcm16" | "wav" | "mp3";
}

export class OpenRouterProvider implements VoiceProvider {
  constructor(private readonly config: OpenRouterConfig) {}

  async takeTurn(input: TurnInput): Promise<TurnResult> {
    let textInput = input.textInput;
    let userTranscript = "";

    if (input.audioPath) {
      userTranscript = await this.transcribe(input.audioPath, input.signal);
      textInput = userTranscript;
      input.callbacks?.onUserTranscript?.(userTranscript);
    }

    const body = await this.buildRequestBody({ ...input, textInput, audioPath: undefined });
    console.log("[OpenRouter] request", {
      model: body.model,
      voice: body.audio?.voice,
      messages: body.messages.length,
      tools: body.tools?.length ?? 0,
      userInputChars: textInput?.length ?? 0,
    });

    let res: Response;
    try {
      res = await fetch(OPENROUTER_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: input.signal,
      });
    } catch (e) {
      console.error("[OpenRouter] fetch threw:", e);
      throw e;
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("[OpenRouter] http error", res.status, text);
      throw new Error(`OpenRouter ${res.status}: ${text}`);
    }
    if (!res.body) {
      console.error("[OpenRouter] no stream body in response");
      throw new Error("OpenRouter returned no stream body");
    }

    const result = await parseSseStream(res.body, input.callbacks);
    return { ...result, transcript: userTranscript };
  }

  private async transcribe(
    audioPath: string,
    signal: AbortSignal | undefined,
  ): Promise<string> {
    const model = this.config.transcriptionModel ?? "openai/whisper-1";
    const form = new FormData();
    form.append("file", {
      uri: audioPath,
      name: "recording.m4a",
      type: "audio/mp4",
    } as unknown as Blob);
    form.append("model", model);
    form.append("language", "fr");

    console.log("[OpenRouter] transcribe", { model, audioPath });

    let res: Response;
    try {
      res = await fetch(OPENROUTER_TRANSCRIBE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        body: form,
        signal,
      });
    } catch (e) {
      console.error("[OpenRouter] transcribe fetch threw:", e);
      throw e;
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("[OpenRouter] transcribe error", res.status, text);
      throw new Error(`OpenRouter ${res.status}: ${text}`);
    }

    const json = await res.json();
    const text: string = json.text ?? "";
    console.log("[OpenRouter] transcribed:", text);
    return text;
  }

  private async buildRequestBody(input: TurnInput) {
    const messages: OpenAiMessage[] = messagesFromHistory(input.history);

    if (input.textInput) {
      messages.push({ role: "user", content: input.textInput });
    }

    return {
      model: this.config.model ?? "openai/gpt-audio-mini",
      modalities: ["text", "audio"],
      audio: {
        voice: input.voice,
        format: this.config.audioFormat ?? "pcm16",
      },
      stream: true,
      messages,
      tools: input.tools.length ? toolsAsOpenAi(input.tools) : undefined,
    };
  }
}

type OpenAiContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | {
          type: "input_audio";
          input_audio: { data: string; format: string };
        }
    >;

type OpenAiMessage =
  | { role: "system" | "user" | "assistant"; content: OpenAiContent }
  | {
      role: "assistant";
      content: string;
      tool_calls: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
    }
  | { role: "tool"; tool_call_id: string; content: string };

function messagesFromHistory(history: TextMessage[]): OpenAiMessage[] {
  return history.map((m): OpenAiMessage => {
    if (m.role === "tool") {
      return {
        role: "tool",
        tool_call_id: m.toolCallId ?? "",
        content: m.content,
      };
    }
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content,
        tool_calls: m.toolCalls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: JSON.stringify(c.arguments) },
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

function toolsAsOpenAi(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

interface ToolCallAcc {
  id: string;
  name: string;
  argsBuffer: string;
}

async function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  callbacks: TurnCallbacks | undefined,
): Promise<TurnResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  let transcript = "";
  let reply = "";
  const toolAcc: Map<number, ToolCallAcc> = new Map();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let lineEnd: number;
    while ((lineEnd = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, lineEnd).trim();
      buffer = buffer.slice(lineEnd + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;

      let chunk: any;
      try {
        chunk = JSON.parse(payload);
      } catch (e) {
        console.warn("[OpenRouter] malformed sse line:", payload.slice(0, 200));
        continue;
      }
      try {
        if (chunk.error) {
          console.error("[OpenRouter] stream error:", chunk.error);
          throw new Error(
            `OpenRouter stream error: ${JSON.stringify(chunk.error)}`,
          );
        }
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        if (typeof delta.content === "string" && delta.content.length > 0) {
          reply += delta.content;
          callbacks?.onTranscriptDelta?.(delta.content);
        }
        if (delta.audio?.transcript) {
          reply += delta.audio.transcript;
          callbacks?.onTranscriptDelta?.(delta.audio.transcript);
        }
        if (delta.audio?.data) {
          const bytes = base64ToBytes(delta.audio.data);
          callbacks?.onAudioChunk?.(bytes);
        }

        const tcDeltas: Array<{
          index: number;
          id?: string;
          function?: { name?: string; arguments?: string };
        }> = delta.tool_calls ?? [];
        for (const td of tcDeltas) {
          let acc = toolAcc.get(td.index);
          if (!acc) {
            acc = { id: td.id ?? "", name: "", argsBuffer: "" };
            toolAcc.set(td.index, acc);
          }
          if (td.id) acc.id = td.id;
          if (td.function?.name) acc.name = td.function.name;
          if (td.function?.arguments) acc.argsBuffer += td.function.arguments;
        }
      } catch (e) {
        if (
          e instanceof Error &&
          e.message.startsWith("OpenRouter stream error")
        ) {
          throw e;
        }
        console.warn("[OpenRouter] sse handler error:", e);
      }
    }
  }

  const toolCalls: ToolCall[] = [...toolAcc.values()].map((a) => ({
    id: a.id,
    name: a.name,
    arguments: safeParseJson(a.argsBuffer),
  }));
  for (const call of toolCalls) callbacks?.onToolCall?.(call);

  return { transcript, reply, toolCalls };
}

function safeParseJson(s: string): Record<string, unknown> {
  if (!s) return {};
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
