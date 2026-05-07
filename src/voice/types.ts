export type Role = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface TextMessage {
  role: Role;
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface TurnCallbacks {
  onTranscriptDelta?: (delta: string) => void;
  onAudioChunk?: (chunk: Uint8Array) => void;
  onToolCall?: (call: ToolCall) => void;
}

export interface TurnInput {
  audioPath?: string;
  textInput?: string;
  history: TextMessage[];
  tools: ToolDefinition[];
  voice: string;
  signal?: AbortSignal;
  callbacks?: TurnCallbacks;
}

export interface TurnResult {
  transcript: string;
  reply: string;
  toolCalls: ToolCall[];
}

export interface VoiceProvider {
  takeTurn(input: TurnInput): Promise<TurnResult>;
}
