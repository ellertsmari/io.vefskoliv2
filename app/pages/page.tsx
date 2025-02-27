import frame1 from "../../public/Frame1.svg";
import Image from "next/image";
import "globalStyles/globals.css";
import Countdown from "components/countdown/countdown";
import { url } from "inspector";
import { BackgroundDiv } from "./style";

const Landingpage = () => {
  return (
    <>
      <BackgroundDiv>
        <Countdown></Countdown>
      </BackgroundDiv>
    </>
  );
};

export default Landingpage;
