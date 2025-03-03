import styled from 'styled-components';


export const Button86 = styled.button`
  all: unset;
  width: 100px;
  height: 30px;
  font-size: 16px;
  background: white;
  border: 1px solid #2B5B76;
  color: #2B5B76;
  cursor: pointer;
  z-index: 1;
  padding: 5px 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  margin-top: 10px;
  border-radius: 10px;
  transition: all 0.4s ease-in-out;

  &:hover {
    background: #2B5B76;
    color: white;
  }

  &:focus {
    background: #2B5B76;
    color: white;
  }

  @media (max-width: 500px) {
    width: 80px;
    height: 25px;
    font-size: 14px;
    padding: 4px 4px;
    flex-wrap: wrap;
  }
`;

export const GuideContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
`;
export const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 10px;
  border-radius: 5px;
  width: 100%;
  flex-wrap: wrap;
  gap: 10px; 

  @media (max-width: 500px) {
    padding: 5px;
    justify-content: flex-start; 
  }
`;
