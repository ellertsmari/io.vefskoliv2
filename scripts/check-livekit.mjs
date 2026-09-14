import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { AccessToken, RoomServiceClient, TokenVerifier, TrackSource } from "livekit-server-sdk";

config({ path: ".env.local", quiet: true });
const { LIVEKIT_URL: url, LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret } = process.env;
if (!url || !key || !secret) throw new Error("Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET first.");
const client = new RoomServiceClient(url.replace(/^ws/, "http"), key, secret);
// A separate temporary room: this never ends or modifies an actual lesson.
const name = "reverse-flash-check-" + randomUUID();
let created = false;
try {
  const room = await client.createRoom({ name, emptyTimeout: 30, maxParticipants: 2 });
  created = true;
  const rooms = await client.listRooms([name]);
  if (rooms[0]?.sid !== room.sid) throw new Error("Created room was not discoverable.");
  const token = new AccessToken(key, secret, { identity: "connection-check", ttl: "2m" });
  token.addGrant({ roomJoin: true, room: name, canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE] });
  const claims = await new TokenVerifier(key, secret).verify(await token.toJwt());
  if (claims.video?.room !== name) throw new Error("Token verification failed.");
  await client.deleteRoom(name);
  created = false;
  if ((await client.listRooms([name])).length) throw new Error("Room was not deleted.");
  console.log("LiveKit OK: room creation, discovery, signed tokens, and deletion.");
  console.log("This checks the control connection. Camera, microphone, and screen sharing need two browser clients.");
} finally {
  if (created) await client.deleteRoom(name).catch(() => {});
}
