import type { PortfolioProject } from "types/portfolioTypes";
import {
  GalleryActionLink,
  GalleryActions,
  GalleryItemContainer,
  GalleryItemContent,
  GalleryItemDescription,
  GalleryItemTitle,
  GalleryTopicMore,
  GalleryTopicPopover,
  GalleryTopicTag,
  GalleryTopicTags,
} from "app/components/gallery/styles";
import {
  DescriptionHover,
  DescriptionPopover,
  ProjectImage,
  ProjectPlaceholder,
} from "./Style";

// Same limit as the Gallery card.
const MAX_DESCRIPTION_LENGTH = 150;

// The Gallery shows 2; a portfolio card is wider, so it fits 3.
const MAX_VISIBLE_TECHNOLOGIES = 3;

/* Cuts at the last whole word before the limit, so no word is split. */
const shorten = (text: string): string =>
  `${text.slice(0, MAX_DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`;

type Props = {
  project: PortfolioProject;
};

/* Looks like the Gallery card, built from its styles, but shows only what a
   portfolio project has: no module, author or recommendation stars. */
export const ProjectCard = ({ project }: Props) => {
  const { title, description, imageUrl, technologies, liveUrl, githubUrl } = project;
  const hasBothLinks = Boolean(liveUrl && githubUrl);
  const isLong = description.length > MAX_DESCRIPTION_LENGTH;
  const visibleTechnologies = technologies.slice(0, MAX_VISIBLE_TECHNOLOGIES);
  const hiddenTechnologies = technologies.slice(MAX_VISIBLE_TECHNOLOGIES);

  return (
    <GalleryItemContainer>
      {imageUrl ? (
        <ProjectImage>
          {/* eslint-disable-next-line @next/next/no-img-element -- students host project images anywhere */}
          <img src={imageUrl} alt={`Screenshot of ${title}`} loading="lazy" />
        </ProjectImage>
      ) : (
        <ProjectPlaceholder aria-hidden="true">[ Project image ]</ProjectPlaceholder>
      )}
      <GalleryItemContent>
        <GalleryItemTitle>{title}</GalleryItemTitle>
        {isLong ? (
          // Like the "+N" tags in the Gallery: the full text pops up on hover,
          // on keyboard focus, or on tap on a phone.
          <DescriptionHover tabIndex={0}>
            {/* Screen readers skip the cut text and read the full one below. */}
            <GalleryItemDescription aria-hidden="true">
              {shorten(description)}
            </GalleryItemDescription>
            <DescriptionPopover>{description}</DescriptionPopover>
          </DescriptionHover>
        ) : (
          <GalleryItemDescription>{description}</GalleryItemDescription>
        )}
        {technologies.length > 0 && (
          <GalleryTopicTags aria-label="Technologies">
            {visibleTechnologies.map((tech) => (
              <GalleryTopicTag key={tech}>#{tech}</GalleryTopicTag>
            ))}
            {/* The rest hide behind "+N", as in the Gallery card. */}
            {hiddenTechnologies.length > 0 && (
              <GalleryTopicMore
                tabIndex={0}
                aria-label={`${hiddenTechnologies.length} more technologies: ${hiddenTechnologies.join(", ")}`}
              >
                +{hiddenTechnologies.length}
                <GalleryTopicPopover aria-hidden="true">
                  {hiddenTechnologies.map((tech) => (
                    <GalleryTopicTag key={tech}>#{tech}</GalleryTopicTag>
                  ))}
                </GalleryTopicPopover>
              </GalleryTopicMore>
            )}
          </GalleryTopicTags>
        )}
        {(liveUrl || githubUrl) && (
          <GalleryActions $multiple={hasBothLinks}>
            {liveUrl && (
              <GalleryActionLink
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                $primary
                $multiple={hasBothLinks}
              >
                ↗ Live page
              </GalleryActionLink>
            )}
            {githubUrl && (
              <GalleryActionLink
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                $primary={false}
                $multiple={hasBothLinks}
              >
                GitHub
              </GalleryActionLink>
            )}
          </GalleryActions>
        )}
      </GalleryItemContent>
    </GalleryItemContainer>
  );
};
