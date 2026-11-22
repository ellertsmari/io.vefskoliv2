import type { PortfolioContent } from "types/portfolioTypes";
import { formatMonth } from "./formatMonth";
import {
  AboutHeadline,
  AboutTagline,
  Availability,
  AvailabilityDot,
  Headline,
  HeroLines,
  HeroName,
  HeroPhoto,
  HeroPhotoPlaceholder,
  HeroRow,
  HeroSection,
  HeroText,
  NameOutline,
  Tagline,
} from "./Style";

type Props = {
  profile: PortfolioContent["profile"];
  availability: PortfolioContent["availability"];
  showPhoto?: boolean;
};

export const Hero = ({ profile, availability, showPhoto = false }: Props) => {
  // The name is one field; only the last word is outlined when shown.
  const words = profile.name.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words.pop() : undefined;
  const headline = profile.headline.trim();
  const tagline = profile.tagline.trim();

  const badge = availability.openToInternships && (
    <Availability>
      <AvailabilityDot aria-hidden="true" />
      Open for work/internship → {formatMonth(availability.availableFrom)}
    </Availability>
  );

  return (
    <HeroSection $withPhoto={showPhoto}>
      <HeroText>
        <HeroName>
          {words.join(" ")}
          {lastWord && (
            <>
              {" "}
              <NameOutline>{lastWord}</NameOutline>
            </>
          )}
        </HeroName>
        {showPhoto ? (
          // About tab: the headline on its own line, then the badge and the tagline.
          <>
            {headline && <AboutHeadline>{headline}</AboutHeadline>}
            {(badge || tagline) && (
              <HeroRow>
                {badge}
                {tagline && <AboutTagline>{tagline}</AboutTagline>}
              </HeroRow>
            )}
          </>
        ) : (
          <>
            {(headline || tagline) && (
              <HeroLines>
                {headline && <Headline>{headline}</Headline>}
                {tagline && <Tagline>{tagline}</Tagline>}
              </HeroLines>
            )}
            {badge}
          </>
        )}
      </HeroText>
      {showPhoto &&
        (profile.photoUrl ? (
          <HeroPhoto>
            {/* eslint-disable-next-line @next/next/no-img-element -- students host photos anywhere */}
            <img src={profile.photoUrl} alt={profile.name} />
          </HeroPhoto>
        ) : (
          <HeroPhotoPlaceholder aria-hidden="true">[ Photo ]</HeroPhotoPlaceholder>
        ))}
    </HeroSection>
  );
};
