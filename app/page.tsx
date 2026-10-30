import type { Metadata } from "next";
import { auth } from "auth";
import { redirect } from "next/navigation";
import LandingPageContent from "./landingPage/LandingPageContent";
import { getGalleryItems } from "./serverActions/getGallery";
import {
  PROGRAMME_NAME,
  PROGRAMME_NAME_EN,
  SCHOOL_NAME,
  SITE_NAME,
} from "constants/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} · ${PROGRAMME_NAME} · ${SCHOOL_NAME}`,
  description: `${SITE_NAME} (${PROGRAMME_NAME}, the ${PROGRAMME_NAME_EN}) teaches web development and UI/UX design at ${SCHOOL_NAME}: HTML, CSS, JavaScript, React and TypeScript through hands-on projects.`,
  alternates: { canonical: "/" },
};

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
