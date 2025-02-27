"use client";

import styled from "styled-components";
import { CheckCircle } from "lucide-react"; // Example icon library
import { ReactIcon, NextJsIcon, DesignSprintIcon, DribbleIcon } from "./Icons";
import Image from "next/image";

export const Container = styled.div`
  padding: 0px;

  width: 307px;
  height: 202px;

  display: flex; /* Makes the Container a flex container */
  flex-direction: column; /* Organizes the items in a column */
  justify-content: center; /* Vertically centers the items */
  align-items: center; /* Horizontally centers the items */
  height: 100%; /* Ensures the Container takes up the full height */
`;

export const Title = styled.h2`
  background-color: #2b5b76;
  border-radius: 8px;
  color: #ffffff;
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
  border: 1px solid var(--main-Lightblue);
  background-color: #fefefe;
  padding: 10px 15px;
  list-style-type: none;
  border-radius: 8px;
  height: 202px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const ListItem = styled.div`
  display: flex;
  align-items: start;
  color: #2b5b76;
  font-size: 12px;
  flex-direction: column;

  gap: 10px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ContentBox = styled.div`
  width: 307px;
  border-radius: 8px;
  height: 202px;
`;

export const Bg = styled.div`
  transition: background-color 0.2s ease-in-out;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;

  &:hover {
    background-color: var(--main-Lightblue);
  }
`;
