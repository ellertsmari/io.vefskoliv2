import { Container, Logo, LogoSymbol } from "./style";
import logoSvg from "../../../assets/logoFilled.svg"
import logoSymbolSvg from "../../../assets/logoSymbolFilled.svg"
import { Profile } from "../../user/profile/profile";
import { auth } from "auth";

type Props = {
    showAvatar?:boolean
}

const TopBar = async ({showAvatar}:Props) => {
    const session = showAvatar ? await auth() : null;
    return (
        <Container>
            <Logo src={logoSvg} alt="logo"/>
            <LogoSymbol src={logoSymbolSvg} alt="logo symbol"/>
            {showAvatar ? <Profile session={session}/> : null}
        </Container>
     );
}
 
export default TopBar;