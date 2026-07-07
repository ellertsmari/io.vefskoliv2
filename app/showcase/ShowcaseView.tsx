"use client";
import { ShowcaseProject } from "types/groupTypes";
import {
  Page,
  Hero,
  HeroKicker,
  HeroTitle,
  HeroSubtitle,
  Content,
  ProjectSection,
  ProjectHeader,
  ModuleBadge,
  ProjectTitle,
  ProjectDates,
  TeamGrid,
  TeamCard,
  CardCover,
  CardCoverImage,
  CoverFallbackLetter,
  CardBody,
  CardTitleRow,
  CardLogo,
  CardTitle,
  CardTagline,
  CardMeta,
  CardCta,
  EmptyNote,
  Footer,
} from "./styles";

const formatMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

const memberSummary = (names: string[]) => {
  if (names.length === 0) return "";
  const firstNames = names.map((name) => name.split(" ")[0]);
  if (firstNames.length <= 3) return firstNames.join(", ");
  return `${firstNames.slice(0, 3).join(", ")} +${firstNames.length - 3}`;
};

export const ShowcaseView = ({
  projects,
}: {
  projects: ShowcaseProject[];
}) => (
  <Page>
    <Hero>
      <HeroKicker>Vefskólinn</HeroKicker>
      <HeroTitle>Student Showcase</HeroTitle>
      <HeroSubtitle>
        Real web applications — designed, built and shipped by student teams,
        from their first website to full-stack products.
      </HeroSubtitle>
    </Hero>

    <Content>
      {projects.length === 0 && (
        <EmptyNote>
          Nothing here yet — the first projects are on their way.
        </EmptyNote>
      )}

      {projects.map((project) => (
        <ProjectSection key={project._id}>
          <ProjectHeader>
            {project.module != null && (
              <ModuleBadge>Module {project.module}</ModuleBadge>
            )}
            <ProjectTitle>{project.title}</ProjectTitle>
            <ProjectDates>
              {formatMonthYear(project.startDate)} –{" "}
              {formatMonthYear(project.endDate)}
            </ProjectDates>
          </ProjectHeader>

          <TeamGrid>
            {project.teams.map((team) => (
              <TeamCard key={team._id} href={`/showcase/${team._id}`}>
                <CardCover>
                  {team.coverImage ? (
                    <CardCoverImage src={team.coverImage} alt="" />
                  ) : (
                    <CoverFallbackLetter aria-hidden>
                      {(team.projectName || team.name).charAt(0).toUpperCase()}
                    </CoverFallbackLetter>
                  )}
                </CardCover>
                <CardBody>
                  <CardTitleRow>
                    {team.logo && <CardLogo src={team.logo} alt="" />}
                    <CardTitle>{team.projectName}</CardTitle>
                  </CardTitleRow>
                  {team.tagline && <CardTagline>{team.tagline}</CardTagline>}
                  <CardMeta>
                    {memberSummary(team.memberNames)}
                    {team.memberNames.length > 0 && " · "}
                    <CardCta>View project →</CardCta>
                  </CardMeta>
                </CardBody>
              </TeamCard>
            ))}
          </TeamGrid>
        </ProjectSection>
      ))}
    </Content>

    <Footer>
      Built by the students of <a href="https://vefskolinn.is">Vefskólinn</a>,
      the Icelandic web development school.
    </Footer>
  </Page>
);
