import { Container, Logo, LogoSymbol } from "./style";
import logoSvg from "../../assets/logo.svg"
import logoSymbolSvg from "../../assets/logoSymbol.svg"
import { Profile } from "../profile/profile";
import { auth } from "auth";

type Props = {
    showAvatar?:boolean
}

const TopBar = async ({showAvatar}:Props) => {
    const session = await auth();
    return (
        <Container>
            <Logo src={logoSvg} alt="logo"/>
            <LogoSymbol src={logoSymbolSvg} alt="logo symbol"/>
            {showAvatar ? <Profile session={session}/> : null}
        </Container>
     );
}
 
export default TopBar;