import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../auth";
import { isActingAsTeacher } from "utils/userUtils";
import { consume, rateLimitKey } from "utils/rateLimit";
import { CLASSROOM_NAME, classroomToken, describeSession, liveConfig, liveService } from "app/lib/live/classroom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const actions = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), title: z.string().trim().min(1).max(120) }),
  z.object({ action: z.literal("join"), sessionId: z.string().min(1).max(100) }),
  z.object({ action: z.literal("end"), sessionId: z.string().min(1).max(100) }),
]);

export async function GET() {
  const viewer = await auth();
  if (!viewer?.user?.id) return reply({ error: "Sign in to see the classroom." }, 401);
  try {
    const config = liveConfig();
    if (!config) return reply({ configured: false, session: null });
    const [room] = await liveService(config).listRooms([CLASSROOM_NAME]);
    return reply({ configured: true, session: room ? describeSession(room) : null });
  } catch {
    return reply({ error: "The classroom connection is unavailable. Try again shortly." }, 503);
  }
}

export async function POST(request: NextRequest) {
  const viewer = await auth();
  if (!viewer?.user?.id) return reply({ error: "Sign in to enter the classroom." }, 401);
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return reply({ error: "Open the classroom from your LMS." }, 403);
  }
  const parsed = actions.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ error: "Check the session details and try again." }, 400);
  const action = parsed.data;
  const teacher = isActingAsTeacher(viewer);
  if (action.action !== "join" && !teacher) {
    return reply({ error: "Only teachers can start or end a live session." }, 403);
  }
  try {
    const config = liveConfig();
    if (!config) return reply({ error: "Live sessions are not connected yet. You can still check your camera and microphone." }, 503);
    if (action.action !== "end") {
      const limit = await consume(rateLimitKey("live:join", viewer.user.id), 20, 60);
      if (!limit.allowed) return reply({ error: "Too many joining attempts. Wait a minute and try again." }, 429);
    }
    const service = liveService(config);
    let [room] = await service.listRooms([CLASSROOM_NAME]);
    if (action.action === "start" && !room) {
      room = await service.createRoom({
        name: CLASSROOM_NAME,
        emptyTimeout: 120,
        departureTimeout: 60,
        maxParticipants: 80,
        metadata: JSON.stringify({ title: action.title, startedAt: new Date().toISOString() }),
      });
    }
    if (!room || (action.action !== "start" && room.sid !== action.sessionId)) {
      return reply({ error: "That session has ended. Refresh the classroom to join the next one." }, 409);
    }
    if (action.action === "end") {
      await service.deleteRoom(CLASSROOM_NAME);
      return reply({ ended: true });
    }
    return reply({
      session: describeSession(room),
      serverUrl: config.url,
      token: await classroomToken(config, viewer.user, teacher),
    });
  } catch {
    return reply({ error: "We couldn't connect to the classroom. Your camera preview is still available; please try again." }, 503);
  }
}
