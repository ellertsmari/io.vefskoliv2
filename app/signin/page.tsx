import { LoginOrRegister } from "app/components/auth/loginOrRegister/LoginOrRegister";
import { auth } from "auth";

const SignIn = async () => {
    const session = await auth()
    return ( 
        <LoginOrRegister session={session}/>
     );
}
 
export default SignIn;