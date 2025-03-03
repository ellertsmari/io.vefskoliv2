"use client";

import React from "react";
import { Container, Title, ContentBox, List, ListItem, Bg } from "app/components/tools/toolsStyle";
import Image from "next/image";
import ReactIcon from "../../../public/icons/react.svg"; // Importing SVG icons
import NextJsIcon from "../../../public/icons/nextJs.svg"; // Importing SVG icons
import DesignSprintIcon from "../../../public/icons/designSprint.svg"; // Importing SVG icons
import DribbbleIcon from "../../../public/icons/dribbble.svg"; // Importing SVG icons


const resources = [
  { title: "React Introduction", url: "https://react.dev", icon: ReactIcon },
  { title: "NextJs Introduction", url: "https://nextjs.org", icon: NextJsIcon },
  { title: "Design Sprint Methodology", url: "https://www.gv.com/sprint", icon: DesignSprintIcon },
  { title: "Dribbble", url: "https://dribbble.com", icon: DribbbleIcon },
];
const Tools: React.FC = () => {
  return (
    <Container>
      <Title>Tools and Useful Websites</Title>
      <ContentBox>
        <List>
        
          <ListItem>
           {resources.map((item, index) => (
            <ListItem key={index}>
              <Bg>
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
                <Image alt="icon" src={item.icon} width={18} height={18} />
                {item.title}
              </a>
              </Bg>
            </ListItem>
          ))}
          </ListItem>
        </List>
      </ContentBox>
    </Container>
  );
};

export default Tools;


