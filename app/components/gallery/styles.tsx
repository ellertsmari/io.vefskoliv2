"use client";
import styled from "styled-components";

export const GalleryItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

export const GalleryItemImage = styled.div`
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (min-width: 768px) {
    height: 240px;
  }
`;

export const GalleryItemContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

export const GalleryItemTitle = styled.h3`
  font-family: "Sunflower", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0;
  line-height: 1.3;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

export const GalleryItemStudent = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-blue-100);
  margin: 0;
`;

export const GalleryItemDescription = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--primary-black-80);
  margin: 0;
  line-height: 1.5;
  flex: 1;
`;

export const GalleryItemMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;

  span {
    font-family: "Source Sans 3", sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--primary-black-60);
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const GalleryEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--primary-black-60);

  h3 {
    font-family: "Sunflower", sans-serif;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  p {
    font-family: "Source Sans 3", sans-serif;
    font-size: 16px;
    margin: 0;
  }
`;

// Iframe preview for live websites (zoomed out view)
export const IframePreviewContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;

  iframe {
    width: 400%;
    height: 400%;
    transform: scale(0.25);
    transform-origin: top left;
    border: none;
    pointer-events: none;
  }

  @media (min-width: 768px) {
    height: 240px;
  }
`;

// Figma thumbnail preview
export const FigmaPreviewContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (min-width: 768px) {
    height: 240px;
  }
`;

// Overlay for preview badges
export const PreviewOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

// Badge to indicate preview type
export const PreviewBadge = styled.span<{ $type: 'figma' | 'website' }>`
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  background: ${({ $type }) =>
    $type === 'figma'
      ? 'linear-gradient(135deg, #f24e1e 0%, #a259ff 100%)'
      : 'linear-gradient(135deg, #059669 0%, #34d399 100%)'
  };
`;

