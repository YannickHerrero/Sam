import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "./client";
import { events, type Event, type NewEvent } from "./schema";

export function createEvent(input: NewEvent): Event {
  const [row] = db.insert(events).values(input).returning().all();
  return row;
}

export function getEvent(id: number): Event | undefined {
  return db.select().from(events).where(eq(events.id, id)).get();
}

export function listEvents(opts: { from?: Date; to?: Date } = {}): Event[] {
  const filters = [];
  if (opts.from) filters.push(gte(events.startAt, opts.from));
  if (opts.to) filters.push(lte(events.startAt, opts.to));

  const where = filters.length ? and(...filters) : undefined;
  return db
    .select()
    .from(events)
    .where(where)
    .orderBy(asc(events.startAt))
    .all();
}

export function updateEvent(
  id: number,
  patch: Partial<Omit<NewEvent, "id" | "createdAt">>,
): Event | undefined {
  const [row] = db
    .update(events)
    .set(patch)
    .where(eq(events.id, id))
    .returning()
    .all();
  return row;
}

export function deleteEvent(id: number): boolean {
  const result = db.delete(events).where(eq(events.id, id)).run();
  return result.changes > 0;
}
