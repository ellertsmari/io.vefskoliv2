import styled from "styled-components";

export const Container = styled.div`
  padding: 1rem;
`;

export const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2B5B76;
`;

export const CalendarContainer = styled.div`
  display: flex;
  justify-content: center;
  height: 600px;
  width: 100%;
`;

export const Button = styled.button`
  background-color: #3174ad;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background-color: #2a5885;
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
`;

export const ViewToggle = styled.div`
  display: flex;
  margin-left: 1rem;
`;