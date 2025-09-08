"use client"

import { Button } from "globalStyles/buttons/default/style"
import {Container, StyledImg, Wrapper} from "./style"
import { Heading2, Paragraph } from "globalStyles/text"

const HomePage = () => {
  return (
    <Wrapper>
      <StyledImg src="https://icons.veryicon.com/png/o/transport/traffic-icon/construction-5.png" alt="construction"/>
    <Container>
      <Heading2>The io.vefskoli.is is under construction...</Heading2>
      <Paragraph>Click the Log in button if you want to log in to LMS and resturn your projects</Paragraph>
      <a href="/signin">
      <Button style={{width:"128px"}}$styletype="default">LOG IN</Button>
      </a>
    </Container>
    </Wrapper>
    
  )
}

export default HomePage