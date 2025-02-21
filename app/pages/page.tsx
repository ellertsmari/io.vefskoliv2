'use client'
import frame1 from "../../public/Frame1.svg"
import Image from "next/image";
import { MainContainer } from "./style";
const landingpage = () => {
  return ( 
    <MainContainer> 
      <div>sidebar</div>
    <div style={{backgroundColor: "white"}}>
      <Image alt="background" style={{width: "100%", height: "100%", objectFit: "cover"}} src={frame1}></Image>
      </div>
      </MainContainer>
 );
}

export default landingpage;

