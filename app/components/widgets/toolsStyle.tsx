"use client";

import styled from "styled-components";
import { CheckCircle } from "lucide-react"; // Example icon library 
import { ReactIcon, NextJsIcon, DesignSprintIcon, DribbleIcon } from "./Icons";
import Image from "next/image";

export const Container = styled.div`
  
  padding: 0px;
  
  width: 307px;
  height: 202px;
  margin: 20px 0;
  margin-bottom: 20px;
    
  display: flex; /* Makes the Container a flex container */
  flex-direction: column; /* Organizes the items in a column */
  justify-content: center; /* Vertically centers the items */
  align-items: center; /* Horizontally centers the items */
  height: 100%; /* Ensures the Container takes up the full height */
`;

export const Title = styled.h2`
  background-color: #2b5b76;
  border-radius: 8px;
  color: #E8F1FC;
  font-weight: normal;
  font-size: 14px;
  text-align: left;
  height: 42px;
  width: 307px;

  display: flex; /* Make Title a flex container */
  align-items: center; /* Vertically center the content */
  padding-left: 10px; /* Small space from the left */
`;

export const List = styled.ul`
border: 1px solid #E8F1FC;
  background-color: #fefefe;
  border-radius: 8px;
  padding: 10px 15px;
  list-style-type: none;
  border-radius: 8px;
`;

export const ListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 20px; /* Space between icon and text */
  color: #2b5b76;
  font-size: 12px;
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

// Styled icon for list items
export const Icon = styled(CheckCircle)`
  color: #2b5b76;
  width: 22px;
  height: 22px;
`;

export const ContentBox = styled.div`
  width:307px;
  border-radius: 8px;
 `;