import { useCallback, useEffect, useRef, useState } from "react";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";

export type RecorderState = "idle" | "recording" | "stopping";

export interface UseMicRecorder {
  state: RecorderState;
  start: () => Promise<void>;
  stop: () => Promise<{
    uri: string;
    format: "m4a";
    durationMs: number;
  } | null>;
  permissionGranted: boolean | null;
}

export function useMicRecorder(): UseMicRecorder {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecorderState>("idle");
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const startedAtRef = useRef<number>(0);
  const preparedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const perm = await requestRecordingPermissionsAsync();
      setPermissionGranted(perm.granted);
      if (!perm.granted) return;
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      try {
        await recorder.prepareToRecordAsync();
        preparedRef.current = true;
      } catch (e) {
        console.error("[recorder] prepare on mount failed:", e);
      }
    })();
  }, [recorder]);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle") return;
    if (!preparedRef.current) {
      await recorder.prepareToRecordAsync();
      preparedRef.current = true;
    }
    recorder.record();
    startedAtRef.current = Date.now();
    setState("recording");
  }, [recorder]);

  const stop = useCallback(async () => {
    if (stateRef.current !== "recording") return null;
    setState("stopping");
    await recorder.stop();
    const durationMs = Date.now() - startedAtRef.current;
    const uri = recorder.uri;
    preparedRef.current = false;
    // re-prepare for the next turn in the background
    recorder
      .prepareToRecordAsync()
      .then(() => {
        preparedRef.current = true;
      })
      .catch((e) => console.warn("[recorder] re-prepare failed:", e));
    setState("idle");
    console.log("[recorder] stopped", { durationMs, uri });
    return uri ? { uri, format: "m4a" as const, durationMs } : null;
  }, [recorder]);

  return { state, start, stop, permissionGranted };
}
