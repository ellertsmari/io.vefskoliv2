"use client"
import styled from "styled-components"

export const MainContainer = styled.div`
 display: flex;
 flex-direction: column;
    gap: 21px;
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
gap: 34px;
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

export const Progress= styled.div<{ $value: number }>`
background-color: var(--main-Color);
width: ${({ $value }) => ($value+"%" )};
height:6px; 
border-color: var(--main-Color);
border-style: solid;
border-radius: 8px;
`
export const StyledProgress= styled.div`
width: 98px;
  height: 4px;
  border-radius: 3px;
  background-color: lightgray;
  display: flex;
align-items: center;
  `

export const StyleNameMod= styled.div`
font-family: "Poppins", sans-serif;
font-size: 12px; 
color: var(--main-Color);
font-weight: 1300;`
    

export const Grade= styled.div`
color: var(--main-Color);
font-size: 12px;`


export const ContainerBar= styled.div`
width: 90%;
display: flex;
justify-content: space-around;
`
