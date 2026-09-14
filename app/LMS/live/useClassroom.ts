"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState, Room, RoomEvent, Track, createLocalAudioTrack, createLocalVideoTrack,
  type LocalAudioTrack, type LocalVideoTrack,
} from "livekit-client";
import type { LiveConnection, LiveSession, LiveStatus } from "types/liveTypes";

export function mediaError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Permission was not granted. Allow access in your browser, then try again.";
  if (name === "NotFoundError") return "No device was found. Connect a camera or microphone and try again.";
  if (name === "NotReadableError") return "The device is busy. Close the other app using it and try again.";
  return "That connection didn't work. Check your device and try again.";
}

export default function useClassroom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [joined, setJoined] = useState<LiveSession | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [deviceBusy, setDeviceBusy] = useState("");
  const [previewVideo, setPreviewVideo] = useState<LocalVideoTrack | null>(null);
  const [previewAudio, setPreviewAudio] = useState<LocalAudioTrack | null>(null);
  const [revision, setRevision] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevice, setVideoDevice] = useState("");
  const [audioDevice, setAudioDevice] = useState("");
  const alive = useRef(false);
  const roomRef = useRef<Room | null>(null);
  const joinedRef = useRef<LiveSession | null>(null);
  const preview = useRef<{ video: LocalVideoTrack | null; audio: LocalAudioTrack | null }>({ video: null, audio: null });
  const leaving = useRef(false);
  const mediaPending = useRef(false);
  const actionPending = useRef(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/live", { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the classroom.");
      if (alive.current && !signal?.aborted) setStatus(data);
    } catch (error) {
      if (alive.current && !signal?.aborted) setError(error instanceof Error ? error.message : "Could not load the classroom.");
    }
  }, []);

  const loadDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const list = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    if (alive.current) setDevices(list);
  }, []);

  useEffect(() => {
    alive.current = true;
    const current = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 24 } },
    });
    roomRef.current = current;
    setRoom(current);
    const changed = () => { if (alive.current) setRevision((n) => n + 1); };
    const events = [
      RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected,
      RoomEvent.TrackSubscribed, RoomEvent.TrackUnsubscribed, RoomEvent.TrackMuted, RoomEvent.TrackUnmuted,
      RoomEvent.LocalTrackPublished, RoomEvent.LocalTrackUnpublished,
      RoomEvent.ActiveSpeakersChanged, RoomEvent.ConnectionStateChanged,
      RoomEvent.AudioPlaybackStatusChanged, RoomEvent.ConnectionQualityChanged,
    ];
    events.forEach((event) => current.on(event, changed));
    current.on(RoomEvent.Disconnected, () => {
      if (!alive.current) return;
      if (joinedRef.current && !leaving.current) setNotice("The session has ended or the connection was lost. You can join again when the classroom is available.");
      joinedRef.current = null;
      setJoined(null);
      changed();
      void refresh();
    });
    const controller = new AbortController();
    void refresh(controller.signal);
    void loadDevices();
    const interval = setInterval(() => {
      if (document.visibilityState !== "hidden") void refresh(controller.signal);
    }, 8000);
    navigator.mediaDevices?.addEventListener("devicechange", loadDevices);
    return () => {
      alive.current = false;
      controller.abort();
      clearInterval(interval);
      navigator.mediaDevices?.removeEventListener("devicechange", loadDevices);
      current.removeAllListeners();
      void current.disconnect(true);
      preview.current.video?.stop();
      preview.current.audio?.stop();
      preview.current = { video: null, audio: null };
      roomRef.current = null;
    };
  }, [refresh, loadDevices]);

  const toggleDevice = async (kind: "video" | "audio") => {
    if (mediaPending.current || actionPending.current) return;
    mediaPending.current = true;
    setDeviceBusy(kind);
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Media capture unavailable");
      const current = roomRef.current;
      if (joinedRef.current && current?.state === ConnectionState.Connected) {
        if (kind === "video") await current.localParticipant.setCameraEnabled(!current.localParticipant.isCameraEnabled, { deviceId: videoDevice || undefined });
        else await current.localParticipant.setMicrophoneEnabled(!current.localParticipant.isMicrophoneEnabled, { deviceId: audioDevice || undefined });
      } else if (preview.current[kind]) {
        preview.current[kind]?.stop();
        preview.current[kind] = null;
        if (kind === "video") setPreviewVideo(null); else setPreviewAudio(null);
      } else {
        const track = kind === "video"
          ? await createLocalVideoTrack({ deviceId: videoDevice || undefined, resolution: { width: 1280, height: 720, frameRate: 24 } })
          : await createLocalAudioTrack({ deviceId: audioDevice || undefined, echoCancellation: true, noiseSuppression: true });
        if (!alive.current || roomRef.current !== current) { track.stop(); return; }
        if (kind === "video") { preview.current.video = track as LocalVideoTrack; setPreviewVideo(track as LocalVideoTrack); }
        else { preview.current.audio = track as LocalAudioTrack; setPreviewAudio(track as LocalAudioTrack); }
      }
      await loadDevices();
    } catch (error) {
      if (alive.current) setError(mediaError(error));
    } finally {
      mediaPending.current = false;
      if (alive.current) { setDeviceBusy(""); setRevision((n) => n + 1); }
    }
  };

  const chooseDevice = async (kind: "video" | "audio", id: string) => {
    if (mediaPending.current || actionPending.current) return;
    mediaPending.current = true;
    setDeviceBusy(kind);
    setError("");
    try {
      const current = roomRef.current;
      const previewTrack = preview.current[kind];
      if (joinedRef.current && current) await current.switchActiveDevice(kind === "video" ? "videoinput" : "audioinput", id);
      else if (previewTrack) await previewTrack.restartTrack({ deviceId: id || undefined });
      if (!alive.current || roomRef.current !== current) { previewTrack?.stop(); return; }
      if (alive.current) {
        if (kind === "video") setVideoDevice(id); else setAudioDevice(id);
      }
    } catch (error) {
      if (alive.current) setError(mediaError(error));
    } finally {
      mediaPending.current = false;
      if (alive.current) setDeviceBusy("");
    }
  };

  const enter = async (action: "start" | "join", title: string) => {
    if (actionPending.current || mediaPending.current || !roomRef.current) return;
    actionPending.current = true;
    setBusy(action);
    setError("");
    setNotice("");
    leaving.current = false;
    const current = roomRef.current;
    try {
      const response = await fetch("/api/live", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "start" ? { action, title } : { action, sessionId: status?.session?.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join the session.");
      const connection = data as LiveConnection;
      if (!alive.current || roomRef.current !== current) return;
      await current.connect(connection.serverUrl, connection.token);
      if (!alive.current || roomRef.current !== current) { await current.disconnect(true); return; }
      joinedRef.current = connection.session;
      setJoined(connection.session);
      setStatus({ configured: true, session: connection.session });
      // Publish the exact tracks the user enabled in the lobby. No automatic
      // camera or microphone access, and no second capture stream.
      for (const kind of ["video", "audio"] as const) {
        const track = preview.current[kind];
        if (!track) continue;
        if (!alive.current || current.state !== ConnectionState.Connected) { track.stop(); continue; }
        try {
          await current.localParticipant.publishTrack(track, { source: kind === "video" ? Track.Source.Camera : Track.Source.Microphone });
        } catch {
          track.stop();
          if (alive.current) setError("Joined successfully, but a device could not be published. Try turning it on again.");
        }
        preview.current[kind] = null;
      }
      if (alive.current) { setPreviewVideo(null); setPreviewAudio(null); }
    } catch (error) {
      await current.disconnect(true);
      if (alive.current) setError(error instanceof Error ? error.message : "Could not join the session.");
    } finally {
      actionPending.current = false;
      if (alive.current) { setBusy(""); setRevision((n) => n + 1); void refresh(); }
    }
  };

  const shareScreen = async () => {
    const current = roomRef.current;
    if (!joinedRef.current || !current || mediaPending.current || actionPending.current) return;
    mediaPending.current = true;
    setDeviceBusy("screen");
    setError("");
    try {
      await current.localParticipant.setScreenShareEnabled(!current.localParticipant.isScreenShareEnabled, { audio: true });
    } catch (error) {
      if (alive.current) setError(mediaError(error));
    } finally {
      mediaPending.current = false;
      if (alive.current) { setDeviceBusy(""); setRevision((n) => n + 1); }
    }
  };

  const leave = async (end = false) => {
    if (actionPending.current || mediaPending.current) return;
    actionPending.current = true;
    setBusy(end ? "end" : "leave");
    setError("");
    try {
      if (end) {
        const response = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "end", sessionId: joinedRef.current?.id }) });
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not end the session."); }
      }
      leaving.current = true;
      await roomRef.current?.disconnect(true);
      joinedRef.current = null;
      if (alive.current) { setJoined(null); setNotice(end ? "Session ended. Thanks for teaching today." : "You left the classroom. You can rejoin while the session is live."); }
      void refresh();
    } catch (error) {
      if (alive.current) setError(error instanceof Error ? error.message : "Could not leave the session.");
    } finally {
      actionPending.current = false;
      if (alive.current) setBusy("");
    }
  };

  return {
    room, status, joined, error, notice, busy, deviceBusy, previewVideo, previewAudio, revision,
    devices, videoDevice, audioDevice, toggleDevice, chooseDevice, enter, shareScreen, leave,
    refresh, setError,
  };
}
