import styled from "styled-components";

export const NotesContainer = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: bold;
  padding:50px;
`;

export const NotesHeading = styled.h1`
  font-size: 1.5rem;
  color: #000;
  padding-bottom: 10px;
`;

export const NotesBox = styled.div`
  width: 772px;
  height: 504px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0px 4px 32px -10px rgba(124, 68, 79, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const NotesTextarea = styled.textarea`
  width: 607px;
  height: 362px;
  border-radius: 16px;
  border: 1px solid #c4abb0;
  padding: 16px;
  font-size: 1rem;
  resize: vertical;
  outline: none;

`;
