import type { Metadata } from "next";
import { LoginOrRegister } from "app/components/auth/loginOrRegister/LoginOrRegister";
import { auth } from "auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In | Vefskólinn LMS",
};

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