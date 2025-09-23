import { auth } from "auth";
import { redirect } from "next/navigation";
import LandingPageContent from "./landingPage/LandingPageContent";
import { getGalleryItems } from "./serverActions/getGallery";

const HomePage = async () => {
  const session = await auth();
  
  // If user is logged in, redirect to dashboard
  if (session?.user) {
    redirect("/LMS/dashboard");
  }
  
  // If not logged in, show the regular homepage content
  const galleryItems = await getGalleryItems();

  return <LandingPageContent galleryItems={galleryItems} />;
}

export default HomePage;
