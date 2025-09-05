"use client"
import styled from "styled-components";
import Image from "next/image";

const BREAKPOINT = "680px";

export const Container = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    padding: 1rem;
    align-items: center;
`

export const Logo = styled(Image)`
    @media (max-width: ${BREAKPOINT}) {
    display: none;
  }
`

export const LogoSymbol = styled(Image)`
    display: block;

    @media (min-width: ${BREAKPOINT}) {
    display: none;
  }
`