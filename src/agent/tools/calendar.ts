import { createEvent, listEvents } from "../../db/events";
import { registerTool, type Tool } from "../tools";

interface CreateEventArgs {
  title: string;
  start: string;
  end?: string;
  description?: string;
  location?: string;
}

export const createEventTool: Tool<CreateEventArgs, { id: number; title: string; start: string }> = {
  name: "calendar_create_event",
  description:
    "Create a new calendar event. Always call current_time first to resolve relative dates. start and end must be ISO 8601 strings.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Event title" },
      start: {
        type: "string",
        description: "Start time as ISO 8601, e.g. 2026-05-08T15:00:00+02:00",
      },
      end: {
        type: "string",
        description: "Optional end time, ISO 8601",
      },
      description: { type: "string" },
      location: { type: "string" },
    },
    required: ["title", "start"],
    additionalProperties: false,
  },
  execute({ title, start, end, description, location }) {
    const startAt = new Date(start);
    if (Number.isNaN(startAt.getTime())) {
      throw new Error(`invalid start: ${start}`);
    }
    const endAt = end ? new Date(end) : null;
    if (endAt && Number.isNaN(endAt.getTime())) {
      throw new Error(`invalid end: ${end}`);
    }
    const row = createEvent({
      title,
      startAt,
      endAt: endAt ?? undefined,
      description: description ?? null,
      location: location ?? null,
    });
    return { id: row.id, title: row.title, start: row.startAt.toISOString() };
  },
};

registerTool(createEventTool);

interface ListEventsArgs {
  from?: string;
  to?: string;
}

export const listEventsTool: Tool<
  ListEventsArgs,
  Array<{
    id: number;
    title: string;
    start: string;
    end: string | null;
    location: string | null;
  }>
> = {
  name: "calendar_list_events",
  description:
    "List events in an optional date range. Both bounds are ISO 8601 and inclusive on the start side. Omit to list everything upcoming.",
  parameters: {
    type: "object",
    properties: {
      from: { type: "string", description: "Start of range, ISO 8601" },
      to: { type: "string", description: "End of range, ISO 8601" },
    },
    additionalProperties: false,
  },
  execute({ from, to }) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const rows = listEvents({ from: fromDate, to: toDate });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      start: r.startAt.toISOString(),
      end: r.endAt ? r.endAt.toISOString() : null,
      location: r.location,
    }));
  },
};

registerTool(listEventsTool);
