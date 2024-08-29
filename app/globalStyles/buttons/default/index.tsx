"use client";

import { Button } from "./style";

type Props = {
  onClick?:
    | (() => void)
    | ((Event: React.MouseEvent<HTMLButtonElement>) => void);
  children: React.ReactNode;
  style: "default" | "outlined";
};

const DefaultButton = ({ onClick, children, style }: Props) => {
  return (
    <Button onClick={onClick} styletype={style}>
      {children}
    </Button>
  );
};

export default DefaultButton;
