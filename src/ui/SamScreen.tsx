import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { runAgentTurn } from "../agent/loop";
import { withPersona } from "../agent/persona";
import { getApiKey, getUserFirstName, getVoice } from "../settings/store";
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
    const userFirstName = await getUserFirstName();
    const provider = new OpenRouterProvider({ apiKey });
    const player = new StreamingAudioPlayer();

    let assistantId: string | null = null;
    try {
      const turn = await runAgentTurn({
        audioPath: result.uri,
        history: withPersona(historyRef.current, { userFirstName }),
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

  const dismiss = useCallback(() => {
    if (orbState !== "idle") return;
    BackHandler.exitApp();
  }, [orbState]);

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <View style={styles.card} pointerEvents="box-none">
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 24,
    paddingHorizontal: 8,
    borderRadius: 28,
    backgroundColor: "rgba(15, 15, 22, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
  },
  transcriptArea: {
    minHeight: 120,
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  orbZone: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  hint: {
    color: "#777",
    fontSize: 13,
    marginTop: 14,
  },
  error: {
    color: "#ff6b6b",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 13,
  },
});
