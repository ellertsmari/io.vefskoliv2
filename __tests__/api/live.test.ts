/** @jest-environment node */
import { NextRequest } from "next/server";
import { webcrypto } from "node:crypto";
import { decodeJwt } from "jose";
import { auth } from "../../auth";
import { consume } from "utils/rateLimit";
import { GET, POST } from "app/api/live/route";
import { classroomToken, liveConfig, liveService } from "app/lib/live/classroom";

// The repository's manual jose mock lacks the LiveKit signing methods.
// Exercise the real signed token and grants here.
jest.unmock("jose");
jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("utils/rateLimit", () => ({ consume: jest.fn(), rateLimitKey: (...parts: string[]) => parts.join(":") }));
jest.mock("app/lib/live/classroom", () => ({
  ...jest.requireActual("app/lib/live/classroom"), liveService: jest.fn(),
}));

const service = { listRooms: jest.fn(), createRoom: jest.fn(), deleteRoom: jest.fn() };
const room = { sid: "RM_session_one", name: "reverse-flash-classroom", creationTime: BigInt(1700000000), numParticipants: 2,
  metadata: JSON.stringify({ title: "Design studio", startedAt: "2026-09-14T10:00:00.000Z" }) };
const originalEnv = { url: process.env.LIVEKIT_URL, key: process.env.LIVEKIT_API_KEY, secret: process.env.LIVEKIT_API_SECRET };
const post = (body: unknown, origin = "http://localhost:3000") => POST(new NextRequest("http://localhost:3000/api/live", {
  method: "POST", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify(body),
}));
const viewer = (role = "teacher", isAliased = false) => (auth as jest.Mock).mockResolvedValue({
  user: { id: "test-user", name: "Classroom Tester", role, isAliased, originalUser: isAliased ? { role: "teacher" } : undefined },
});

beforeEach(() => {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  jest.clearAllMocks();
  process.env.LIVEKIT_URL = "ws://127.0.0.1:7880";
  process.env.LIVEKIT_API_KEY = "test-key";
  process.env.LIVEKIT_API_SECRET = "test-secret-for-classroom-tokens-only";
  viewer();
  (consume as jest.Mock).mockResolvedValue({ allowed: true });
  (liveService as jest.Mock).mockReturnValue(service);
  service.listRooms.mockResolvedValue([room]);
  service.createRoom.mockResolvedValue(room);
  service.deleteRoom.mockResolvedValue(undefined);
});
afterAll(() => {
  for (const [key, value] of Object.entries({ LIVEKIT_URL: originalEnv.url, LIVEKIT_API_KEY: originalEnv.key, LIVEKIT_API_SECRET: originalEnv.secret })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

it("requires a signed-in LMS account for room discovery and joining", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect((await post({ action: "join", sessionId: room.sid })).status).toBe(401);
  expect(service.listRooms).not.toHaveBeenCalled();
});

it("gives each tab a different media identity, so the projector can join as the same teacher", async () => {
  const first = decodeJwt(await classroomToken(liveConfig()!, { id: "teacher" }, true));
  const second = decodeJwt(await classroomToken(liveConfig()!, { id: "teacher" }, true));
  expect(first.sub).not.toBe(second.sub);
});

it("reports the real session without returning credentials or participant details", async () => {
  const response = await GET();
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({ configured: true, session: {
    id: room.sid, title: "Design studio", startedAt: "2026-09-14T10:00:00.000Z", participants: 2,
  } });
});

it("shows an unconfigured lobby when the media service is not set up", async () => {
  delete process.env.LIVEKIT_API_SECRET;
  expect(await (await GET()).json()).toEqual({ configured: false, session: null });
  expect((await post({ action: "start", title: "Studio" })).status).toBe(503);
  expect(service.listRooms).not.toHaveBeenCalled();
});

it.each(["start", "end"])("rejects a student's %s action, including teacher preview mode", async (action) => {
  for (const aliased of [false, true]) {
    viewer("user", aliased);
    expect((await post({ action, title: "Studio", sessionId: room.sid })).status).toBe(403);
  }
  expect(service.createRoom).not.toHaveBeenCalled();
  expect(service.deleteRoom).not.toHaveBeenCalled();
});

it("rejects cross-origin requests and invalid session details before accessing the service", async () => {
  expect((await post({ action: "start", title: "Studio" }, "https://elsewhere.test")).status).toBe(403);
  expect((await post({ action: "start", title: "  " })).status).toBe(400);
  expect((await post({ action: "join" })).status).toBe(400);
  expect(service.listRooms).not.toHaveBeenCalled();
});

it("creates a teacher session and issues a short-lived token with screen sharing", async () => {
  service.listRooms.mockResolvedValue([]);
  const response = await post({ action: "start", title: "  Design studio  " });
  expect(response.status).toBe(200);
  expect(service.createRoom).toHaveBeenCalledWith(expect.objectContaining({ name: room.name, maxParticipants: 80 }));
  expect(JSON.parse(service.createRoom.mock.calls[0][0].metadata).title).toBe("Design studio");
  const result = await response.json();
  const claims = decodeJwt(result.token);
  expect(claims.video).toEqual(expect.objectContaining({ room: room.name, roomJoin: true, canPublishSources: ["camera", "microphone", "screen_share", "screen_share_audio"], canUpdateOwnMetadata: false }));
  expect(claims.exp! - claims.nbf!).toBeLessThanOrEqual(120);
  expect(JSON.parse(claims.metadata as string)).toEqual({ role: "teacher" });
  expect(result).not.toHaveProperty("secret");
  expect(result).not.toHaveProperty("key");
});

it("joins the existing room as co-teacher instead of replacing it", async () => {
  expect((await post({ action: "start", title: "Another title" })).status).toBe(200);
  expect(service.createRoom).not.toHaveBeenCalled();
});

it("allows a student to join with camera and mic, without host or screen-share grants", async () => {
  viewer("user");
  const response = await post({ action: "join", sessionId: room.sid });
  expect(response.status).toBe(200);
  const claims = decodeJwt((await response.json()).token);
  expect(claims.video).toEqual({ room: room.name, roomJoin: true, canSubscribe: true, canPublish: true, canPublishData: false, canUpdateOwnMetadata: false, canPublishSources: ["camera", "microphone"] });
  expect(JSON.parse(claims.metadata as string)).toEqual({ role: "student" });
});

it("refuses joins and end commands from stale tabs", async () => {
  for (const action of ["join", "end"]) expect((await post({ action, sessionId: "RM_old" })).status).toBe(409);
  service.listRooms.mockResolvedValue([]);
  expect((await post({ action: "join", sessionId: room.sid })).status).toBe(409);
  expect(service.deleteRoom).not.toHaveBeenCalled();
});

it("lets teachers end the room even when their joining rate limit is exhausted", async () => {
  (consume as jest.Mock).mockResolvedValue({ allowed: false });
  expect((await post({ action: "join", sessionId: room.sid })).status).toBe(429);
  expect((await post({ action: "end", sessionId: room.sid })).status).toBe(200);
  expect(service.deleteRoom).toHaveBeenCalledWith(room.name);
});

it("returns a useful failure without leaking service errors", async () => {
  service.listRooms.mockRejectedValueOnce(new Error("private-service-credentials"));
  const response = await GET();
  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain("private-service-credentials");
});
