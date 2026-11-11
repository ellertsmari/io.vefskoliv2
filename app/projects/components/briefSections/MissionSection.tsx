"use client";

import styled from "styled-components";
import { Icon } from "@iconify/react";
import { ResolvedBrief } from "constants/projectBrief";
import { rich } from "../Rich";
import { CardGrid, Card } from "./shared";

/* ------------------------------ Shared bits ------------------------------ */

const Lead = styled.p`
  margin: 0 0 clamp(1.5rem, 3vw, 2.25rem);
  font-family: var(--b-head);
  font-size: clamp(1.5rem, 3.2vw, 2.4rem);
  line-height: 1.2;
  letter-spacing: -0.01em;
  max-width: 28ch;
  text-wrap: balance;
`;

const Prose = styled.div`
  p {
    margin: 0 0 1rem;
  }
  a {
    color: var(--b-accent);
    text-underline-offset: 3px;
  }
  code {
    font-size: 0.9em;
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
    background: var(--b-soft);
  }
`;

/* -------------------------------- Mission -------------------------------- */

const MissionGrid = styled.div<{ $aside: boolean }>`
  display: grid;
  grid-template-columns: ${({ $aside }) => ($aside ? "minmax(0, 1.25fr) minmax(0, 1fr)" : "minmax(0, 46rem)")};
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
  margin-bottom: clamp(1.75rem, 4vw, 2.5rem);

  @container brief-body (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Aside = styled.aside`
  position: relative;
  padding: 1.4rem 1.5rem;
  border-radius: var(--radius-lg);
  background: var(--b-hero-bg);
  color: var(--b-hero-text);
  font-size: 0.97rem;
  line-height: 1.6;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: auto -30% -60% auto;
    width: 70%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(closest-side, color-mix(in srgb, var(--b-accent) 55%, transparent), transparent);
    pointer-events: none;
  }

  h3 {
    position: relative;
    margin: 0 0 0.6rem;
    font-family: var(--b-head);
    font-size: 1.2rem;
    line-height: 1.2;
  }

  p {
    position: relative;
    margin: 0;
    opacity: 0.92;
  }
`;

const Media = styled.figure`
  margin: 0 0 clamp(1.75rem, 4vw, 2.5rem);

  iframe,
  img,
  video {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 0;
    border-radius: var(--radius-lg);
    object-fit: cover;
    background: var(--b-soft);
  }

  figcaption {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: var(--b-muted);
  }
`;

export const MissionSection = ({ brief }: { brief: ResolvedBrief }) => {
  const { mission } = brief;
  return (
    <>
      <Lead data-animate="fade-up">{rich(mission.statement)}</Lead>
      <MissionGrid $aside={!!mission.aside}>
        <Prose data-animate="fade-up">
          {mission.paragraphs.map((text, index) => (
            <p key={index}>{rich(text)}</p>
          ))}
        </Prose>
        {mission.aside && (
          <Aside data-animate="slide-left">
            <h3>{mission.aside.title}</h3>
            <p>{rich(mission.aside.text)}</p>
          </Aside>
        )}
      </MissionGrid>
      {mission.media && (
        <Media data-animate="blur-in">
          {mission.media.type === "youtube" ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(mission.media.id)}`}
              title={mission.media.title}
              allow="accelerometer; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : mission.media.type === "video" ? (
            <>
              <video
                src={mission.media.src}
                poster={mission.media.poster}
                title={mission.media.title}
                aria-label={mission.media.title}
                controls
                playsInline
                preload="metadata"
              />
              {mission.media.caption && <figcaption>{mission.media.caption}</figcaption>}
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- any https host */}
              <img src={mission.media.src} alt={mission.media.alt} loading="lazy" />
              {mission.media.caption && <figcaption>{mission.media.caption}</figcaption>}
            </>
          )}
        </Media>
      )}
      <CardGrid data-stagger="80">
        {mission.goals.map((goal) => (
          <Card key={goal.title}>
            <Icon icon={goal.icon} aria-hidden />
            <h3>{goal.title}</h3>
            <p>{rich(goal.text)}</p>
          </Card>
        ))}
      </CardGrid>
    </>
  );
};
