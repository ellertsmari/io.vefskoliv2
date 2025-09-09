import { LoginOrRegister } from "app/components/auth/loginOrRegister/LoginOrRegister";
import { auth } from "auth";
import { redirect } from "next/navigation";

const SignIn = async () => {
    const session = await auth();
    
    // If user is already signed in, redirect to dashboard
    if (session?.user) {
        redirect("/LMS/dashboard");
    }
    
    return ( 
        <LoginOrRegister session={session}/>
     );
}
 
export default SignIn;