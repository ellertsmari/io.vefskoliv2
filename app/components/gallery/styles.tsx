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

