"use client";

import type { PublicPortfolio } from "types/portfolioTypes";
import {
  Container,
  FooterBar,
  FooterBottom,
  FooterHeading,
  FooterLinks,
  FooterLink,
} from "./Style";

type Props = {
  portfolio: PublicPortfolio;
};

export const Footer = ({ portfolio }: Props) => {
  const { contact } = portfolio.content;
  // TODO: use portfolio.content.contact.cvUrl once it is added to the types (#16)
  const cvUrl = "#";

  return (
    <FooterBar id="contact">
      <Container>
        <FooterHeading>Let&apos;s build something together.</FooterHeading>
        <FooterLinks>
          {contact.email && (
            <FooterLink href={`mailto:${contact.email}`} $primary>
              E-MAIL
            </FooterLink>
          )}
          {contact.linkedinUrl && (
            <FooterLink href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </FooterLink>
          )}
          {contact.githubUrl && (
            <FooterLink href={contact.githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </FooterLink>
          )}
          {cvUrl && (
            <FooterLink href={cvUrl} target="_blank" rel="noopener noreferrer">
              CV
            </FooterLink>
          )}
        </FooterLinks>
        <FooterBottom>
          Portfolio made with Vefskólinn · {new Date().getFullYear()}
        </FooterBottom>
      </Container>
    </FooterBar>
  );
};
