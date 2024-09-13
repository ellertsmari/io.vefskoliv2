import styled from "styled-components";
import Link from "next/link";

export const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--theme-module3-100);
  align-items: center;
  gap: 16px;
  width: 190px;
  height: 160px;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
`;

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding-top: 25px;
`;

export const GuideNr = styled.h2`
  font-size: 16px;
  font-weight: 600;
`;

export const Name = styled.p`
  font-size: 12px;
  width: 155px;
  text-align: center;
`;

export const StatusWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--theme-module3-100);
  width: 190px;
  height: 50px;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
`;

export const Status = styled.h3`
  font-size: 12px;
  padding: 10px;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  width: 100%;

  &:hover {
    background-color: var(--primary-black-10);
  }
`;

export const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  width: 100%;
  height: 100%;

  &:hover {
    background-color: var(--primary-black-10);
  }
`;
