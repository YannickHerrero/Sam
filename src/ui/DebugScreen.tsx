import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  createEvent,
  deleteEvent,
  listEvents,
} from "../db/events";
import {
  completeTodo,
  createTodo,
  deleteTodo,
  listTodos,
} from "../db/todos";
import type { Event, Todo } from "../db/schema";

export function DebugScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);

  const refresh = useCallback(() => {
    setEvents(listEvents());
    setTodos(listTodos({ status: "all" }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSampleEvent = () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    createEvent({
      title: `Event ${Math.floor(Math.random() * 1000)}`,
      startAt: start,
      endAt: new Date(start.getTime() + 60 * 60 * 1000),
    });
    refresh();
  };

  const addSampleTodo = () => {
    createTodo({
      text: `Todo ${Math.floor(Math.random() * 1000)}`,
      priority: Math.floor(Math.random() * 3),
    });
    refresh();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Debug — DB</Text>

      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={addSampleEvent}>
          <Text style={styles.btnText}>+ Event</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={addSampleTodo}>
          <Text style={styles.btnText}>+ Todo</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={refresh}>
          <Text style={styles.btnText}>↻</Text>
        </Pressable>
      </View>

      <Text style={styles.h2}>Events ({events.length})</Text>
      {events.map((e) => (
        <Pressable
          key={e.id}
          style={styles.card}
          onLongPress={() => {
            deleteEvent(e.id);
            refresh();
          }}
        >
          <Text style={styles.cardTitle}>{e.title}</Text>
          <Text style={styles.cardSub}>
            {e.startAt.toLocaleString()}
            {e.location ? ` · ${e.location}` : ""}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.h2}>Todos ({todos.length})</Text>
      {todos.map((t) => (
        <Pressable
          key={t.id}
          style={[styles.card, t.doneAt && styles.cardDone]}
          onPress={() => {
            if (!t.doneAt) completeTodo(t.id);
            refresh();
          }}
          onLongPress={() => {
            deleteTodo(t.id);
            refresh();
          }}
        >
          <Text style={[styles.cardTitle, t.doneAt && styles.strike]}>
            {t.text}
          </Text>
          <Text style={styles.cardSub}>
            priority {t.priority}
            {t.doneAt ? ` · done ${t.doneAt.toLocaleDateString()}` : ""}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.hint}>Tap todo = complete · Long-press = delete</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0c" },
  content: { padding: 16, paddingBottom: 64 },
  h1: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12 },
  h2: {
    color: "#bbb",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  btn: {
    backgroundColor: "#1f1f24",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  card: {
    backgroundColor: "#15151a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  cardDone: { opacity: 0.5 },
  cardTitle: { color: "#fff", fontSize: 16 },
  cardSub: { color: "#888", fontSize: 12, marginTop: 2 },
  strike: { textDecorationLine: "line-through" },
  hint: { color: "#555", fontSize: 11, marginTop: 24, textAlign: "center" },
});
