"use client";
import styled from "styled-components";
import Image from "next/image";
import Nav from "./Nav";
import Link from "next/link";

export const NavBackground = styled.div`
  padding: 86px 0;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  background: linear-gradient(180deg, #3c7d9c 0%, #2b5b76 100%);
`;

export const NavStyle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 100%;
`;
export const LinkStyle = styled(Link)<{ myLink?: string; pathName?: string }>`
  width: 100%;
  display: flex;

  color: ${(props) => (props.myLink === props.pathName ? "black" : "white")};
  background-color: ${(props) =>
    props.myLink === props.pathName ? "white" : ""};
  gap: 16px;
  text-decoration: none;
  transition: 0.2s;
  border-radius: 8px;
  padding: 24px 0;
  &: hover {
    color: black;
    background-color: white;
  }
`;

export const TextStyle = styled.p`
  font-family: Poppins;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;

export const Icon = styled(Image)<{ myLink?: string; pathName?: string }>`
  margin-left: 25%;
  height: 20px;
  width: 20px;

  filter: ${(props) =>
    props.myLink === props.pathName ? "brightness(0)" : "brightness(100)"};

  ${LinkStyle}:hover & {
    filter: brightness(0);
  }
`;

export const LogOutButton = styled(Image)`
  cursor: pointer;
`;
