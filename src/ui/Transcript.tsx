import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export interface TranscriptLine {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface TranscriptProps {
  lines: TranscriptLine[];
  maxVisible?: number;
}

export function Transcript({ lines, maxVisible = 4 }: TranscriptProps) {
  const visible = lines.slice(-maxVisible);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [visible.length]);

  return (
    <View style={styles.root} pointerEvents="none">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {visible.map((line, i) => {
          const distanceFromTop = visible.length - 1 - i;
          const opacity = Math.max(0.25, 1 - distanceFromTop * 0.22);
          return (
            <Text
              key={line.id}
              style={[
                styles.line,
                line.role === "user" ? styles.user : styles.assistant,
                { opacity },
              ]}
            >
              {line.text}
            </Text>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    minHeight: 120,
  },
  content: {
    gap: 6,
    paddingVertical: 8,
  },
  line: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  user: { color: "#9bc8ff", fontStyle: "italic" },
  assistant: { color: "#fff" },
});
