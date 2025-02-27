'use server'
import GuidesWidget from "./guides-test/page";
import frame1 from "../../public/Frame1.svg"
import Image from "next/image";

const landingpage = () => {
  return (


    <div style={{ gridArea: "main", backgroundColor: "white", minHeight: "100vh" }}>
      <Image alt="background" style={{width: "100%", height: "100%", objectFit: "cover"}} src={frame1}></Image>
      <GuidesWidget></GuidesWidget>
    </div>

 );

}

export default landingpage;
