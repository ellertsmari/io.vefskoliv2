import styled from "styled-components";

export const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

export const BackLink = styled.a`
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

export const FormHeader = styled.header`
  margin-bottom: 2rem;
`;

export const FormTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
`;

export const Form = styled.form`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const Section = styled.section`
  margin-bottom: 2rem;
  
  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

export const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

export const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
  }
`;

export const ArraySection = styled.section`
  margin-bottom: 2rem;
`;

export const ArrayItem = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  align-items: flex-start;
`;

export const RemoveButton = styled.button`
  padding: 0.75rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: #dc2626;
  }
`;

export const AddButton = styled.button`
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover {
    background: #059669;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

interface ButtonProps {
  $variant?: 'primary' | 'secondary';
}

export const Button = styled.button<ButtonProps>`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${props => props.$variant === 'primary' && `
    background: #3b82f6;
    color: white;

    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `}

  ${props => (!props.$variant || props.$variant === 'secondary') ? `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  ` : ''}
`;

export const MarkdownEditorWrapper = styled.div`
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  overflow: hidden;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .w-md-editor {
    border: none !important;
    box-shadow: none !important;
  }

  .w-md-editor-toolbar {
    border-bottom: 1px solid #e5e7eb !important;
    background: #f9fafb !important;
  }

  .w-md-editor-content {
    font-family: inherit;
  }
`;

export const MultiFieldItem = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
`;

export const MultiFieldRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  align-items: flex-start;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const MultiFieldGroup = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SmallLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

export const RemoveButtonSmall = styled.button`
  padding: 0.5rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  align-self: flex-end;

  &:hover {
    background: #dc2626;
  }
`;