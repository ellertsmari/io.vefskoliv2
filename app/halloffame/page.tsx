import type { Metadata } from "next";
import { getAllGalleryItems } from "app/serverActions/getGallery";
import Gallery from "app/components/gallery/Gallery";
import { PageContainer, PageHeader, PageTitle, PageDescription } from "./styles";

export const metadata: Metadata = {
  title: "Hall of Fame | Vefskólinn LMS",
  description:
    "Exceptional student projects recommended by peers for their outstanding quality and creativity.",
};

export default async function HallOfFamePage() {
  const galleryItems = await getAllGalleryItems();

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Hall of Fame</PageTitle>
        <PageDescription>
          Exceptional student projects recommended by peers for their outstanding quality and creativity.
        </PageDescription>
      </PageHeader>
      <Gallery items={galleryItems} />
    </PageContainer>
  );
}
