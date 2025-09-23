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
import aboutVefskolinn from "./aboutVefskolinn";
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
    const wasScrolledPastHero = sessionStorage.getItem('scrolledPastHero') === 'true';
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
      sessionStorage.setItem('scrolledPastHero', scrolledPastHero.toString());
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

  // Redirect to a url
  const handleRedirect = (url: string) => {
    window.location.href = url;
  }

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
          <Logo onClick={() => {handleSmoothScroll("hero");}} src={logo} alt="Vefskólinn" />
          <NavBarButtons>
            <Button onClick={() => {handleSmoothScroll("about-us");}} $styletype="textButton">ABOUT US</Button>
            <Button onClick={() => {handleSmoothScroll("the-program");}} $styletype="textButton">THE PROGRAM</Button>
            <Button onClick={() => {handleSmoothScroll("gallery-of-projects");}} $styletype="textButton">GALLERY</Button>
            <Button onClick={() => {handleRedirect("/signin")}} $styletype="textButton">LOG IN</Button>
            <Button onClick={() => {handleRedirect("https://umsokn.inna.is/#!/login/id/1102/23560")}} $styletype="defaultWhite">APPLY</Button>
          </NavBarButtons>
          <MobileMenuButton onClick={toggleMobileMenu}>
            ☰
          </MobileMenuButton>
        </NavBar>
        <MobileMenu $isOpen={isMobileMenuOpen}>
          <MobileMenuCloseButton onClick={() => setIsMobileMenuOpen(false)}>
            ✕
          </MobileMenuCloseButton>
          <Button onClick={() => {handleSmoothScroll("about-us"); setIsMobileMenuOpen(false);}} $styletype="textButton">ABOUT US</Button>
          <Button onClick={() => {handleSmoothScroll("the-program"); setIsMobileMenuOpen(false);}} $styletype="textButton">THE PROGRAM</Button>
          <Button onClick={() => {handleSmoothScroll("gallery-of-projects"); setIsMobileMenuOpen(false);}} $styletype="textButton">GALLERY</Button>
          <Button onClick={() => {handleRedirect("/signin"); setIsMobileMenuOpen(false);}} $styletype="textButton">LOG IN</Button>
          <Button onClick={() => {handleRedirect("https://umsokn.inna.is/#!/login/id/1102/23560"); setIsMobileMenuOpen(false);}} $styletype="defaultWhite">APPLY</Button>
        </MobileMenu>
        <StyledVideo
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
        >
          <source
            src="/vefskolinn.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </StyledVideo>
        <VideoControlButton onClick={toggleVideo}>
          {isVideoPlaying ? '⏸️' : '▶️'}
        </VideoControlButton>
        <TitleContainer>
          <Title>WELCOME TO VEFSKÓLINN</Title>
          <Subtitle>WEB DEVELOPMENT SCHOOL IN ICELAND</Subtitle>
        </TitleContainer>
      </Hero>
      <Section id="about-us">
        <AboutUsText>
          <SectionTitle>ABOUT US</SectionTitle>
          <p>{aboutVefskolinn.aboutUs}</p>
        </AboutUsText>
        <AboutUsTeachers>
          <LandingPageTeachers image={smari} name="ELLERT SMÁRI KRISTBERGSSON" subject="PROGRAMMING TEACHER" alt="Smári The Programming Teacher" />
          <LandingPageTeachers image={jakub} name="JAKUB MIERZEJEK" subject="UI/UX TEACHER" alt="Jakub The Design Teacher" />
        </AboutUsTeachers>
      </Section>
      <Section id="the-program">
        <TheProgramText>
          <SectionTitle>THE PROGRAM</SectionTitle>
          <p>{aboutVefskolinn.theProgram}</p>
        </TheProgramText>
        <Button onClick={() => {handleRedirect("/guides")}} $styletype="default">CLICK HERE TO VIEW THE ASSIGNMENTS</Button>
      </Section>
      <Section id="gallery-of-projects">
        <SectionTitle>GALLERY OF PROJECTS</SectionTitle>
        <Gallery items={galleryItems} />
      </Section>
      <Footer>
        <FooterContent>
          <FooterText>
            <strong style={{ fontSize: '24px'}}>LOCATION</strong>
            <p>TÆKNISKÓLINN IN HAFNARFJÖRDUR</p>
            <p>FLATARHRAUN 12</p>
            <p>220, HAFNARFJÖRDUR</p>
          </FooterText>
          <FooterText>
            <strong style={{ fontSize: '24px'}}>CONTACT US</strong>
            <p>esm@tskoli.is</p>
            <p>jmi@tskoli.is</p>
          </FooterText>
          <FooterText>
            <strong style={{ fontSize: '24px'}}>FOLLOW US</strong>
            <FooterSocials>
              <Link href="https://www.instagram.com/vefskolinn/" target="_blank">
                <FooterSocialIcon src={instagram} alt="Instagram" />
              </Link>
              <Link href="https://www.facebook.com/vefskolinn/" target="_blank">
                <FooterSocialIcon src={facebook} alt="Facebook"/>
              </Link>
              <Link href="https://www.linkedin.com/company/vefskolinn/" target="_blank">
                <FooterSocialIcon src={twitter} alt="LinkedIn"/>
              </Link>
            </FooterSocials>
          </FooterText>
        </FooterContent>
        <FooterCopyright>
          <p>v3.0.0</p>
          <p>©2025 Vefskólinn</p>
        </FooterCopyright>
      </Footer>
    </>
  );
};

export default LandingPageContent;
