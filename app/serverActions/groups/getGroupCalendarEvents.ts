"use server";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { logError } from "utils/errors";
import type { CalendarEvent } from "types/calendarTypes";
import { applyLifecycle } from "./lifecycle";
import { requireSession } from "./helpers";

const toDateKey = (value: Date | string) =>
  new Date(value).toISOString().slice(0, 10);

/**
 * Group projects rendered as calendar events: kickoff, hand-in and the
 * presentation day (with each team's slot in the description). Reading also
 * advances the projects' date-driven lifecycle, so a project whose start
 * date has arrived shows up as active everywhere.
 */
export async function getGroupCalendarEvents(): Promise<CalendarEvent[]> {
  const session = await requireSession();
  if (!session) return [];

  try {
    await connectToDatabase();
    const projects = await GroupProject.find({}).lean<GroupProjectLean[]>();
    await Promise.all(projects.map((project) => applyLifecycle(project)));

    // One batched lookup for every slot's team name.
    const teams = await Team.find(
      { project: { $in: projects.map((project) => project._id) } },
      { name: 1 }
    ).lean();
    const teamNameById = new Map(
      teams.map((team) => [String(team._id), team.name])
    );

    const events: CalendarEvent[] = [];

    for (const project of projects) {
      const id = String(project._id);
      const startKey = toDateKey(project.startDate);
      const endKey = toDateKey(project.endDate);
      const presentationKey = project.presentationDate
        ? toDateKey(project.presentationDate)
        : null;

      // The whole project as one spanning bar (kickoff → hand-in).
      events.push({
        id: `gp-${id}-span`,
        date: startKey,
        endDate: endKey > startKey ? endKey : undefined,
        title: project.title,
        category: "groupwork",
        description: "Group project — from kickoff to hand-in.",
      });

      if (presentationKey) {
        const slots = [...(project.presentationSlots || [])].sort(
          (a, b) => (a.startTime || "").localeCompare(b.startTime || "")
        );
        let description = "Team presentations.";
        if (slots.length > 0) {
          description = slots
            .map(
              (slot) =>
                `${teamNameById.get(String(slot.team)) || "Team"} ${slot.startTime}–${slot.endTime}`
            )
            .join(" · ");
        }
        events.push({
          id: `gp-${id}-presentations`,
          date: presentationKey,
          title: `${project.title} — presentations`,
          category: "groupwork",
          time: slots[0]?.startTime,
          description,
        });
      }
    }

    return events;
  } catch (error) {
    logError("getGroupCalendarEvents", error);
    return [];
  }
}
