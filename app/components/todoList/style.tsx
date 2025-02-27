import styled from "styled-components";

const BREAKPOINT = "680px";

export const MainText = styled.h1`
  @media (max-width: ${BREAKPOINT}) {
    font-size: 12px;
  }
  background-color: var(--main-Color);
  width: 307px;
  height: 42px;
  border-radius: 8px;
  color: white;
  text-align: left;
  display: flex;
  align-items: center;
  padding-left: 10px;
`;

export const MainContainer = styled.div`
  display: flex;
  flex-direction: column;`

export const EmptyText = styled.p`
  @media (max-width: ${BREAKPOINT}) {
    font-size: 10px;
  }
`;

export const PlaceholderTasks = styled.div`
  max-width: 307px;
  height: 241px;
  overflow: scroll;
  background-color: white;
  border: solid 1px var(--main-Lightblue);
  border-radius: 8px;
  overflow-x: hidden;
  scrollbar-color: var(--main-Lightblue) white;
  scrollbar-width: thin;
  padding: 12px;
`;

export const TodoText = styled.span`
  font-size: 12px;
  font-family: "Poppins", sans-serif;
  color: var(--main-Color);
  text-transform: capitalize;
  flex-grow: 1;
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.2s ease;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  display: block;
  max-width: 100%;
`;

export const Textwrapped = styled.input`
  max-width: 232px;
  height: 20px;
  background-color: white;
  border: solid 1px var(--main-Color);
  border-radius: 5px;
  width: 100%;
  padding: 6px;
  outline: none;

  &:focus {
    border-color: var(--main-Color); /* Change border color when focused */
  }
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

/* Style for all task */
export const TaskContainer = styled.div`
  display: flex;
  align-items: flex-start; /* Ensures everything is vertically aligned */
  gap: 2px;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease-in-out;
  position: relative;
  width: 100%;

  &:hover {
    background-color: var(--main-Lightblue);
  }

  &:hover input[type="checkbox"],
  &:hover button {
    opacity: 1;
  }
`;

export const HiddenTrashButton = styled.button`
  opacity: 0;
`;

/* hidden checkbox */
export const Checkbox = styled.input`
  width: 14px;
  height: 14px;
  border: 1px solid var(--main-Color);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  appearance: none; /* Prevents default browser styles */

  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  /* Make sure it does not disappear when checked */
  &:checked {
    /* background-color: var(--main-Lightblue); */
    background-color: 1px solid var(--main-Color);
  }

  &:checked::after {
    content: "✓";
    color: var(--main-Color);
    font-size: 12px;
    font-weight: bold;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;
/* style for trash icon  */
export const TrashButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  width: 18px; /* Ensure size does not change */
  height: 18px; /* Keep it from shifting */

  ${TaskContainer}:hover & {
    opacity: 1;
  }
`;

export const AddTaskContainer = styled.div`
  display: flex;
  gap: 10px;
`;

export const StyleList = styled.div`
 display: flex;
  gap: 4px;
  padding: 4px;`
