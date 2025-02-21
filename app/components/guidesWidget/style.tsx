import styled from "styled-components";
import Image from "next/image";

export const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
`;

export const IconImage = styled(Image)`
  width: 50px;
  height: 50px;
`;

export const ModulesText1 = styled.h3`
  color: #7c2d38;
`;

export const ModulesText2 = styled.p`
  color: #c4abb0;
`;

export const GuidesContainer = styled.div`
  width: 1000px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0px 4px 32px -10px rgba(124, 68, 79, 0.5);
  margin: auto; // Margin on the container itself, not what's inside
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const GuidesBox = styled.div`
  display: flex;
  justify-content: space-between;
  color: black;
  font-size: small;
`;
