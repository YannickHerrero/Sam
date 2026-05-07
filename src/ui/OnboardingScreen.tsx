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
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { setApiKey, setUserFirstName } from "../settings/store";

interface OnboardingScreenProps {
  onDone: () => void;
}

type Step = "intro" | "mic" | "key" | "name";

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>("intro");
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    getRecordingPermissionsAsync().then((p) => setMicGranted(p.granted));
  }, []);

  const requestMic = async () => {
    const p = await requestRecordingPermissionsAsync();
    setMicGranted(p.granted);
    if (p.granted) setStep("key");
  };

  const saveKey = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed.startsWith("sk-or-") && trimmed.length < 12) {
      setKeyError("La clé doit commencer par sk-or-");
      return;
    }
    await setApiKey(trimmed);
    setStep("name");
  };

  const finish = async () => {
    if (firstName.trim()) await setUserFirstName(firstName.trim());
    onDone();
  };

  return (
    <ScrollView contentContainerStyle={styles.root}>
      {step === "intro" && (
        <View style={styles.panel}>
          <Text style={styles.title}>Bonjour. Je suis Sam.</Text>
          <Text style={styles.body}>
            Une assistante vocale qui vit sur votre téléphone. Je peux noter
            vos rendez-vous, gérer vos tâches, et discuter avec vous — en
            français, principalement.
          </Text>
          <Text style={styles.body}>
            Avant de commencer, j'ai besoin de trois choses.
          </Text>
          <Pressable style={styles.btnPrimary} onPress={() => setStep("mic")}>
            <Text style={styles.btnText}>On y va</Text>
          </Pressable>
        </View>
      )}

      {step === "mic" && (
        <View style={styles.panel}>
          <Text style={styles.title}>Le micro</Text>
          <Text style={styles.body}>
            Pour vous entendre. Aucun son n'est envoyé tant que vous ne
            maintenez pas l'orbe.
          </Text>
          {micGranted === true ? (
            <>
              <Text style={styles.ok}>Micro accordé.</Text>
              <Pressable style={styles.btnPrimary} onPress={() => setStep("key")}>
                <Text style={styles.btnText}>Suivant</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.btnPrimary} onPress={requestMic}>
              <Text style={styles.btnText}>Autoriser le micro</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === "key" && (
        <View style={styles.panel}>
          <Text style={styles.title}>Votre clé OpenRouter</Text>
          <Text style={styles.body}>
            Je passe par OpenRouter pour parler. Créez une clé sur
            openrouter.ai (gpt-audio-mini activé) et collez-la ci-dessous.
            Elle reste sur l'appareil, dans le coffre sécurisé.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="sk-or-..."
            placeholderTextColor="#555"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={keyInput}
            onChangeText={(t) => {
              setKeyInput(t);
              setKeyError(null);
            }}
          />
          {keyError ? <Text style={styles.err}>{keyError}</Text> : null}
          <Pressable style={styles.btnPrimary} onPress={saveKey}>
            <Text style={styles.btnText}>Enregistrer</Text>
          </Pressable>
        </View>
      )}

      {step === "name" && (
        <View style={styles.panel}>
          <Text style={styles.title}>Comment vous appelez-vous ?</Text>
          <Text style={styles.body}>
            Optionnel. Je m'en servirai de temps en temps pour rendre nos
            échanges un peu plus humains.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Yannick"
            placeholderTextColor="#555"
            autoCapitalize="words"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Pressable style={styles.btnPrimary} onPress={finish}>
            <Text style={styles.btnText}>
              {firstName.trim() ? "Enchantée" : "Plus tard"}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0a0a0c",
  },
  panel: {
    backgroundColor: "rgba(15, 15, 22, 0.85)",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 16,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  body: { color: "#bbb", fontSize: 15, lineHeight: 22 },
  ok: { color: "#4a8", fontSize: 14 },
  err: { color: "#ff6b6b", fontSize: 13 },
  input: {
    backgroundColor: "#15151a",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: "#3a86ff",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
