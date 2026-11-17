import type { PortfolioProject } from "types/portfolioTypes";
import { ProjectCard } from "./ProjectCard";
import { WorksGrid, WorksHeading, WorksSection } from "./Style";

type Props = {
  projects: PortfolioProject[];
};

export const Works = ({ projects }: Props) => {
  // A portfolio without projects shows no empty section.
  if (projects.length === 0) return null;

  return (
    <WorksSection aria-labelledby="works-heading">
      <WorksHeading id="works-heading">Projects I&apos;m proud of:</WorksHeading>
      <WorksGrid>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </WorksGrid>
    </WorksSection>
  );
};
