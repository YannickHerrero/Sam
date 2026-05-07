import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { bootstrapDatabase } from "./src/db/client";
import { DebugScreen } from "./src/ui/DebugScreen";
import { SettingsScreen } from "./src/ui/SettingsScreen";

type Screen = "debug" | "settings";

export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("debug");

  useEffect(() => {
    bootstrapDatabase();
    setReady(true);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.tabs}>
        <Tab label="Debug" active={screen === "debug"} onPress={() => setScreen("debug")} />
        <Tab label="Settings" active={screen === "settings"} onPress={() => setScreen("settings")} />
      </View>
      {ready && screen === "debug" && <DebugScreen />}
      {ready && screen === "settings" && <SettingsScreen />}
    </SafeAreaView>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0c" },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#15151a",
  },
  tabActive: { backgroundColor: "#3a86ff" },
  tabText: { color: "#888", fontSize: 13 },
  tabTextActive: { color: "#fff", fontWeight: "600" },
});
