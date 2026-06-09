"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { CalendarEvent } from "../models/calendarEvent";
import { User } from "../models/user";
import { connectToDatabase } from "./mongoose-connector";
import {
  CalendarEventInputSchema,
  canEditEvent,
  normalizeEventInput,
  type CalendarEventInput,
  type ClientCalendarEvent,
} from "../utils/calendarUtils";
import {
  failure,
  success,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

/**
 * Calendar permissions (enforced HERE, server-side — the UI only mirrors them):
 * - anyone logged in can create events
 * - teachers can update/delete any event, including seeded school events
 * - students can update/delete only events they created
 * - restricted events are returned only to the owner, the shared-with users,
 *   and teachers
 */

type RawEvent = {
  _id: ObjectId;
  title: string;
  description?: string;
  category: ClientCalendarEvent["category"];
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  owner: { _id: ObjectId; name?: string } | ObjectId | null;
  visibility: "everyone" | "restricted";
  sharedWith?: ObjectId[];
};

const ownerIdOf = (event: RawEvent): string | null => {
  if (!event.owner) return null;
  if (event.owner instanceof ObjectId) return event.owner.toString();
  return event.owner._id.toString();
};

const ownerNameOf = (event: RawEvent): string => {
  if (!event.owner) return "Vefskólinn";
  if (event.owner instanceof ObjectId) return "Unknown";
  return event.owner.name ?? "Unknown";
};

/** All events the CURRENT user may see, with a per-event canEdit flag. */
export const getCalendarEvents = async (): Promise<ClientCalendarEvent[]> => {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const role = session.user.role;

  await connectToDatabase();

  const filter =
    role === "teacher"
      ? {}
      : {
          $or: [
            { visibility: "everyone" },
            { owner: new ObjectId(userId) },
            { sharedWith: new ObjectId(userId) },
          ],
        };

  const events = (await CalendarEvent.find(filter)
    .populate("owner", "name")
    .lean()) as unknown as RawEvent[];

  return events.map((event) => {
    const ownerId = ownerIdOf(event);
    return {
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      ownerId,
      ownerName: ownerNameOf(event),
      visibility: event.visibility,
      sharedWith: (event.sharedWith ?? []).map((id) => id.toString()),
      canEdit: canEditEvent(role, userId, { owner: ownerId }),
    };
  });
};

const validateSharedWith = (sharedWith: string[]): ObjectId[] | null => {
  if (!sharedWith.every((id) => ObjectId.isValid(id))) return null;
  return sharedWith.map((id) => new ObjectId(id));
};

export const createCalendarEvent = async (
  data: CalendarEventInput
): Promise<ActionResult<{ id: string }>> => {
  const session = await auth();
  if (!session?.user?.id) {
    return failure("You must be logged in to add events");
  }

  const validated = CalendarEventInputSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  const normalized = normalizeEventInput(validated.data);
  const sharedWith = validateSharedWith(normalized.sharedWith);
  if (sharedWith === null) {
    return failure(ErrorMessages.INVALID_INPUT);
  }

  try {
    await connectToDatabase();
    const created = await CalendarEvent.create({
      ...normalized,
      sharedWith,
      owner: new ObjectId(session.user.id),
    });
    revalidatePath("/LMS/calendar");
    return success({ id: created._id.toString() }, "Event added");
  } catch (e) {
    return handleActionError("createCalendarEvent", e, "Failed to add event");
  }
};

export const updateCalendarEvent = async (
  eventId: string,
  data: CalendarEventInput
): Promise<ActionResult<void>> => {
  const session = await auth();
  if (!session?.user?.id) {
    return failure("You must be logged in to edit events");
  }
  if (!ObjectId.isValid(eventId)) {
    return failure(ErrorMessages.NOT_FOUND("Event"));
  }

  const validated = CalendarEventInputSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  const normalized = normalizeEventInput(validated.data);
  const sharedWith = validateSharedWith(normalized.sharedWith);
  if (sharedWith === null) {
    return failure(ErrorMessages.INVALID_INPUT);
  }

  try {
    await connectToDatabase();
    const event = await CalendarEvent.findById(new ObjectId(eventId)).lean<{
      owner: ObjectId | null;
    }>();
    if (!event) {
      return failure(ErrorMessages.NOT_FOUND("Event"));
    }

    if (!canEditEvent(session.user.role, session.user.id, event)) {
      return failure("You can only edit events you created yourself");
    }

    await CalendarEvent.updateOne(
      { _id: new ObjectId(eventId) },
      { ...normalized, sharedWith }
    );
    revalidatePath("/LMS/calendar");
    return successNoData("Event updated");
  } catch (e) {
    return handleActionError(
      "updateCalendarEvent",
      e,
      "Failed to update event"
    );
  }
};

export const deleteCalendarEvent = async (
  eventId: string
): Promise<ActionResult<void>> => {
  const session = await auth();
  if (!session?.user?.id) {
    return failure("You must be logged in to delete events");
  }
  if (!ObjectId.isValid(eventId)) {
    return failure(ErrorMessages.NOT_FOUND("Event"));
  }

  try {
    await connectToDatabase();
    const event = await CalendarEvent.findById(new ObjectId(eventId)).lean<{
      owner: ObjectId | null;
    }>();
    if (!event) {
      return failure(ErrorMessages.NOT_FOUND("Event"));
    }

    if (!canEditEvent(session.user.role, session.user.id, event)) {
      return failure("You can only delete events you created yourself");
    }

    await CalendarEvent.deleteOne({ _id: new ObjectId(eventId) });
    revalidatePath("/LMS/calendar");
    return successNoData("Event deleted");
  } catch (e) {
    return handleActionError(
      "deleteCalendarEvent",
      e,
      "Failed to delete event"
    );
  }
};

export type ShareableUser = { id: string; name: string };

/**
 * Minimal user list (id + name) for the "share with" picker. Available to any
 * logged-in user — names are already public on the People page; no emails or
 * roles are exposed here.
 */
export const getShareableUsers = async (): Promise<ShareableUser[]> => {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectToDatabase();
  const users = (await User.find({}, { name: 1 })
    .sort({ name: 1 })
    .lean()) as unknown as Array<{ _id: ObjectId; name: string }>;

  return users
    .filter((user) => user._id.toString() !== session.user.id)
    .map((user) => ({ id: user._id.toString(), name: user.name }));
};
