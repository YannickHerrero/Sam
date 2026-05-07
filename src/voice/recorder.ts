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
  stop: () => Promise<{ uri: string; format: "m4a" } | null>;
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

  useEffect(() => {
    (async () => {
      const perm = await requestRecordingPermissionsAsync();
      setPermissionGranted(perm.granted);
      if (perm.granted) {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      }
    })();
  }, []);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle") return;
    await recorder.prepareToRecordAsync();
    recorder.record();
    setState("recording");
  }, [recorder]);

  const stop = useCallback(async () => {
    if (stateRef.current !== "recording") return null;
    setState("stopping");
    await recorder.stop();
    const uri = recorder.uri;
    setState("idle");
    return uri ? { uri, format: "m4a" as const } : null;
  }, [recorder]);

  return { state, start, stop, permissionGranted };
}
