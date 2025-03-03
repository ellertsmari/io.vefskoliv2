import styled from "styled-components";

export const Container = styled.div`
  padding: 1rem;
  width: 90%;
  display: flex;
  flex-direction: column;
  
`;
export const MainContainer=styled.div `
display: flex;
justify-content: center;
`

export const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2B5B76;
`;

export const CalendarContainer = styled.div`
  height: 600px;
  width: 100%;
`;

export const Button = styled.button`
  background-color: #2a5885;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #356697;
  }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const Dialog = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
`;

export const DialogTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2B5B76;
`;

export const Form = styled.form`
  display: grid;
  gap: 1rem;
`;

export const FormGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  align-items: center;
  gap: 1rem;
`;

export const Label = styled.label`
  text-align: right;
  color: #2B5B76;
`;

export const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #2B5B76;
  border-radius: 4px;

  &:focus {
    outline: none;
  }
`;

export const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #2B5B76;
  border-radius: 4px;
  background-color: transparent;

  &:focus {
    outline: none;
  }
`;

export const DeleteButton = styled(Button)`
  background-color: #f44336;

  &:hover {
    background-color: #d32f2f;
  }
`;

export const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #2B5B76;
  align-content: center;
`;

export const NavigationButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #2B5B76;
`;

export const LeftNav = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;

`;

export const ViewToggle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  margin-left: 1rem;
`;




export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem;
  color: #2B5B76;
`;

export const LegendColor = styled.div<{ color: string }>`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  margin-right: 0.5rem;
`

export const ViewToggleButton = styled.button<{ $active: boolean }>`
  background-color: ${(props) => (props.$active ? "#2B5B76" : "white")};
  color: ${(props) => (props.$active ? "white" : "#2B5B76")};
  border: 1px solid #2B5B76;

  padding: 0.25rem 0.5rem;
  cursor: pointer;

  &:nth-child(2) {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }
  &:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }


  &:hover {
    background-color: ${(props) => (props.$active ? "#1d4f5d" : "#E8F1FC")};
    color: ${(props) => (props.$active ? "white" : "#2B5B76")};
  }
`
