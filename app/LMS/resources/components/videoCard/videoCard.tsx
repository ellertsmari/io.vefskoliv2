"use client";
import { FaPlay } from "react-icons/fa";
import {
  CardContainer,
  ThumbnailArea,
  PlayIconWrapper,
  CardContent,
  CardTitle,
  CardMeta,
  DurationBadge,
  ModuleBadge,
} from "./style";

type Props = {
  link: string;
  title: string;
  date?: string;
  duration?: number; // in minutes
};

// Color schemes for different modules
const moduleColors: Record<string, { gradient: string; badge: string }> = {
  "1": { gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", badge: "#7c3aed" }, // Purple
  "2": { gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)", badge: "#0891b2" }, // Cyan
  "3": { gradient: "linear-gradient(135deg, #059669 0%, #34d399 100%)", badge: "#059669" }, // Green
  "4": { gradient: "linear-gradient(135deg, #dc2626 0%, #f87171 100%)", badge: "#dc2626" }, // Red
  "5": { gradient: "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)", badge: "#ea580c" }, // Orange
  "6": { gradient: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)", badge: "#0284c7" }, // Blue
  default: { gradient: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)", badge: "#1e3a5f" }, // Default blue
};

const getModuleFromTitle = (title: string): string | null => {
  const match = title.match(/Module\s*(\d+)/i);
  return match ? match[1] : null;
};

const getColorScheme = (title: string) => {
  const module = getModuleFromTitle(title);
  if (module && moduleColors[module]) {
    return { ...moduleColors[module], module };
  }
  return { ...moduleColors.default, module: null };
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDuration = (minutes?: number) => {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const VideoCard = ({ link, title, date, duration }: Props) => {
  const { gradient, badge, module } = getColorScheme(title);

  return (
    <CardContainer href={link} target="_blank" rel="noopener noreferrer">
      <ThumbnailArea style={{ background: gradient }}>
        {module && <ModuleBadge style={{ background: badge }}>M{module}</ModuleBadge>}
        <PlayIconWrapper>
          <FaPlay size={24} />
        </PlayIconWrapper>
        {duration && <DurationBadge>{formatDuration(duration)}</DurationBadge>}
      </ThumbnailArea>
      <CardContent>
        <CardTitle>{title}</CardTitle>
        {date && <CardMeta>{formatDate(date)}</CardMeta>}
      </CardContent>
    </CardContainer>
  );
};

export default VideoCard;
