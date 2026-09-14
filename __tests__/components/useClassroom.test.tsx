import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { Room, RoomEvent, createLocalVideoTrack, createLocalAudioTrack, type LocalVideoTrack } from "livekit-client";
import useClassroom from "app/LMS/live/useClassroom";

jest.mock("livekit-client", () => {
  const actual = jest.requireActual("livekit-client");
  const { EventEmitter } = jest.requireActual("node:events");
  return {
    ...actual,
    createLocalVideoTrack: jest.fn(), createLocalAudioTrack: jest.fn(),
    Room: jest.fn().mockImplementation(() => {
      const room = new EventEmitter();
      room.state = "disconnected";
      room.connect = jest.fn(async () => { room.state = "connected"; });
      room.disconnect = jest.fn(async () => { room.state = "disconnected"; room.emit(actual.RoomEvent.Disconnected); });
      room.localParticipant = { publishTrack: jest.fn(), setCameraEnabled: jest.fn(), setMicrophoneEnabled: jest.fn(), setScreenShareEnabled: jest.fn(), isScreenShareEnabled: false };
      return room;
    }),
  };
});

const session = { id: "RM_test", title: "Design studio", participants: 1, startedAt: "2026-09-14T10:00:00.000Z" };
const latestRoom = () => (Room as unknown as jest.Mock).mock.results.at(-1)!.value;
const originalFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: jest.fn(), enumerateDevices: jest.fn(async () => []), addEventListener: jest.fn(), removeEventListener: jest.fn() } });
  global.fetch = jest.fn(async (_url, options) => ({ ok: true, json: async () => options?.method === "POST" ? { session, serverUrl: "ws://localhost:7880", token: "test-token" } : { configured: true, session } })) as jest.Mock;
});
afterEach(() => { cleanup(); global.fetch = originalFetch; });

it("loads the lobby without asking for a camera or microphone", async () => {
  const { result } = renderHook(useClassroom);
  await waitFor(() => expect(result.current.status?.session?.id).toBe(session.id));
  expect(createLocalVideoTrack).not.toHaveBeenCalled();
  expect(createLocalAudioTrack).not.toHaveBeenCalled();
  expect(latestRoom().connect).not.toHaveBeenCalled();
});

it("publishes the preview track the user enabled and releases the room on unmount", async () => {
  const track = { stop: jest.fn() } as unknown as LocalVideoTrack;
  (createLocalVideoTrack as jest.Mock).mockResolvedValue(track);
  const { result, unmount } = renderHook(useClassroom);
  await waitFor(() => expect(result.current.status).not.toBeNull());
  await act(async () => { await result.current.toggleDevice("video"); });
  expect(result.current.previewVideo).toBe(track);
  await act(async () => { await result.current.enter("join", ""); });
  expect(latestRoom().connect).toHaveBeenCalledWith("ws://localhost:7880", "test-token");
  expect(latestRoom().localParticipant.publishTrack).toHaveBeenCalledWith(track, { source: "camera" });
  expect(result.current.previewVideo).toBeNull();
  expect(result.current.joined?.id).toBe(session.id);
  expect(createLocalAudioTrack).not.toHaveBeenCalled();
  unmount();
  expect(latestRoom().disconnect).toHaveBeenCalledWith(true);
});

it("stops a preview that arrives after navigation away", async () => {
  let resolve!: (track: LocalVideoTrack) => void;
  (createLocalVideoTrack as jest.Mock).mockReturnValue(new Promise<LocalVideoTrack>((done) => { resolve = done; }));
  const track = { stop: jest.fn() } as unknown as LocalVideoTrack;
  const { result, unmount } = renderHook(useClassroom);
  await waitFor(() => expect(result.current.status).not.toBeNull());
  let pending!: Promise<void>;
  act(() => { pending = result.current.toggleDevice("video"); });
  unmount();
  await act(async () => { resolve(track); await pending; });
  expect(track.stop).toHaveBeenCalledTimes(1);
});

it("releases an enabled preview without joining", async () => {
  const track = { stop: jest.fn() } as unknown as LocalVideoTrack;
  (createLocalVideoTrack as jest.Mock).mockResolvedValue(track);
  const { result, unmount } = renderHook(useClassroom);
  await act(async () => { await result.current.toggleDevice("video"); });
  unmount();
  expect(track.stop).toHaveBeenCalledTimes(1);
});

it("releases a camera switch that completes after navigation away", async () => {
  let finish!: () => void;
  const track = { stop: jest.fn(), restartTrack: jest.fn(() => new Promise<void>((resolve) => { finish = resolve; })) };
  (createLocalVideoTrack as jest.Mock).mockResolvedValue(track);
  const { result, unmount } = renderHook(useClassroom);
  await act(async () => { await result.current.toggleDevice("video"); });
  let pending!: Promise<void>;
  act(() => { pending = result.current.chooseDevice("video", "second-camera"); });
  unmount();
  track.stop.mockClear();
  await act(async () => { finish(); await pending; });
  expect(track.stop).toHaveBeenCalledTimes(1);
});

it("recovers after a permission refusal and lets the user try again", async () => {
  const error = new Error("Blocked"); error.name = "NotAllowedError";
  (createLocalVideoTrack as jest.Mock).mockRejectedValueOnce(error).mockResolvedValueOnce({ stop: jest.fn() });
  const { result } = renderHook(useClassroom);
  await act(async () => { await result.current.toggleDevice("video"); });
  expect(result.current.error).toContain("Allow access in your browser");
  expect(result.current.deviceBusy).toBe("");
  await act(async () => { await result.current.toggleDevice("video"); });
  expect(result.current.previewVideo).not.toBeNull();
  expect(result.current.error).toBe("");
});

it("offers screen audio and resets the view when the host ends the session", async () => {
  const { result } = renderHook(useClassroom);
  await waitFor(() => expect(result.current.status).not.toBeNull());
  await act(async () => { await result.current.enter("join", ""); });
  await act(async () => { await result.current.shareScreen(); });
  expect(latestRoom().localParticipant.setScreenShareEnabled).toHaveBeenCalledWith(true, { audio: true });
  await act(async () => { latestRoom().emit(RoomEvent.Disconnected); });
  expect(result.current.joined).toBeNull();
  expect(result.current.notice).toContain("session has ended");
});

it("stays in the room when ending fails, then allows a normal leave", async () => {
  const { result } = renderHook(useClassroom);
  await waitFor(() => expect(result.current.status).not.toBeNull());
  await act(async () => { await result.current.enter("join", ""); });
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Try again shortly." }) });
  await act(async () => { await result.current.leave(true); });
  expect(result.current.joined).not.toBeNull();
  expect(result.current.error).toBe("Try again shortly.");
  await act(async () => { await result.current.leave(); });
  expect(result.current.joined).toBeNull();
  expect(latestRoom().disconnect).toHaveBeenCalledWith(true);
});
