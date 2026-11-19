import type { PortfolioContent } from "types/portfolioTypes";
import { formatMonth } from "./formatMonth";
import {
  Availability,
  AvailabilityDot,
  Headline,
  HeroLines,
  HeroName,
  HeroSection,
  NameOutline,
  Tagline,
} from "./Style";

type Props = {
  profile: PortfolioContent["profile"];
  availability: PortfolioContent["availability"];
};

export const Hero = ({ profile, availability }: Props) => {
  // The name is one field; only the last word is outlined when shown.
  const words = profile.name.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words.pop() : undefined;
  const headline = profile.headline.trim();
  const tagline = profile.tagline.trim();

  return (
    <HeroSection>
      <HeroName>
        {words.join(" ")}
        {lastWord && (
          <>
            {" "}
            <NameOutline>{lastWord}</NameOutline>
          </>
        )}
      </HeroName>
      {(headline || tagline) && (
        <HeroLines>
          {headline && <Headline>{headline}</Headline>}
          {tagline && <Tagline>{tagline}</Tagline>}
        </HeroLines>
      )}
      {availability.openToInternships && (
        <Availability>
          <AvailabilityDot aria-hidden="true" />
          Open for work/internship → {formatMonth(availability.availableFrom)}
        </Availability>
      )}
    </HeroSection>
  );
};
