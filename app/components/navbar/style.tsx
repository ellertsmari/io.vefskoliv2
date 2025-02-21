
'use client'
import profilePic from "../../../public/profilepic.svg"

import Image from "next/image";
import styled from "styled-components";

export const TopRightContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

export const ProfileContainer = styled.div`
  display: flex;
  align-items: end;
  gap: 20px; /* Space between text and profile picture */
  flex-direction: column;
  
`;

export const GreetingContainer = styled.div`
  display: flex;
  top: 85px;
  gap: 30px;
  position: absolute;
`;

export const GreetingsText = styled.h1`
color: var(--white, #FFF);
  text-align: right;
  font-family: Karma;
  font-size: 48px;
  font-style: normal;
  font-weight: 200;
  line-height: 118.826%;
  white-space: nowrap;
`

export const BoldText = styled.span`
  font-weight: 700; /*Bold weight*/
  line-height: 113.138%;
`;

export const ProfileImage = styled(Image).attrs({
  src: profilePic,
  width: 150,
  height: 150,
  alt: "Profile Picture",
  

})`
  border-radius: 50%;
  object-fit: cover;
`;



export const Nav = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;

    background: linear-gradient(to bottom,
      rgba(117, 43, 54, 1) 0%,
      rgba(219, 79, 99, 1) 31%,
      rgba(117, 43, 54, 1) 88%);
`