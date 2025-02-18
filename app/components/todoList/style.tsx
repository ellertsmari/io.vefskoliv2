import styled from "styled-components";

export const Layout = styled.div`
  background-color: var(--main-Color);
  border-radius: 8px;
  font-size: 14px;
  color: white;
  height: 42px;
  padding: 12px;
`;

export const Placeholder = styled.div`
  max-width: 307px;
  height: 241px;
  overflow: scroll;
  background-color: white;
  border: solid 1px var(--main-Lightblue);
  border-radius: 8px;
`;

export const TodoText = styled.span`
  font-size: 18px;
  font-family: "Arial", sans-serif;
  font-weight: bold;
  color: #333;
  text-transform: capitalize;
  flex-grow: 1; /* Rozciąga tekst na całą szerokość */
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.2s ease;
`;

export const Textwrapped = styled.input`
  max-width: 232px;
  height: 20px;
  background-color: white;
  border: solid 1px var(--main-Color);
  border-radius: 8px;
  width: 100%;
`;

export const Button = styled.div`
  max-width: 66px;
  text-align: center;
  padding: 2px;
  width: 100%;
  height: 20px;
  font-size: 10px;
  background-color: white;
  color: var(--main-Color);
  border: solid 1px var(--main-Color);
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background-color: var(--main-Lightblue);
    color: var(--main-Color);
    border: none;
  }
`;

/* 🔹 Styl dla całego zadania */
export const TaskItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s ease-in-out;
  position: relative;

  &:hover {
    background-color: var(--main-Lightblue); /* Tło hover, jak w Figmie */
  }

  /* 🔹 Pokazuje checkbox i kosz tylko w hover */
  &:hover input[type="checkbox"], 
  &:hover button {
    opacity: 1;
  }
`;

/* 🔹 Ukryty checkbox - pojawia się tylko w hover */
export const HiddenCheckbox = styled.input`
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
`;

/* 🔹 Styl dla przycisku kosza */
export const TrashButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0; /* Ukryty */
  transition: opacity 0.2s ease-in-out;
`;