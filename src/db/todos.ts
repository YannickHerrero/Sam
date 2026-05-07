import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "./client";
import { todos, type Todo, type NewTodo } from "./schema";

export function createTodo(input: NewTodo): Todo {
  const [row] = db.insert(todos).values(input).returning().all();
  return row;
}

export function getTodo(id: number): Todo | undefined {
  return db.select().from(todos).where(eq(todos.id, id)).get();
}

export function listTodos(
  opts: { status?: "open" | "done" | "all" } = {},
): Todo[] {
  const status = opts.status ?? "open";
  const where =
    status === "all"
      ? undefined
      : status === "open"
        ? isNull(todos.doneAt)
        : isNotNull(todos.doneAt);

  return db
    .select()
    .from(todos)
    .where(where)
    .orderBy(desc(todos.priority), asc(todos.createdAt))
    .all();
}

export function updateTodo(
  id: number,
  patch: Partial<Omit<NewTodo, "id" | "createdAt">>,
): Todo | undefined {
  const [row] = db
    .update(todos)
    .set(patch)
    .where(eq(todos.id, id))
    .returning()
    .all();
  return row;
}

export function completeTodo(id: number): Todo | undefined {
  return updateTodo(id, { doneAt: new Date() });
}

export function deleteTodo(id: number): boolean {
  const result = db.delete(todos).where(eq(todos.id, id)).run();
  return result.changes > 0;
}
