import styled from "styled-components";


export const NavBar = styled.nav `
    display: flex;
    width: calc(100% - 64px);
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    position: fixed;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 2;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    top: 32px;
`
export const Hero = styled.header `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: 32px;
    position: relative;
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
`

export const Section = styled.section `
    display: flex;
    height: 100vh;
    width: 100%;
    align-items: center;
    justify-content: center;
`


export const Footer = styled.footer `
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
`
