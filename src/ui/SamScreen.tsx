import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { runAgentTurn } from "../agent/loop";
import { withPersona } from "../agent/persona";
import { getApiKey, getUserFirstName, getVoice } from "../settings/store";
import { OpenRouterProvider } from "../voice/openrouter";
import { StreamingAudioPlayer } from "../voice/player";
import { useMicRecorder } from "../voice/recorder";
import type { TextMessage } from "../voice/types";
import { Orb, type OrbState } from "./Orb";
import { Transcript, type TranscriptLine } from "./Transcript";

function humanizeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/Network request failed|TypeError: Network/i.test(msg)) {
    return "Pas de réseau. Vérifiez votre connexion.";
  }
  if (/OpenRouter 401/.test(msg)) return "Clé API refusée — vérifiez-la.";
  if (/OpenRouter 429/.test(msg)) return "Trop de requêtes — patientez un instant.";
  if (/OpenRouter 5\d\d/.test(msg)) return "OpenRouter est en panne. Réessayez plus tard.";
  if (/OpenRouter 4\d\d/.test(msg)) return `Requête refusée: ${msg}`;
  if (/abort/i.test(msg)) return "Annulé.";
  return msg.length > 140 ? msg.slice(0, 140) + "…" : msg;
}

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
      await activateKeepAwakeAsync("sam-turn");
      await recorder.start();
      setOrbState("listening");
    } catch (e) {
      console.error("[Sam] mic start failed:", e);
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
      setError("Clé API manquante — onglet Settings.");
      setOrbState("idle");
      deactivateKeepAwake("sam-turn");
      return;
    }

    const voice = await getVoice();
    const userFirstName = await getUserFirstName();
    const provider = new OpenRouterProvider({ apiKey });
    const player = new StreamingAudioPlayer();

    console.log("[Sam] turn start", {
      audioUri: result.uri,
      voice,
      historyLen: historyRef.current.length,
    });

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
          onToolCall: (call) =>
            console.log("[Sam] tool call:", call.name, call.arguments),
        },
      });

      console.log("[Sam] turn done", {
        replyLen: turn.reply.length,
        historyLen: turn.history.length,
      });
      historyRef.current = turn.history;
      setOrbState("speaking");
      await player.finishAndPlay();
    } catch (e) {
      console.error("[Sam] turn failed:", e);
      if (e instanceof Error && e.stack) console.error(e.stack);
      setError(humanizeError(e));
    } finally {
      setOrbState("idle");
      deactivateKeepAwake("sam-turn");
    }
  }, [recorder, appendLine]);

  useEffect(() => {
    if (recorder.permissionGranted === false) {
      setError("Micro refusé — autorisez Sam dans les réglages Android.");
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
