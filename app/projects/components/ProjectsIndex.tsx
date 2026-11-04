"use client";

import Link from "next/link";
import { CSSProperties } from "react";
import styled, { keyframes } from "styled-components";
import { BriefProject } from "types/groupTypes";
import { SITE_NAME } from "constants/site";

const rise = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: none; }
`;

const Page = styled.main`
  min-height: 100vh;
  background: #f5f2ec;
  color: #16151b;
  padding: clamp(1.5rem, 5vw, 4.5rem);
`;

const Head = styled.header`
  max-width: 82rem;
  margin: 0 auto clamp(2rem, 5vw, 3.5rem);

  a {
    color: inherit;
    font-size: 0.8rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
  }

  h1 {
    margin: 1.5rem 0 0.75rem;
    font-size: clamp(2.5rem, 7vw, 5.5rem);
    line-height: 0.98;
    letter-spacing: -0.025em;
    max-width: 14ch;
  }

  p {
    margin: 0;
    max-width: 52ch;
    font-size: 1.2rem;
    color: #5e5b66;
  }
`;

const Grid = styled.div`
  max-width: 82rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: 1.25rem;
`;

const Card = styled(Link)`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 22rem;
  border-radius: 1.25rem;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.6rem;
  text-decoration: none;
  background: var(--hero-bg);
  color: var(--hero-text);
  animation: ${rise} 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background: var(--cover) center / cover no-repeat;
    transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
        180deg,
        transparent 10%,
        color-mix(in srgb, var(--hero-bg) 92%, transparent) 75%
      ),
      radial-gradient(90% 70% at 90% 0%, color-mix(in srgb, var(--accent) 50%, transparent), transparent 65%);
  }

  &:hover {
    transform: translateY(-6px);
  }

  &:hover::before {
    transform: scale(1.06);
  }

  small {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.8;
  }

  h2 {
    margin: 0;
    font-family: var(--head), Georgia, serif;
    font-size: 2rem;
    line-height: 1.05;
  }

  p {
    margin: 0;
    opacity: 0.85;
    font-size: 0.98rem;
    line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

const Empty = styled.p`
  max-width: 82rem;
  margin: 0 auto;
  color: #5e5b66;
`;

const fontHref = (family: string) =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@700&display=swap`;

export const ProjectsIndex = ({ projects }: { projects: BriefProject[] }) => (
  <Page>
    {Array.from(new Set(projects.map((p) => p.brief.theme.headingFont))).map((family) => (
      <link key={family} rel="stylesheet" href={fontHref(family)} precedence="default" />
    ))}
    <Head>
      <Link href="/">{SITE_NAME}</Link>
      <h1>Group projects</h1>
      <p>
        Each module ends with a team building a real product: designed,
        coded, tested with users and presented to industry professionals.
        These are the briefs.
      </p>
    </Head>
    {projects.length === 0 ? (
      <Empty>The first briefs go up once teams are formed.</Empty>
    ) : (
      <Grid>
        {projects.map((project, index) => {
          const theme = project.brief.theme;
          return (
            <Card
              key={project._id}
              href={`/projects/${project.brief.slug}`}
              style={
                {
                  "--hero-bg": theme.heroBackground,
                  "--hero-text": theme.heroText,
                  "--accent": theme.accent,
                  "--head": `"${theme.headingFont}"`,
                  "--cover": project.brief.coverImage
                    ? `url(${JSON.stringify(project.brief.coverImage)})`
                    : "none",
                  animationDelay: `${index * 80}ms`,
                } as CSSProperties
              }
            >
              <small>
                {project.module ? `Module ${project.module} · ` : ""}
                {new Date(project.startDate).toLocaleDateString("en-GB", {
                  timeZone: "UTC",
                  month: "long",
                  year: "numeric",
                })}
              </small>
              <h2>{project.brief.title}</h2>
              <p>{project.brief.tagline}</p>
            </Card>
          );
        })}
      </Grid>
    )}
  </Page>
);
