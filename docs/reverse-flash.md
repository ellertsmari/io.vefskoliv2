# Reverse Flash classroom demo

Reverse Flash lives at **`/LMS/live`**, under **Live** in the LMS navigation. It uses the existing LMS accounts and LiveKit for real WebRTC audio, video, and screen sharing. The Next.js app authorizes access; media travels through the LiveKit server.

## Try the classroom

1. Sign in as a teacher, open **Live**, and enter a session title.
2. Optionally turn on your camera or microphone. The preview is private until you join; both devices start off.
3. Select **Start live session**. Signed-in students see the session appear in their lobby automatically, then select **Join live session**.
4. Use **Share screen** to select a screen, window, or browser tab. Where supported, the browser also offers presentation audio. The control changes to **Stop sharing**; the browser's own stop control works too.
5. Students can enable their own camera and microphone. A second teacher can join with the same host controls. Each tab gets a separate media identity, so opening the room again does not kick out the first tab.
6. For the classroom projector, join from the connected computer with its mic and camera off. Select the expand icon in the stage to display just the presentation full screen; press Escape to exit. Avoid playing the same room's audio through multiple nearby devices.
7. **Leave** disconnects only you. **End session for everyone** closes the room after confirmation. Devices stop when you leave or navigate away.

Use a separate browser profile/private window signed in as a student to test student permissions on one computer. Keep the second client's mic off to avoid feedback. All participant tiles, room counts, and live states come from the actual connection; there are no simulated attendees.

## Local video server

With Docker available, run:

```bash
docker run --detach --rm --name reverse-flash-livekit \
  --publish 127.0.0.1:7880:7880 \
  --publish 127.0.0.1:7881:7881 \
  --publish 127.0.0.1:7882:7882/udp \
  livekit/livekit-server:v1.13.5 \
  --dev --bind 0.0.0.0 --node-ip 127.0.0.1
```

Add the values from [`.env.live.example`](../.env.live.example) to your existing `.env.local`, then restart Next.js. Do not replace your existing database or authentication settings.

```bash
npm run dev
node scripts/check-livekit.mjs
```

The check creates and removes a separate temporary room and verifies a signed token. It does not interrupt an active lesson or test browser media capture.

This Docker configuration binds all ports to **localhost**. It supports tabs and browser profiles on the same computer, not classmates on other computers. It does not restart automatically after reboot. To stop it:

```bash
docker stop reverse-flash-livekit
```

Run the original `docker run` command again to start a fresh instance.

## Connect students on other computers

Use a hosted LiveKit server reachable by all participants, either your own deployment or LiveKit Cloud. Set `LIVEKIT_URL` to its **`wss://`** URL and provide its API key and secret on the LMS server. Serve the LMS over **HTTPS**, then rebuild/restart or redeploy it with those settings. A deployed LMS cannot use your laptop's localhost video server.

For self-hosting, configure TLS, the required media ports, and TURN according to the [LiveKit deployment guide](https://docs.livekit.io/transport/self-hosting/deployment/). The [local development guide](https://docs.livekit.io/transport/self-hosting/local/) explains the development credentials and server flags. These are service setup requirements, not changes to teachers' laptop network connections.

## Permissions and session behavior

- Only an authenticated, non-aliased teacher can start or end a session. Teacher preview mode receives student permissions.
- Teachers can publish camera, microphone, screen video, and screen audio. Students can publish camera and microphone. These restrictions are in the signed server grants, not only in the interface.
- Tokens expire for initial connection after two minutes. The SDK manages refreshes for connected participants. API secrets remain server-side.
- Join/end requests identify the current room SID, so a stale browser tab cannot end a newer session. One shared classroom is supported in this demo.
- Starting and joining are rate limited per LMS account. Ending an existing session is still available when the join rate limit is exhausted.
- Empty rooms expire after two minutes before anyone joins, or one minute after the last participant leaves. A teacher leaving does not close a room with students still in it; use **End session for everyone**.
- The classroom document enables camera, microphone, and display capture for its own origin. Live navigation uses a full page load so the browser receives that Permissions Policy; other pages keep their existing policy.

## Demo boundaries

This is an initial classroom implementation, not a tested replacement for Zoom. There is no recording, Google Drive upload, chat, hand raising, student screen presenting, waiting room, individual moderation, or multiple simultaneous classes yet. It has not been load-tested for a full class; the configured 80-person room cap is a limit, not a capacity guarantee.

LiveKit room-join tokens can auto-create a missing room. Closing a session disconnects current participants, but an already-issued token can be reused for its remaining short lifetime. Strong revocation and persistent session history should be added before a production rollout.

Screen/system audio depends on the browser and the selected source; a browser tab may offer audio where an entire desktop does not. On Linux, screen capture also depends on the browser's desktop portal support. Device permission refusal, unavailable media service, and reconnection are shown in the page. Controls stay visible below the stage, and leaving remains available during reconnection.

## Validation

```bash
npm test -- --runInBand __tests__/api/live.test.ts \
  __tests__/components/LiveClassroom.test.tsx \
  __tests__/components/useClassroom.test.tsx
NEXT_DIST_DIR=.next-verify npm run build
node scripts/check-livekit.mjs
```

The tests cover access control, signed publishing grants, stale sessions, teacher/student flows, private device previews, permission recovery, screen-share commands, and cleanup. Before classroom use, check two real browsers for audible speech, moving camera video, legible shared slides, stopping from both sharing controls, and ending the session for everyone. Repeat across two separate computers using the hosted service to assess your actual Wi-Fi and network conditions.
