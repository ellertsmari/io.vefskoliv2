import type { CSSProperties } from "react";

export type IconName = "bolt" | "mic" | "micOff" | "camera" | "cameraOff" | "screen" | "users" | "arrow" | "leave" | "expand" | "link" | "check" | "volume" | "close";
const paths: Record<IconName, string> = {
  bolt: "m13 2-9 12h7l-1 8 10-12h-7l1-8Z",
  mic: "M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3Zm-7-5v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8",
  micOff: "m3 3 18 18M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 0v4M5 10v2a7 7 0 0 0 12 5M19 10v2M12 19v3M8 22h8",
  camera: "M14 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm2 4 6-4v12l-6-4",
  cameraOff: "m3 3 18 18M10 7h4a2 2 0 0 1 2 2v2l6-4v12l-3-2M16 15v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2",
  screen: "M4 3h16a2 2 0 0 1 2 2v12H2V5a2 2 0 0 1 2-2Zm4 18h8M12 17v4M12 13V7m-3 3 3-3 3 3",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8M22 21v-2a7 7 0 0 0-4-6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  leave: "M9 4H4v16h5M9 12h13m-4-4 4 4-4 4",
  expand: "M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5",
  link: "m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 9l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0",
  check: "m5 12 4 4L19 6",
  volume: "m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  close: "m6 6 12 12M6 18 18 6",
};
export default function LiveIcon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}
