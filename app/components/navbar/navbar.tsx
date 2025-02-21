
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
        <TopRightContainer>
        <Image height={25} width={25} src={cog} alt="Settings" className="cog"></Image>
        <Image height={25} width={25} src={logout} alt="Logout" className="logout"></Image>
        </TopRightContainer>
        <GreetingContainer>
        
        <GreetingsText>

        Hi <BoldText>Alice</BoldText>,<br />
          Nice to see you here!
        </GreetingsText>
          
          <ProfileImage src={profilePic} width={80} height={80} alt="Profile Pic" />
        </GreetingContainer>
       
        </ProfileContainer>
        </Nav>

        </>
  )
}  

export default Navbar 