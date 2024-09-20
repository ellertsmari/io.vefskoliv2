export const Arrow = ({
  color = "var(--theme-module3-100)",
  direction = "left",
}: {
  color?: string;
  direction?: "up" | "down" | "left" | "right";
}) => {
  let rotation = 0;
  switch (direction) {
    case "up":
      rotation = -90;
      break;
    case "down":
      rotation = 90;
      break;
    case "right":
      rotation = 180;
      break;
    case "left":
    default:
      rotation = 0;
      break;
  }
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 16 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M15.4457 23.5257C15.8152 23.2095 16 22.8351 16 22.4025C16 21.9708 15.8152 21.5968 15.4457 21.2806L4.61894 12.0158L15.4827 2.71937C15.8276 2.42424 16 2.05534 16 1.61265C16 1.16996 15.8152 0.790514 15.4457 0.474308C15.0762 0.158103 14.6387 0 14.1332 0C13.6287 0 13.1917 0.158103 12.8222 0.474308L0.406466 11.1304C0.25866 11.2569 0.153719 11.3939 0.0916405 11.5415C0.0305471 11.6891 9.53674e-07 11.8472 9.53674e-07 12.0158C9.53674e-07 12.1845 0.0305471 12.3426 0.0916405 12.4901C0.153719 12.6377 0.25866 12.7747 0.406466 12.9012L12.8591 23.5573C13.204 23.8524 13.6287 24 14.1332 24C14.6387 24 15.0762 23.8419 15.4457 23.5257Z"
        fill={color}
      />
    </svg>
  );
};
