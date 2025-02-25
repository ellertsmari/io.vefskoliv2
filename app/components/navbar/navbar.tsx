"use client" 
import { useState } from "react";

import Image from "next/image"
import { BoldText, GreetingContainer, GreetingsText, Nav, ProfileContainer, ProfileImage, TopRightContainer } from "./style"
import profilePic from "../../../public/profilepic.svg" 
import logo from "../../../public/logo.svg"
import cog from "../../../public/cog.svg"
import logout from "../../../public/logout.svg"


const Navbar = () => {
  
  return (
<>


<Nav>
         <Image height={200} width={200} src={logo} alt="Logo" className="logo"></Image>
        
        
       
        <ProfileContainer>
          <span></span>
        <TopRightContainer>
        <Image height={25} width={25} src={cog} alt="Settings" className="cog"></Image>
        <Image height={25} width={25} src={logout} alt="Logout" className="logout"></Image>
        </TopRightContainer>
        <GreetingContainer>
        
        <GreetingsText>

        Hi <BoldText>Alice</BoldText>,<br />
          Nice to see you here!
        </GreetingsText>

        <div className="relative">
          <ProfileImage src={profilePic} width={100} height={100} alt="Profile Pic" />
          
          </div>

         
         <span></span>
        </GreetingContainer>
       
        </ProfileContainer>
        </Nav>

        </>
  );
};  

export default Navbar 