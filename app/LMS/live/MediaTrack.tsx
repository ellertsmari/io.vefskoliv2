"use client";
import { useEffect, useRef, useState } from "react";
import { createAudioAnalyser, type Track, type LocalAudioTrack } from "livekit-client";

export function VideoTrack({ track, mirror = false, className }: { track: Track; mirror?: boolean; className?: string }) {
  const element = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = element.current;
    if (!video) return;
    track.attach(video);
    return () => { track.detach(video); };
  }, [track]);
  return <video ref={element} autoPlay playsInline muted className={className} style={mirror ? { transform: "scaleX(-1)" } : undefined} />;
}

export function AudioTrack({ track }: { track: Track }) {
  const element = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = element.current;
    if (!audio) return;
    track.attach(audio);
    return () => { track.detach(audio); };
  }, [track]);
  return <audio ref={element} autoPlay />;
}

export function MicrophoneLevel({ track }: { track: LocalAudioTrack | null }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!track) { setLevel(0); return; }
    const analyser = createAudioAnalyser(track);
    const timer = setInterval(() => setLevel(Math.min(1, analyser.calculateVolume() * 4)), 100);
    return () => { clearInterval(timer); void analyser.cleanup(); };
  }, [track]);
  return <span aria-label={track ? "Microphone level" : "Microphone muted"} style={{ display: "flex", gap: 3, alignItems: "center", height: 18 }}>
    {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ width: 3, height: 5 + (i % 4) * 3, borderRadius: 3, background: track && level > i / 12 ? "#d3ea52" : "#60625e", transition: "background 100ms" }} />)}
  </span>;
}
