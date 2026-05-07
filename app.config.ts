import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Sam",
  slug: "sam",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  locales: {
    fr: "./locales/fr.json",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.yannick.sam",
  },
  android: {
    package: "com.yannick.sam",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-sqlite",
    [
      "expo-audio",
      {
        microphonePermission:
          "Sam a besoin du microphone pour vous écouter et discuter avec vous.",
      },
    ],
    "expo-secure-store",
    "./plugins/with-sam-overlay",
  ],
};

export default config;
