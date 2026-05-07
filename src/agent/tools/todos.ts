import { createTodo, listTodos } from "../../db/todos";
import { registerTool, type Tool } from "../tools";

interface AddTodoArgs {
  text: string;
  due?: string;
  priority?: number;
}

export const addTodoTool: Tool<
  AddTodoArgs,
  { id: number; text: string; due: string | null }
> = {
  name: "todo_add",
  description:
    "Add a new todo. priority is 0=low, 1=normal, 2=high. due is optional ISO 8601.",
  parameters: {
    type: "object",
    properties: {
      text: { type: "string" },
      due: { type: "string", description: "Optional due date, ISO 8601" },
      priority: { type: "number", enum: [0, 1, 2] },
    },
    required: ["text"],
    additionalProperties: false,
  },
  execute({ text, due, priority }) {
    const dueAt = due ? new Date(due) : null;
    const row = createTodo({
      text,
      dueAt: dueAt ?? undefined,
      priority: priority ?? 1,
    });
    return {
      id: row.id,
      text: row.text,
      due: row.dueAt ? row.dueAt.toISOString() : null,
    };
  },
};

registerTool(addTodoTool);

interface ListTodosArgs {
  status?: "open" | "done" | "all";
}

export const listTodosTool: Tool<
  ListTodosArgs,
  Array<{
    id: number;
    text: string;
    due: string | null;
    priority: number;
    done: boolean;
  }>
> = {
  name: "todo_list",
  description:
    "List todos. status defaults to 'open' (incomplete only). Use 'done' for completed, 'all' for both.",
  parameters: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["open", "done", "all"] },
    },
    additionalProperties: false,
  },
  execute({ status }) {
    const rows = listTodos({ status: status ?? "open" });
    return rows.map((r) => ({
      id: r.id,
      text: r.text,
      due: r.dueAt ? r.dueAt.toISOString() : null,
      priority: r.priority,
      done: !!r.doneAt,
    }));
  },
};

registerTool(listTodosTool);
