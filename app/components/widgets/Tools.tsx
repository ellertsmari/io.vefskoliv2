"use client";

import React from "react";
import { Container, Title, ContentBox, List, ListItem } from "app/components/widgets/toolsStyle";
import Image from "next/image";
import ReactIcon from "../../../public/icons/react.svg"; // Importing SVG icons
import NextJsIcon from "../../../public/icons/nextJs.svg"; // Importing SVG icons
import DesignSprintIcon from "../../../public/icons/designSprint.svg"; // Importing SVG icons
import DribbbleIcon from "../../../public/icons/dribbble.svg"; // Importing SVG icons

const Tools: React.FC = () => {
  return (
    <Container>
      <Title>Tools and Useful Websites</Title>
      <ContentBox>
        <List>
          <ListItem>
            <Image alt="icon" src={ReactIcon}/> {/* Using the ReactIcon component */}
            React Introduction
          </ListItem>
          <ListItem>
          <Image alt="icon" src={NextJsIcon}/> {/* Using the NextJsIcon component */}
            NextJs Introduction
          </ListItem>
          <ListItem>
          <Image alt="icon" src={DesignSprintIcon}/> {/* Using the DesignSprintIcon component */}
            Design Sprint Methodology
          </ListItem>
          <ListItem>
          <Image alt="icon" src={DribbbleIcon}/> {/* Using the DribbbleIcon component */}
            Dribbble
          </ListItem>
        </List>
      </ContentBox>
    </Container>
  );
};

export default Tools;


