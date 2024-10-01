import { NotificationIcon } from "../../assets/NotificationIcon";
import { NotificationIconContainer, Option, ToggleContainer } from "./style";

export type ToggleOption = [
  name: string,
  onClick: () => void,
  notification?: boolean
];

export const Toggle = ({
  currentSelection,
  options,
}: {
  currentSelection: string;
  options: ToggleOption[];
}) => {
  const currentSelectionIndex = options.findIndex(
    ([name]) => name === currentSelection
  );

  return (
    <ToggleContainer>
      {options.map(([name, onClick, notification], index) => (
        <Option
          key={index}
          onClick={onClick}
          selected={index === currentSelectionIndex}
          role="button"
          aria-disabled={index === currentSelectionIndex}
          aria-label={`Select ${name}`}
        >
          {notification && (
            <NotificationIconContainer
              aria-label={`Notification icon for ${name}`}
            >
              <NotificationIcon />
            </NotificationIconContainer>
          )}
          {name.toUpperCase()}
        </Option>
      ))}
    </ToggleContainer>
  );
};
