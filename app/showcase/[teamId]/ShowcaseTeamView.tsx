"use client";
import { ShowcaseTeamDetail } from "types/groupTypes";
import { TEAM_LINK_LABELS } from "constants/groupWork";
import {
  Page,
  DetailTopBar,
  BackLink,
  Wordmark,
  DetailMain,
  DetailHeader,
  DetailLogo,
  DetailTitle,
  DetailTagline,
  LinkButtons,
  PrimaryLink,
  SecondaryLink,
  HeroImage,
  DetailSection,
  SectionHeading,
  Description,
  TeamPhotoImage,
  MemberChips,
  MemberChip,
  QuoteList,
  Quote,
  QuoteAttribution,
  ContextNote,
  Footer,
} from "../styles";

const formatMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

// The live site is the star; the other links are supporting material.
const SECONDARY_LINK_KEYS = ["github", "figma"] as const;

export const ShowcaseTeamView = ({
  detail,
}: {
  detail: ShowcaseTeamDetail;
}) => {
  const { team, project } = detail;

  return (
    <Page>
      <DetailTopBar>
        <BackLink href="/showcase">← All projects</BackLink>
        <Wordmark>Vefskólinn Showcase</Wordmark>
      </DetailTopBar>

      <DetailMain>
        <DetailHeader>
          {team.logo && <DetailLogo src={team.logo} alt="" />}
          <DetailTitle>{team.projectName}</DetailTitle>
          {team.tagline && <DetailTagline>{team.tagline}</DetailTagline>}
          <LinkButtons>
            {team.links.website && (
              <PrimaryLink
                href={team.links.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit the live site ↗
              </PrimaryLink>
            )}
            {SECONDARY_LINK_KEYS.filter((key) => team.links[key]).map((key) => (
              <SecondaryLink
                key={key}
                href={team.links[key]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {TEAM_LINK_LABELS[key]} ↗
              </SecondaryLink>
            ))}
          </LinkButtons>
        </DetailHeader>

        {team.coverImage && (
          <HeroImage src={team.coverImage} alt={`${team.projectName} screenshot`} />
        )}

        {team.projectDescription && (
          <DetailSection>
            <SectionHeading>About the project</SectionHeading>
            <Description>{team.projectDescription}</Description>
          </DetailSection>
        )}

        {team.quotes.length > 0 && (
          <DetailSection>
            <SectionHeading>What people said</SectionHeading>
            <QuoteList>
              {team.quotes.map((quote, index) => (
                <Quote key={index}>
                  “{quote.comment}”
                  <QuoteAttribution>— {quote.attribution}</QuoteAttribution>
                </Quote>
              ))}
            </QuoteList>
          </DetailSection>
        )}

        <DetailSection>
          <SectionHeading>The team — {team.name}</SectionHeading>
          {/* May be a photo of the team or another project image — teams who
              would rather not publish faces upload something else — so the alt
              text must not assert that there are people in it. */}
          {team.teamPhoto && (
            <TeamPhotoImage
              src={team.teamPhoto}
              alt={`Image chosen by ${team.name}`}
            />
          )}
          <MemberChips>
            {team.memberNames.map((name) => (
              <MemberChip key={name}>{name}</MemberChip>
            ))}
          </MemberChips>
        </DetailSection>

        <ContextNote>
          Built at Vefskólinn · {project.title} ·{" "}
          {formatMonthYear(project.endDate)}
        </ContextNote>
      </DetailMain>

      <Footer>
        More projects on the{" "}
        <BackLink href="/showcase">Vefskólinn student showcase</BackLink>
      </Footer>
    </Page>
  );
};
