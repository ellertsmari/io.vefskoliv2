import { auth } from "auth";
import { redirect } from "next/navigation";
import HomePageContent from "./HomePageContent";

const HomePage = async () => {
  const session = await auth();
  
  // If user is logged in, redirect to dashboard
  if (session?.user) {
    redirect("/LMS/dashboard");
  }
  
  // If not logged in, show the regular homepage content
  return <HomePageContent />;
}

export default HomePage;
