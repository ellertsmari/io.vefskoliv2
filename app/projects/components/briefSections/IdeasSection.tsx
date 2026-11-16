"use client";

import { Icon } from "@iconify/react";
import { ResolvedBrief } from "constants/projectBrief";
import { rich } from "../Rich";
import { CardGrid, Card } from "./shared";

/* --------------------------------- Ideas --------------------------------- */

export const IdeasSection = ({ brief }: { brief: ResolvedBrief }) => (
  <>
    <CardGrid $min="15rem" data-stagger="80">
      {brief.ideas.map((idea) => (
        <Card key={idea.title}>
          <Icon icon={idea.icon} aria-hidden />
          <h3>{idea.title}</h3>
          <p>{rich(idea.text)}</p>
        </Card>
      ))}
    </CardGrid>
    {brief.ideasNote && (
      <p style={{ margin: "1.25rem 0 0", color: "var(--b-muted)" }} data-animate="fade-up">
        <Icon icon="mdi:lightbulb-on-outline" aria-hidden /> {rich(brief.ideasNote)}
      </p>
    )}
  </>
);
