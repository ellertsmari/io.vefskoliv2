"use client";
import styled from "styled-components";

export const GalleryItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: var(--radius-lg);
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
  background: var(--primary-black-5);
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
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0;
  line-height: 1.3;

  @media (min-width: 768px) {
    font-size: var(--text-xl);
  }
`;

export const GalleryItemStudent = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--theme-module3-100);
  margin: 0;
`;

export const GalleryItemDescription = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--primary-black-60);
  margin: 0;
  line-height: 1.5;
  flex: 1;
`;

export const GalleryTopicTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const GalleryTopicTag = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--primary-black-5);
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1.2;
`;

export const GalleryItemMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;

  span {
    font-family: "Source Sans 3", sans-serif;
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--primary-black-60);
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

export const GalleryActions = styled.div<{ $multiple: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  margin-top: 12px;
`;

export const GalleryActionLink = styled.a<{
  $primary: boolean;
  $multiple: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: ${({ $multiple }) => ($multiple ? "1 1 0" : "0 1 auto")};
  min-width: 0;
  min-height: 44px;
  padding: 10px 20px;
  border: 1px solid
    ${({ $primary }) =>
      $primary ? "var(--primary-black-100)" : "var(--primary-black-30)"};
  border-radius: var(--radius-lg);
  background: ${({ $primary }) =>
    $primary ? "var(--primary-black-100)" : "var(--primary-white)"};
  color:
    ${({ $primary }) =>
      $primary ? "var(--primary-white)" : "var(--primary-black-100)"};
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  svg {
    flex: none;
    margin-right: 8px;
  }

  &:hover {
    border-color: var(--primary-black-30);
    background: ${({ $primary }) =>
      $primary ? "var(--primary-white)" : "var(--primary-black-100)"};
    color: ${({ $primary }) =>
      $primary ? "var(--primary-black-100)" : "var(--primary-white)"};
  }

  &:focus-visible {
    outline: 3px solid var(--theme-module3-60);
    outline-offset: 2px;
  }
`;

/**
 * auto-fill rather than a hard 4-column cap, so the grid keeps adding columns
 * on a wide screen instead of leaving the right-hand side empty. The track
 * minimum is what decides the count; no breakpoints to keep in sync.
 */
export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  width: 100%;
  margin: 0;
`;

export const GallerySearch = styled.input`
  padding: 12px 16px 12px 38px;
  width: 100%;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-lg);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-base);

  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px var(--theme-module3-60);
  }
`;

export const SearchWrapper = styled.div`
  position: relative;
  max-width: 800px;
  margin-bottom: 24px;

  svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary-black-60);
    pointer-events: none;
  }
`;

export const FilterControls = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 960px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  }
`;

export const FilterSelect = styled.select`
  width: 100%;
  padding: 12px 44px 12px 14px;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-lg);
  background-color: var(--primary-white);
  /* Custom arrow lets us control exact right spacing across browsers. */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 12px 8px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-base);

  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px var(--theme-module3-60);
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
    font-size: var(--text-2xl);
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  p {
    font-family: "Source Sans 3", sans-serif;
    font-size: var(--text-base);
    margin: 0;
  }
`;

// Iframe preview for live websites (zoomed out view)
export const IframePreviewContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--primary-black-5);

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
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
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


export const GallerySort = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  label {
    flex-shrink: 0;
    font-family: "Source Sans 3", sans-serif;
    font-size: var(--text-base);
  }
`;

export const GalleryReset = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid rgba(120, 100, 220, 0.35);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 4px 16px rgba(80, 60, 160, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms ease, box-shadow 160ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 6px 20px rgba(80, 60, 160, 0.16);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 3px;
  }

  &:active {
    background: rgba(230, 225, 255, 0.8);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
