"use client";
import { motion } from "framer-motion";
import styled from "styled-components";

const SvgPath = styled.svg`
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: -1;

  @media screen and (min-width: 1540px) {
    width: 100%;
  }
`;

const AnimatedBackground = () => {
  return (
<div style= {{backgroundColor:"white"}}></div>
  );
};

export default AnimatedBackground;
