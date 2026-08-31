"use client";
import styled from "styled-components";
import Link from "next/link";

// The public showcase is a standalone page (no LMS chrome) that students
// link from portfolios and CVs — it leans on the brand indigo and aims for
// "proud to share" rather than "school admin tool".

export const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(1200px 400px at 80% -10%, var(--theme-module3-10) 0%, transparent 60%),
    radial-gradient(900px 400px at 0% 10%, var(--theme-module3-10) 0%, transparent 55%),
    var(--theme-module3-10);
  color: var(--primary-black-100);
`;

export const Hero = styled.header`
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--theme-module3-100) 0%, var(--theme-module3-hover) 55%, var(--theme-module3-hover) 100%);
  color: white;
  padding: 4.5rem 1.5rem 5rem;
  text-align: center;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    filter: blur(2px);
    background: rgba(255, 255, 255, 0.08);
  }
  &::before {
    width: 420px;
    height: 420px;
    top: -220px;
    left: -120px;
  }
  &::after {
    width: 320px;
    height: 320px;
    bottom: -180px;
    right: -80px;
  }
`;

export const HeroKicker = styled.p`
  margin: 0 0 0.75rem;
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--theme-module3-30);
`;

export const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
`;

export const HeroSubtitle = styled.p`
  margin: 1rem auto 0;
  max-width: 560px;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
`;

export const Content = styled.main`
  max-width: 1160px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
`;

export const ProjectSection = styled.section`
  margin-bottom: 4rem;
`;

export const ProjectHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

export const ModuleBadge = styled.span`
  background: var(--theme-module3-10);
  color: var(--theme-module3-100);
  border: 1px solid var(--theme-module3-30);
  border-radius: var(--radius-pill);
  padding: 0.25rem 0.75rem;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const ProjectTitle = styled.h2`
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
`;

export const ProjectDates = styled.span`
  color: var(--primary-black-60);
  font-size: var(--text-sm);
`;

export const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.75rem;
`;

export const TeamCard = styled(Link)`
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid var(--theme-module3-30);
  border-radius: var(--radius-xl);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 10px rgba(44, 43, 118, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 32px rgba(44, 43, 118, 0.14);
  }
`;

export const CardCover = styled.div`
  position: relative;
  height: 185px;
  background: linear-gradient(135deg, var(--theme-module3-10) 0%, var(--theme-module3-30) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

// Rendered as an <img> (not a CSS url()) so the untrusted stored value is
// escaped by React and never reaches the stylesheet.
export const CardCoverImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const CoverFallbackLetter = styled.span`
  font-size: var(--text-5xl);
  font-weight: 800;
  color: var(--theme-module3-60);
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.4rem 1.4rem;
  flex: 1;
`;

export const CardTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

export const CardLogo = styled.img`
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  object-fit: cover;
  flex-shrink: 0;
`;

export const CardTitle = styled.h3`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.01em;
`;

export const CardTagline = styled.p`
  margin: 0;
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--primary-black-60);
`;

export const CardMeta = styled.p`
  margin: auto 0 0;
  padding-top: 0.75rem;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const CardCta = styled.span`
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--theme-module3-100);
`;

export const EmptyNote = styled.p`
  text-align: center;
  color: var(--primary-black-60);
  padding: 4rem 0;
`;

// ── Year filter ──────────────────────────────────────────────────────────

export const YearNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 2rem;
`;

export const YearNavLabel = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-60);
  margin-right: 0.25rem;
`;

export const YearLink = styled.a<{ $active: boolean }>`
  padding: 0.35rem 0.9rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  text-decoration: none;
  border: 1px solid
    ${({ $active }) =>
      $active ? "var(--theme-module3-100)" : "var(--primary-black-10)"};
  background: ${({ $active }) =>
    $active ? "var(--theme-module3-100)" : "transparent"};
  color: ${({ $active }) =>
    $active ? "white" : "var(--primary-black-60)"};

  &:hover {
    border-color: var(--theme-module3-100);
    color: ${({ $active }) => ($active ? "white" : "var(--theme-module3-100)")};
  }
`;

export const Footer = styled.footer`
  text-align: center;
  padding: 2.5rem 1.5rem 3.5rem;
  color: var(--primary-black-60);
  font-size: var(--text-sm);

  a {
    color: var(--theme-module3-100);
    font-weight: 600;
    text-decoration: none;
  }
`;

// ── Team detail page ─────────────────────────────────────────────────────

export const DetailTopBar = styled.nav`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const BackLink = styled(Link)`
  color: var(--theme-module3-100);
  font-weight: 600;
  font-size: var(--text-base);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const Wordmark = styled.span`
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--primary-black-60);
  font-size: var(--text-sm);
  text-transform: uppercase;
`;

export const DetailMain = styled.main`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

export const DetailHeader = styled.header`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
`;

export const DetailLogo = styled.img`
  width: 76px;
  height: 76px;
  border-radius: var(--radius-xl);
  object-fit: cover;
  box-shadow: 0 8px 20px rgba(44, 43, 118, 0.18);
`;

export const DetailTitle = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
`;

export const DetailTagline = styled.p`
  margin: 0;
  max-width: 640px;
  font-size: clamp(1.05rem, 2.4vw, 1.3rem);
  line-height: 1.55;
  color: var(--primary-black-60);
`;

export const LinkButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
`;

export const PrimaryLink = styled.a`
  background: var(--theme-module3-100);
  color: white;
  border-radius: var(--radius-md);
  padding: 0.7rem 1.5rem;
  font-weight: 700;
  font-size: var(--text-base);
  text-decoration: none;
  box-shadow: 0 6px 16px rgba(101, 99, 235, 0.35);
  transition: background 0.15s ease;

  &:hover {
    background: var(--theme-module3-hover);
  }
`;

export const SecondaryLink = styled.a`
  background: white;
  color: var(--primary-black-100);
  border: 1px solid var(--theme-module3-30);
  border-radius: var(--radius-md);
  padding: 0.7rem 1.5rem;
  font-weight: 600;
  font-size: var(--text-base);
  text-decoration: none;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--theme-module3-100);
  }
`;

export const HeroImage = styled.img`
  width: 100%;
  border-radius: var(--radius-xl);
  border: 1px solid var(--theme-module3-30);
  box-shadow: 0 24px 60px rgba(44, 43, 118, 0.16);
`;

export const DetailSection = styled.section`
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
`;

export const SectionHeading = styled.h2`
  font-size: var(--text-xl);
  font-weight: 700;
  margin: 0 0 1rem;
  text-align: center;
`;

export const Description = styled.p`
  margin: 0;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--primary-black-60);
  white-space: pre-wrap;
`;

export const TeamPhotoImage = styled.img`
  width: 100%;
  border-radius: var(--radius-xl);
  border: 1px solid var(--theme-module3-30);
  box-shadow: 0 12px 32px rgba(44, 43, 118, 0.1);
  margin-bottom: 1rem;
`;

export const MemberChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

export const MemberChip = styled.span`
  background: var(--theme-module3-10);
  color: var(--theme-module3-hover);
  border-radius: var(--radius-pill);
  padding: 0.4rem 1rem;
  font-size: var(--text-sm);
  font-weight: 600;
`;

/**
 * A published quote. Only comments a team chose appear here, never scores, and
 * the attribution carries only as much of the writer's identity as they agreed
 * to (see getShowcase).
 */
export const QuoteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const Quote = styled.blockquote`
  margin: 0;
  padding: 0 0 0 1rem;
  border-left: 3px solid var(--primary-black-10);
  font-size: var(--text-base);
  line-height: 1.6;
`;

export const QuoteAttribution = styled.footer`
  margin-top: 0.4rem;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const ContextNote = styled.p`
  text-align: center;
  color: var(--primary-black-60);
  font-size: var(--text-sm);
  margin: 0;
`;
