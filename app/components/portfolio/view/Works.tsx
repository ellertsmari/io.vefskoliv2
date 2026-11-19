import type { PortfolioProject } from "types/portfolioTypes";
import { ProjectCard } from "./ProjectCard";
import { WorksGrid, WorksHeading, WorksSection } from "./Style";

/* The builder allows up to six projects. Columns are picked so that no row
   is left half-empty: 2 and 4 projects make 2 columns, 3, 5 and 6 make 3,
   and a single project gets one wide card. */
const columnsFor = (count: number): 1 | 2 | 3 => {
  if (count === 1) return 1;
  if (count === 2 || count === 4) return 2;
  return 3;
};

type Props = {
  projects: PortfolioProject[];
};

export const Works = ({ projects }: Props) => {
  // A portfolio without projects shows no empty section.
  if (projects.length === 0) return null;

  return (
    <WorksSection aria-labelledby="works-heading">
      <WorksHeading id="works-heading">Projects I&apos;m proud of:</WorksHeading>
      <WorksGrid $columns={columnsFor(projects.length)}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </WorksGrid>
    </WorksSection>
  );
};
