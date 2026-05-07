import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { bootstrapDatabase } from "./src/db/client";
import { DebugScreen } from "./src/ui/DebugScreen";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapDatabase();
    setReady(true);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {ready && <DebugScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0c" },
});
