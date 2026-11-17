import type { PortfolioContent } from "types/portfolioTypes";
import { Headline, HeroLines, HeroName, HeroSection, NameOutline, Tagline} from "./Style";

type Props = {
  profile: PortfolioContent["profile"];
};

export const Hero = ({ profile }: Props) => {
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
    </HeroSection>
  );
};