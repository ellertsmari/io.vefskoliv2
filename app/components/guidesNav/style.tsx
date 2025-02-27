import styled from 'styled-components';

export const Button86 = styled.button`
  all: unset;
  width: 100px;
  height: 30px;
  font-size: 16px;
  background: transparent;
  border: none;
  position: relative;
  color: #f0f0f0;
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

  &::after,
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: -99999;
    transition: all 0.4s;
  }

  &::before {
    transform: translate(0%, 0%);
    width: 100%;
    height: 100%;
    background: #2B5B76;
    border-radius: 10px;
  }

  &::after {
    transform: translate(10px, 10px);
    width: 35px;
    height: 35px;
    background: #e8f1fc30;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border-radius: 50px;
  }

  &:hover::before {
    transform: translate(5%, 20%);
    width: 110%;
    height: 110%;
  }

  &:hover::after {
    border-radius: 10px;
    transform: translate(0, 0);
    width: 100%;
    height: 100%;
  }

  &:active::after {
    transition: 0s;
    transform: translate(0, 5%);
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
