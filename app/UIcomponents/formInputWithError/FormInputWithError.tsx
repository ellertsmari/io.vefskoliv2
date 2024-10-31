import Input, { ErrorMessage } from "globalStyles/input";

interface FormInputWithErrorProps {
  id: string;
  type: string;
  name: string;
  label: string;
  required: boolean;
  disabled: boolean;
  error?: string;
}

export const FormInputWithError = ({
  id,
  type,
  name,
  label,
  required,
  disabled,
  error,
}: FormInputWithErrorProps) => {
  return (
    <div>
      <Input
        id={id}
        type={type}
        name={name}
        label={label}
        required={required}
        disabled={disabled}
        aria-disabled={disabled}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
};
