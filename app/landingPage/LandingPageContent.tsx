"use client";

import { Button } from "globalStyles/buttons/default/style";
import {
  StyledVideo,
  Section,
  Footer,
  Hero,
  NavBar,
  Logo,
  NavBarButtons,
  MobileMenuButton,
  MobileMenu,
  MobileMenuCloseButton,
  Title,
  TitleContainer,
  Subtitle,
  SectionTitle,
  VideoControlButton,
  AboutUsText,
  AboutUsTeachers,
  TheProgramText,
  FooterContent,
  FooterText,
  FooterCopyright,
  FooterSocials,
  FooterSocialIcon,
  ContentSection,
  SubsectionTitle,
  FactList,
  TextList,
  FaqList,
  TextLink,
} from "./style";
import LandingPageTeachers from "app/components/landingPageTeachers";
import { Gallery } from "app/components/gallery";
import type { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import logo from "app/assets/logoFilled.svg";
import smari from "app/assets/smari.png";
import jakub from "app/assets/jakub.png";
import instagram from "app/assets/icons/instagram.svg";
import facebook from "app/assets/icons/facebook.svg";
import twitter from "app/assets/icons/linkedin.svg";
import { useState, useEffect, useRef } from "react";
import {
  APPLY_URL,
  PROGRAMME_PAGE_URL,
  QUESTION_FORM_URL,
  ADDRESS,
  SOCIAL_LINKS,
  aboutUs,
  facts,
  theProgram,
  modules,
  howWeUseAI,
  howStudyingWorks,
  graduates,
  faq,
} from "./aboutVefskolinn";
import Link from "next/link";

// Landing page content
interface LandingPageContentProps {
  galleryItems?: GalleryItemType[];
}

const LandingPageContent = ({ galleryItems = [] }: LandingPageContentProps) => {
  // State variables
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if user was previously scrolled past hero (from sessionStorage)
  useEffect(() => {
    // Check if user was previously scrolled past hero (from sessionStorage)
    let wasScrolledPastHero = false;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.getItem === 'function') {
        wasScrolledPastHero = window.sessionStorage.getItem('scrolledPastHero') === 'true';
      }
    } catch (e) {
      console.error("Error reading sessionStorage", e);
    }

    if (wasScrolledPastHero) {
      setIsScrolled(true);
    }

    const handleScroll = () => {
      const heroHeight = window.innerHeight; // Hero section is 100vh
      const scrollPosition = window.scrollY;

      // Change navbar when scrolled past hero section
      const scrolledPastHero = scrollPosition > heroHeight * 0.9;
      setIsScrolled(scrolledPastHero);

      // Store in sessionStorage so it persists across page navigations and refreshes
      try {
        if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.setItem === 'function') {
          window.sessionStorage.setItem('scrolledPastHero', scrolledPastHero.toString());
        }
      } catch (e) {
        console.error("Error writing to sessionStorage", e);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  console.log(isScrolled);

  // Toggle the video play/pause
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Smooth scroll to a section
  const handleSmoothScroll = (sectiontId: string) => {
    const section = document.getElementById(sectiontId);
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  return (
    <>
      <Hero id="hero">
        <NavBar $isScrolled={isScrolled}>
          <Logo onClick={() => { handleSmoothScroll("hero"); }} src={logo} alt="Vefskólinn" />
          <NavBarButtons>
            <Button onClick={() => { handleSmoothScroll("about-us"); }} $styletype="textButton">ABOUT US</Button>
            <Button onClick={() => { handleSmoothScroll("the-program"); }} $styletype="textButton">THE PROGRAM</Button>
            <Button onClick={() => { handleSmoothScroll("gallery-of-projects"); }} $styletype="textButton">GALLERY</Button>
            <Button onClick={() => { handleSmoothScroll("faq"); }} $styletype="textButton">FAQ</Button>
            <Button as={Link} href="/signin" $styletype="textButton">LOG IN</Button>
            <Button as="a" href={APPLY_URL} $styletype="defaultWhite">APPLY</Button>
          </NavBarButtons>
          <MobileMenuButton onClick={toggleMobileMenu}>
            ☰
          </MobileMenuButton>
        </NavBar>
        <MobileMenu $isOpen={isMobileMenuOpen}>
          <MobileMenuCloseButton onClick={() => setIsMobileMenuOpen(false)}>
            ✕
          </MobileMenuCloseButton>
          <Button onClick={() => { handleSmoothScroll("about-us"); setIsMobileMenuOpen(false); }} $styletype="textButton">ABOUT US</Button>
          <Button onClick={() => { handleSmoothScroll("the-program"); setIsMobileMenuOpen(false); }} $styletype="textButton">THE PROGRAM</Button>
          <Button onClick={() => { handleSmoothScroll("gallery-of-projects"); setIsMobileMenuOpen(false); }} $styletype="textButton">GALLERY</Button>
          <Button onClick={() => { handleSmoothScroll("faq"); setIsMobileMenuOpen(false); }} $styletype="textButton">FAQ</Button>
          <Button as={Link} href="/signin" onClick={() => setIsMobileMenuOpen(false)} $styletype="textButton">LOG IN</Button>
          <Button as="a" href={APPLY_URL} onClick={() => setIsMobileMenuOpen(false)} $styletype="defaultWhite">APPLY</Button>
        </MobileMenu>
        <StyledVideo
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
        >
          {/* In Vercel Blob, not in /public: 12 MB of video does not belong in git. */}
          <source
            src="https://7ns219yf9xw5vgje.public.blob.vercel-storage.com/site/vefskolinn.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </StyledVideo>
        <VideoControlButton onClick={toggleVideo}>
          {isVideoPlaying ? '⏸️' : '▶️'}
        </VideoControlButton>
        <TitleContainer>
          <Title>WELCOME TO VEFSKÓLINN</Title>
          <Subtitle>AI-NATIVE WEB DEVELOPMENT SCHOOL IN ICELAND</Subtitle>
        </TitleContainer>
      </Hero>
      <Section id="about-us">
        <AboutUsText>
          <SectionTitle>ABOUT US</SectionTitle>
          {aboutUs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </AboutUsText>
        {/* The facts people (and AI assistants) ask about first. */}
        <FactList aria-label="Key facts">
          {facts.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </FactList>
        <AboutUsTeachers>
          <LandingPageTeachers image={smari} name="ELLERT SMÁRI KRISTBERGSSON" subject="PROGRAMMING TEACHER" alt="Smári The Programming Teacher" />
          <LandingPageTeachers image={jakub} name="JAKUB MIERZEJEK" subject="UI/UX TEACHER" alt="Jakub The Design Teacher" />
        </AboutUsTeachers>
      </Section>
      <Section id="the-program">
        <TheProgramText>
          <SectionTitle>THE PROGRAM</SectionTitle>
          <p>{theProgram}</p>
          <SubsectionTitle>The year, module by module</SubsectionTitle>
          <TextList>
            {modules.map(({ name, description }) => (
              <li key={name}>
                <strong>{name}:</strong> {description}
              </li>
            ))}
          </TextList>
        </TheProgramText>
        {/* A real link, not a button with a click handler: crawlers follow
            hrefs, and this is the landing page's only way into the guides. */}
        <Button as={Link} href="/guides" $styletype="default">CLICK HERE TO VIEW THE ASSIGNMENTS</Button>
      </Section>
      <ContentSection id="how-we-use-ai">
        <TheProgramText>
          <SectionTitle>HOW WE USE AI</SectionTitle>
          <p>{howWeUseAI.intro}</p>
          <TextList>
            {howWeUseAI.phases.map(({ name, description }) => (
              <li key={name}>
                <strong>{name}.</strong> {description}
              </li>
            ))}
          </TextList>
          <p><strong>{howWeUseAI.rule}</strong></p>
        </TheProgramText>
      </ContentSection>
      <ContentSection id="how-studying-works">
        <TheProgramText>
          <SectionTitle>HOW STUDYING HERE WORKS</SectionTitle>
          {howStudyingWorks.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </TheProgramText>
      </ContentSection>
      <ContentSection id="graduates">
        <TheProgramText>
          <SectionTitle>WHERE GRADUATES WORK</SectionTitle>
          <p>{graduates}</p>
        </TheProgramText>
      </ContentSection>
      <Section id="gallery-of-projects">
        <SectionTitle>GALLERY OF PROJECTS</SectionTitle>
        <Gallery items={galleryItems} />
      </Section>
      <ContentSection id="faq">
        <SectionTitle>FREQUENTLY ASKED QUESTIONS</SectionTitle>
        {/* <details> keeps the answers in the HTML, so crawlers read them
            even while they are folded away. */}
        <FaqList>
          {faq.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </FaqList>
        <TheProgramText>
          <p>
            Application dates are on the{" "}
            <TextLink href={PROGRAMME_PAGE_URL}>programme page at tskoli.is</TextLink>.
            Questions? <TextLink href={QUESTION_FORM_URL}>Ask through the form on tskoli.is</TextLink>.
          </p>
        </TheProgramText>
        <Button as="a" href={APPLY_URL} $styletype="default">APPLY</Button>
      </ContentSection>
      <Footer>
        <FooterContent>
          <FooterText>
            <strong style={{ fontSize: 'var(--text-2xl)' }}>LOCATION</strong>
            <p>TÆKNISKÓLINN IN {ADDRESS.locality.toUpperCase()}</p>
            <p>{ADDRESS.street.toUpperCase()}</p>
            <p>{ADDRESS.postalCode} {ADDRESS.locality.toUpperCase()}</p>
          </FooterText>
          <FooterText>
            <strong style={{ fontSize: 'var(--text-2xl)' }}>CONTACT US</strong>
            <p><TextLink href={QUESTION_FORM_URL}>Questions about the programme</TextLink></p>
            <p>esm@tskoli.is</p>
            <p>jmi@tskoli.is</p>
          </FooterText>
          <FooterText>
            <strong style={{ fontSize: 'var(--text-2xl)' }}>FOLLOW US</strong>
            <FooterSocials>
              <Link href={SOCIAL_LINKS.instagram} target="_blank">
                <FooterSocialIcon src={instagram} alt="Instagram" />
              </Link>
              <Link href={SOCIAL_LINKS.facebook} target="_blank">
                <FooterSocialIcon src={facebook} alt="Facebook" />
              </Link>
              <Link href={SOCIAL_LINKS.linkedin} target="_blank">
                <FooterSocialIcon src={twitter} alt="LinkedIn" />
              </Link>
            </FooterSocials>
          </FooterText>
        </FooterContent>
        <FooterCopyright>
          <p>v3.0.0</p>
          <p>©{new Date().getFullYear()} Vefskólinn</p>
        </FooterCopyright>
      </Footer>
    </>
  );
};

export default LandingPageContent;
