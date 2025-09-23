import styled from "styled-components";
import Image from "next/image";

export const NavBar = styled.nav<{ $isScrolled?: boolean }>`
    display: flex;
    height: auto;
    width: calc(100% - 32px);
    align-items: center;
    justify-content: space-between;
    background-color: ${props => props.$isScrolled ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
    backdrop-filter: blur(10px);
    position: fixed;
    top: 16px;
    border-radius: 16px;
    border: 1px solid ${props => props.$isScrolled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
    z-index: 4;
    box-shadow: ${props => props.$isScrolled ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'};
    padding: 12px 16px;
    transition: all 0.3s ease-in-out;

    @media (min-width: 768px) {
        width: calc(100% - 64px);
        top: 32px;
        padding: 16px 32px;
    }
`

export const NavBarButtons = styled.div `
    display: none;
    gap: 16px;

    @media (min-width: 768px) {
        display: flex;
    }
`

export const MobileMenuButton = styled.button`
    display: block;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
    z-index: 8;

    @media (min-width: 768px) {
        display: none;
    }
`

export const MobileMenu = styled.div<{ $isOpen: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    z-index: 7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 32px;
    transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-100%)'};
    transition: transform 0.3s ease-in-out;

    @media (min-width: 768px) {
        display: none;
    }
`

export const MobileMenuCloseButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    color: white;
    font-size: 32px;
    cursor: pointer;
    padding: 8px;
    z-index: 8;

    @media (min-width: 768px) {
        display: none;
    }
`

export const Hero = styled.header `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: 16px;
    position: relative;

    @media (min-width: 768px) {
        padding: 32px;
    }
`
export const TitleContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: end;
    align-items: start;
    height: 100%;
    gap: 16px;
`
export const Title = styled.h1`
    font-family: "Sunflower", sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--primary-white);
    line-height: 1.2;

    @media (min-width: 480px) {
        font-size: 48px;
    }

    @media (min-width: 768px) {
        font-size: 64px;
    }
`
export const Subtitle = styled.h2`
    font-family: "Sunflower", sans-serif;
    font-size: 16px;
    font-weight: 300;
    color: var(--primary-white);
    margin-left: 0;
    line-height: 1.4;

    @media (min-width: 480px) {
        font-size: 20px;
        margin-left: 4px;
    }

    @media (min-width: 768px) {
        font-size: 24px;
        margin-left: 8px;
    }
`

export const SectionTitle = styled.h2`
    font-family: "Sunflower", sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--primary-black-100);
    text-align: center;
    margin-bottom: 16px;
    line-height: 1.2;

    @media (min-width: 480px) {
        font-size: 40px;
    }

    @media (min-width: 768px) {
        font-size: 48px;
    }

    @media (min-width: 1024px) {
        font-size: 64px;
    }
`

export const VideoControlButton = styled.button`
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    z-index: 3;

    @media (min-width: 768px) {
        bottom: 32px;
        right: 32px;
        width: 60px;
        height: 60px;
        font-size: 24px;
    }

    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
        border-color: rgba(255, 255, 255, 0.5);
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }
`

export const StyledVideo = styled.video`
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    filter: brightness(0.6);
`

export const Logo = styled(Image)`
    width: auto;
    height: 40px;
    filter: brightness(0) invert(1);
    cursor: pointer;

    @media (min-width: 768px) {
        height: 55px;
    }
`

export const Section = styled.section `
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;

    @media (min-width: 768px) {
        padding: 32px;
    }
`

export const AboutUsText = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 1100px;
    margin-bottom: 25px;
    line-height: 1.7;
    text-align: center;
    padding: 0 16px;

    p {
        font-size: 16px;
        line-height: 1.6;
    }

    @media (min-width: 768px) {
        padding: 0;
        text-align: left;

        p {
            font-size: 18px;
        }
    }
`

export const TheProgramText = styled(AboutUsText)`
    display: flex;
    flex-direction: column;
    max-width: 1100px;
    margin-bottom: 25px;
`

export const AboutUsTeachers = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px;
    align-items: center;
    justify-content: center;
    gap: 32px;
    width: 100%;
    max-width: 750px;

    @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
        gap: 0;
    }
`


export const Footer = styled.footer `
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 32px;
    padding: 32px 16px;

    @media (min-width: 768px) {
        gap: 48px;
        padding: 32px;
    }
`

export const FooterContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    gap: 32px;

    @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-evenly;
        gap: 0;
    }
`

export const FooterText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: center;

    @media (min-width: 768px) {
        text-align: left;
    }

    strong {
        font-size: 18px;

        @media (min-width: 768px) {
            font-size: 24px;
        }
    }

    p {
        font-size: 14px;

        @media (min-width: 768px) {
            font-size: 16px;
        }
    }
`

export const FooterSocials = styled.div`
    display: flex;
    gap: 16px;
    justify-content: center;

    @media (min-width: 768px) {
        justify-content: flex-start;
    }
`

export const FooterSocialIcon = styled(Image)`
    width: 20px;
    height: 20px;

    @media (min-width: 768px) {
        width: 24px;
        height: 24px;
    }
`

export const FooterCopyright = styled.div`
    font-size: 14px;
    font-weight: 400;
    color: var(--primary-black-100);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 8px;

    @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
        font-size: 16px;
        gap: 0;
    }
`