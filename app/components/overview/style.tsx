import styled from "styled-components"

export const MainContainer = styled.div`
 display: flex;
 flex-direction: column;
    gap: 26px;
 `

export const Title = styled.div`
color: var(--main-Color);
` 

export const ModulesWrapper = styled.div`
border: 1px solid var(--main-Lightblue);
height: 499px;
width: 396px;
border-radius: 8px;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
`

export const GradeText= styled.div`
display: flex;
font-size: 12px;
color: var(--main-Color);

`

export const GradeContainer= styled.div`
display: flex; 
flex-direction: column;
align-items: center;`


export const ProgressBar= styled.div`
color: var(--main-Color);
font-size: 12px;
`
export const StyledProgress= styled.progress`
width: 98px;
  height: 4px;
  border-radius: 3px;
  background-color: lightgray;

  &::-webkit-progress-bar {
    background-color: lightgray;
    border-radius: 5px;
  }

  &::-webkit-progress-value {
    background-color: var(--main-Color);
    border-radius: 5px;
    border: 3px solid var(--main-Color)
  }

  &::-moz-progress-bar {
    background-color: var(--main-Color);
    border-radius: 3px;
  }
`;

export const StyleNameMod= styled.div`
font-size: 12px; 
color: var(--main-Color);`
    

export const Grade= styled.div`
color: var(--main-Color);
font-size: 12px;`


export const ContainerBar= styled.div`
gap: 26px
`
