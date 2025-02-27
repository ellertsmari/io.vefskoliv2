import { Button } from "globalStyles/buttons/default/style";
import { Wrapper } from "globalStyles/globalStyles";
import styled from "styled-components";

export const Main = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 32px;
`;

export const Side = styled.div`
  grid-area: side;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;
export const Footer = styled.div`
  grid-area: footer;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const MaterialsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 0.625rem;
  padding: 1rem;
`;

export const ReturnWrapper = styled.div`
  color: white;
  display: flex;
  justify-content: center;
  margin: auto;
`;

export const Requirements = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 3rem;
  padding: 16px;
  background-color: #e8f1fc;
  border-radius: 8px;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;
export const RequirementsWrapper = styled(Wrapper)`
  flex: 1;
`;

export const Content = styled.div`
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 8fr 3fr;

    grid-template-areas:
      " main side "
      " footer footer ";
    gap: 42px;
  }
`;

export const Container = styled(Wrapper)`
  padding: 2rem;
  gap: 2rem;
  border: 1px solid black;
  margin: 2rem 2rem;
  margin-left: 0.5rem;

  border-radius: 10px;
`;
