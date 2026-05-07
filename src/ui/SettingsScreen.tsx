import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getApiKey,
  getVoice,
  setApiKey,
  setVoice,
  VOICES,
  type Voice,
} from "../settings/store";

export function SettingsScreen() {
  const [apiKey, setApiKeyState] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [voice, setVoiceState] = useState<Voice>("alloy");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const k = await getApiKey();
      setHasKey(!!k);
      const v = (await getVoice()) as Voice;
      setVoiceState(v);
    })();
  }, []);

  const save = async () => {
    if (apiKey) {
      await setApiKey(apiKey.trim());
      setHasKey(true);
      setApiKeyState("");
    }
    await setVoice(voice);
    setSavedAt(Date.now());
  };

  const clearKey = async () => {
    await setApiKey("");
    setHasKey(false);
    setApiKeyState("");
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Settings</Text>

      <Text style={styles.label}>OpenRouter API key</Text>
      <Text style={styles.hint}>
        {hasKey ? "Stored. Replace by entering a new key." : "Not set."}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="sk-or-..."
        placeholderTextColor="#555"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={apiKey}
        onChangeText={setApiKeyState}
      />
      {hasKey ? (
        <Pressable style={styles.btnDanger} onPress={clearKey}>
          <Text style={styles.btnText}>Forget key</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.label, { marginTop: 24 }]}>Voice</Text>
      <View style={styles.voiceRow}>
        {VOICES.map((v) => (
          <Pressable
            key={v}
            style={[styles.voiceChip, voice === v && styles.voiceChipActive]}
            onPress={() => setVoiceState(v)}
          >
            <Text
              style={[
                styles.voiceText,
                voice === v && styles.voiceTextActive,
              ]}
            >
              {v}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.btnPrimary} onPress={save}>
        <Text style={styles.btnText}>Save</Text>
      </Pressable>
      {savedAt && (
        <Text style={styles.savedHint}>
          Saved at {new Date(savedAt).toLocaleTimeString()}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0c" },
  content: { padding: 16, paddingBottom: 64 },
  h1: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 16 },
  label: { color: "#bbb", fontSize: 13, fontWeight: "600", marginTop: 8 },
  hint: { color: "#666", fontSize: 12, marginTop: 2, marginBottom: 8 },
  input: {
    backgroundColor: "#15151a",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  voiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  voiceChip: {
    backgroundColor: "#15151a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#222",
  },
  voiceChipActive: {
    backgroundColor: "#3a86ff",
    borderColor: "#3a86ff",
  },
  voiceText: { color: "#bbb", fontSize: 14 },
  voiceTextActive: { color: "#fff", fontWeight: "600" },
  btnPrimary: {
    backgroundColor: "#3a86ff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  btnDanger: {
    backgroundColor: "#3a1a1a",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  savedHint: {
    color: "#4a8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
