import { randomUUID } from "node:crypto";
import { AccessToken, RoomServiceClient, TrackSource, type Room } from "livekit-server-sdk";
import type { LiveSession } from "types/liveTypes";

// One shared classroom for this school demo. The SID changes for each session,
// so an old tab cannot accidentally end a newly started lecture.
export const CLASSROOM_NAME = "reverse-flash-classroom";

export function liveConfig() {
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) return null;
  const parsed = new URL(url);
  if (!["ws:", "wss:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("Invalid LiveKit URL");
  }
  return { url, key, secret };
}

export function liveService(config: NonNullable<ReturnType<typeof liveConfig>>) {
  const host = config.url.replace(/^ws/, "http");
  return new RoomServiceClient(host, config.key, config.secret);
}

export function describeSession(room: Room): LiveSession {
  let metadata: { title?: string; startedAt?: string } = {};
  try { metadata = JSON.parse(room.metadata || "{}") || {}; } catch { /* old room */ }
  return {
    id: room.sid,
    title: typeof metadata.title === "string" ? metadata.title : "Live classroom",
    startedAt: typeof metadata.startedAt === "string" && Number.isFinite(Date.parse(metadata.startedAt))
      ? metadata.startedAt : new Date(Number(room.creationTime) * 1000).toISOString(),
    participants: room.numParticipants,
  };
}

export async function classroomToken(
  config: NonNullable<ReturnType<typeof liveConfig>>,
  user: { id: string; name?: string | null },
  teacher: boolean,
) {
  const token = new AccessToken(config.key, config.secret, {
    identity: user.id + "-" + randomUUID(),
    name: user.name || (teacher ? "Teacher" : "Student"),
    ttl: "2m",
    metadata: JSON.stringify({ role: teacher ? "teacher" : "student" }),
  });
  token.addGrant({
    room: CLASSROOM_NAME,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: false,
    canUpdateOwnMetadata: false,
    canPublishSources: teacher
      ? [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO]
      : [TrackSource.CAMERA, TrackSource.MICROPHONE],
  });
  return token.toJwt();
}
