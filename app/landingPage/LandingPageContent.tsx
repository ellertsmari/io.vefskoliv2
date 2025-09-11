"use client";

import { Button } from "globalStyles/buttons/default/style";
import { StyledVideo, Section, Footer, Hero, NavBar } from "./style";
import { Heading2, Paragraph } from "globalStyles/text";

const LandingPageContent = () => {
  return (
    <>
      <Hero>
        <NavBar>
          <Heading2>Vefskólinn</Heading2>
        </NavBar>
        <StyledVideo
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source
            src=""
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </StyledVideo>
      </Hero>
      <Section>ABOUT US</Section>
      <Section>THE PROGRAM</Section>
      <Section>GALLERY OF PROJECTS</Section>
      <Footer>FOOTER</Footer>
    </>
  );
};

export default LandingPageContent;