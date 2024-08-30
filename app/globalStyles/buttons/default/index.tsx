"use client";

import { Button } from "./style";

type Props = {
  onClick?:
    | (() => void)
    | ((Event: React.MouseEvent<HTMLButtonElement>) => void);
  children: React.ReactNode;
  style: "default" | "outlined";
  disabled?: boolean;
};

const DefaultButton = ({ onClick, children, style, disabled }: Props) => {
  return (
    <Button onClick={onClick} styletype={style} disabled={disabled}>
      {children}
    </Button>
  );
};

export default DefaultButton;
