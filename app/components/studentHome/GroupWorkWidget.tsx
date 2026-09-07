"use client";

import Link from "next/link";
import styled from "styled-components";
import type { GroupProjectListItem } from "types/groupTypes";
import { Widget } from "UIcomponents/widgetGrid/style";
import { WidgetHeading } from "UIcomponents/widgetGrid/WidgetHeading";
import { GroupWorkIcon } from "./icons";

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
`;

const RowText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

const RowTitle = styled.span`
  font-weight: 600;
  font-size: var(--text-sm);
`;

const RowDetail = styled.span<{ $urgent?: boolean }>`
  font-size: var(--text-sm);
  color: ${({ $urgent }) =>
    $urgent ? "var(--error-failure-100)" : "var(--primary-black-60)"};
  font-weight: ${({ $urgent }) => ($urgent ? 600 : 400)};
`;

const RowLink = styled(Link)`
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
  text-decoration: none;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);

  &:hover {
    border-color: var(--primary-black-100);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }
`;

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

type Item = {
  project: GroupProjectListItem;
  detail: string;
  urgent: boolean;
  cta: string;
};

/**
 * What each running group project wants from the student right now: one line
 * per project, the pending action first. A project asking nothing is left off,
 * so the widget only exists while there is something to say.
 */
export const groupWorkItems = (projects: GroupProjectListItem[]): Item[] =>
  projects
    .filter((project) => project.status !== "archived")
    .flatMap((project): Item[] => {
      if (project.teamsToScore > 0) {
        return [
          {
            project,
            urgent: true,
            detail: `Score the presentations — ${project.teamsToScore} team${
              project.teamsToScore === 1 ? "" : "s"
            } left`,
            cta: "Score now",
          },
        ];
      }
      if (project.peerEvalPending) {
        return [
          {
            project,
            urgent: true,
            detail: "Rate your teammates — not handed in yet",
            cta: "Rate now",
          },
        ];
      }
      if (project.status === "formation" && !project.hasPreferences) {
        return [
          {
            project,
            urgent: true,
            detail: "Fill in your preferences so your teachers can form teams",
            cta: "Fill in",
          },
        ];
      }
      const slot = project.myTeamId
        ? project.presentationSlots.find(
            (entry) => entry.team === project.myTeamId
          )
        : null;
      if (project.presentationDate && slot) {
        const when = new Date(project.presentationDate);
        if (when.getTime() > Date.now() - 24 * 60 * 60 * 1000) {
          return [
            {
              project,
              urgent: false,
              detail: `You present ${formatDay(project.presentationDate)} at ${slot.startTime}`,
              cta: "Open project",
            },
          ];
        }
      }
      return [];
    });

export const GroupWorkWidget = ({
  projects,
}: {
  projects: GroupProjectListItem[];
}) => {
  const items = groupWorkItems(projects);
  if (items.length === 0) return null;

  return (
    <Widget>
      <WidgetHeading
        title="Group Project"
        accent="rose"
        icon={<GroupWorkIcon />}
        help="Things your current group project needs from you. Evaluations stay open until your teachers close them, so do them while it is fresh."
      />
      <List>
        {items.map(({ project, detail, urgent, cta }) => (
          <Row key={project._id}>
            <RowText>
              <RowTitle>{project.title}</RowTitle>
              <RowDetail $urgent={urgent}>{detail}</RowDetail>
            </RowText>
            <RowLink href={`/LMS/groups/${project._id}`}>{cta} →</RowLink>
          </Row>
        ))}
      </List>
    </Widget>
  );
};
