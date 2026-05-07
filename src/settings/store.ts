import * as SecureStore from "expo-secure-store";

const KEYS = {
  openrouterApiKey: "openrouter_api_key",
  voice: "sam_voice",
  userFirstName: "sam_user_first_name",
} as const;

const DEFAULT_VOICE = "alloy";

export async function getUserFirstName(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.userFirstName);
}

export async function setUserFirstName(value: string): Promise<void> {
  if (!value) {
    await SecureStore.deleteItemAsync(KEYS.userFirstName);
    return;
  }
  await SecureStore.setItemAsync(KEYS.userFirstName, value);
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.openrouterApiKey);
}

export async function setApiKey(value: string): Promise<void> {
  if (!value) {
    await SecureStore.deleteItemAsync(KEYS.openrouterApiKey);
    return;
  }
  await SecureStore.setItemAsync(KEYS.openrouterApiKey, value);
}

export async function getVoice(): Promise<string> {
  return (await SecureStore.getItemAsync(KEYS.voice)) ?? DEFAULT_VOICE;
}

export async function setVoice(value: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.voice, value);
}

export const VOICES = [
  "alloy",
  "verse",
  "ash",
  "ballad",
  "coral",
  "sage",
] as const;
export type Voice = (typeof VOICES)[number];
