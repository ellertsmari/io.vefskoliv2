import styled from "styled-components";

export const DayWrapper = styled.div`
background-color: var(--main-Color);
  border-radius: 8px;
  font-size: 14px;
  color: white;
  height: 42px;
  padding: 12px;
  width: 190px;
  display:flex ;
  justify-content: center;
  gap: 10px;
  align-items: center;
  font-weight: bold;
  `


export const PlanWrapper = styled.div`
   background-color: var(--main-Lightblue);
  border-radius: 8px;
  min-height: 56px; 
  width: 188px;
  padding: 12px;
  display: flex;
  flex-direction: column; 
  align-items: center; 
  word-wrap: break-word; 
  overflow-wrap: break-word;
  white-space: normal; 
  color: black;
`
  
export const Wrapper = styled.div` 
  max-width: 307px;
  height: 241px;
  overflow: scroll;
  background-color: white;
  border: solid 1px var(--main-Lightblue);
  border-radius: 8px;
  scrollbar-color: var(--main-Lightblue) white;
  scrollbar-width: thin;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  `

export const CircleArrowRight = styled.button`
background: white;
border: 2px solid var(--main-Color);
border-radius: 50%;
/* width: 40px; */
/* height: 40px; */
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
/* transition: all 0.2s ease-in-out; */

&:hover {
  background-color: var(--main-Lightblue);
}

svg {
  color: var(--main-Color);
}
`;

export const Header= styled.div`
display: flex;
justify-content: center;
gap: 12px;  
align-items: center;
`

export const MainFrame = styled.div`
  display: flex;
  flex-direction: column;
  gap: 21px;
  max-width: 307px;`

  export const NavigationContainer = styled.button`
    display: flex;
  align-items: center;
  justify-content: center;
  color: #2B5B76;
  align-content: center;
  background-color: white;
  border: none;
  cursor: pointer;
`

export const EventsContainer= styled.div`
display: flex;
gap:16px;
flex-direction: column;`

export const TitleParagraph= styled.div`
font-size: 14px;`

export const Time= styled.div`
font-size: 12px;
color: var(--main-Color);`

export const Title= styled.div`
color: var(--main-Color)`