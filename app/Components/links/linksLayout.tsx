'use client';

import { LinksBox, LinksContainer, LinksHeading, LinksGroup, GitHubIcon, SlackIcon, FigmaIcon, LinkedInIcon } from "./linksStyle";
import Link1 from "../../assets/links/1Link.svg"
import Link2 from "../../assets/links/2Link.svg"
import Link3 from "../../assets/links/3Link.svg"
import Link4 from "../../assets/links/4Link.svg"
import Image from "next/image";

const Links = () => {
  return (
    <LinksBox>
      <LinksContainer>
        <LinksHeading>Personal links</LinksHeading>
        <LinksGroup>

          <GitHubIcon>
            <Image alt="GitHub" src={Link1} />
          </GitHubIcon>

          <SlackIcon>
            <Image alt="Slack" src={Link2} />
          </SlackIcon>

          <FigmaIcon>
            <Image alt="Figma" src={Link3} />
          </FigmaIcon>

          <LinkedInIcon>
            <Image alt="LinkedIn" src={Link4} />
          </LinkedInIcon>

        </LinksGroup>
      </LinksContainer>
    </LinksBox>
  );
};

export default Links;