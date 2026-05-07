import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { runAgentTurn } from "../agent/loop";
import { withPersona } from "../agent/persona";
import { getApiKey, getVoice } from "../settings/store";
import { OpenRouterProvider } from "../voice/openrouter";
import { StreamingAudioPlayer } from "../voice/player";
import { useMicRecorder } from "../voice/recorder";
import type { TextMessage } from "../voice/types";
import { Orb, type OrbState } from "./Orb";
import { Transcript, type TranscriptLine } from "./Transcript";

export function SamScreen() {
  const recorder = useMicRecorder();
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<TextMessage[]>([]);

  const appendLine = useCallback((line: TranscriptLine) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const onPressIn = useCallback(async () => {
    setError(null);
    try {
      await recorder.start();
      setOrbState("listening");
    } catch (e) {
      setError(`Mic: ${String(e)}`);
    }
  }, [recorder]);

  const onPressOut = useCallback(async () => {
    if (recorder.state !== "recording") return;
    setOrbState("thinking");
    const result = await recorder.stop();
    if (!result) {
      setOrbState("idle");
      return;
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      setError("Set your OpenRouter API key in Settings.");
      setOrbState("idle");
      return;
    }

    const voice = await getVoice();
    const provider = new OpenRouterProvider({ apiKey });
    const player = new StreamingAudioPlayer();

    let assistantId: string | null = null;
    try {
      const turn = await runAgentTurn({
        audioPath: result.uri,
        history: withPersona(historyRef.current),
        voiceProvider: provider,
        voice,
        callbacks: {
          onTranscriptDelta: (delta) => {
            if (!assistantId) {
              assistantId = `a-${Date.now()}`;
              appendLine({ id: assistantId, role: "assistant", text: delta });
            } else {
              setLines((prev) =>
                prev.map((l) =>
                  l.id === assistantId ? { ...l, text: l.text + delta } : l,
                ),
              );
            }
          },
          onAudioChunk: (chunk) => player.append(chunk),
        },
      });

      historyRef.current = turn.history;
      setOrbState("speaking");
      await player.finishAndPlay();
    } catch (e) {
      setError(String(e));
    } finally {
      setOrbState("idle");
    }
  }, [recorder, appendLine]);

  useEffect(() => {
    if (recorder.permissionGranted === false) {
      setError("Microphone permission denied.");
    }
  }, [recorder.permissionGranted]);

  return (
    <View style={styles.root}>
      <View style={styles.transcriptArea}>
        <Transcript lines={lines} />
      </View>
      <Pressable
        style={styles.orbZone}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        delayLongPress={150}
      >
        <Orb state={orbState} />
        <Text style={styles.hint}>
          {orbState === "idle" ? "Maintenez pour parler" : ""}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  transcriptArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  orbZone: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  hint: {
    color: "#777",
    fontSize: 13,
    marginTop: 18,
  },
  error: {
    color: "#ff6b6b",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 13,
  },
});
