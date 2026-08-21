import styled from "styled-components";

export const FormContainer = styled.div`
  max-width: 800px;
  margin: 0;
  padding: 2rem;
`;

export const BackLink = styled.a`
  display: inline-block;
  margin-bottom: 1.5rem;
  color: var(--theme-module3-100);
  text-decoration: none;
  font-size: var(--text-sm);
  
  &:hover {
    text-decoration: underline;
  }
`;

export const FormHeader = styled.header`
  margin-bottom: 2rem;
`;

export const FormTitle = styled.h1`
  font-size: var(--text-3xl);
  font-weight: bold;
  color: var(--primary-black-100);
  margin: 0;
`;

export const Form = styled.form`
  background: white;
  border-radius: var(--radius-lg);
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
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--primary-black-10);
`;

export const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

export const Label = styled.label`
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--primary-black-60);
  margin-bottom: 0.5rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  
  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: var(--primary-black-5);
    color: var(--primary-black-60);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: white;
  
  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: var(--primary-black-5);
    color: var(--primary-black-60);
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
  background: var(--error-failure-100);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: var(--error-failure-100);
  }
`;

export const AddButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--error-success-100);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  
  &:hover {
    background: var(--error-success-100);
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--primary-black-10);
`;

interface ButtonProps {
  $variant?: 'primary' | 'secondary';
}

export const Button = styled.button<ButtonProps>`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${props => props.$variant === 'primary' && `
    background: var(--theme-module3-100);
    color: white;

    &:hover:not(:disabled) {
      background: var(--theme-module3-100);
    }
  `}

  ${props => (!props.$variant || props.$variant === 'secondary') ? `
    background: var(--primary-black-5);
    color: var(--primary-black-60);
    border: 1px solid var(--primary-black-30);

    &:hover:not(:disabled) {
      background: var(--primary-black-10);
    }
  ` : ''}
`;

export const MarkdownEditorWrapper = styled.div`
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  overflow: hidden;

  &:focus-within {
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .w-md-editor {
    border: none !important;
    box-shadow: none !important;
  }

  .w-md-editor-toolbar {
    border-bottom: 1px solid var(--primary-black-10) !important;
    background: var(--primary-black-5) !important;
  }

  .w-md-editor-content {
    font-family: inherit;
  }
`;

export const MultiFieldItem = styled.div`
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
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
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--primary-black-60);
  margin-bottom: 0.25rem;
`;

export const RemoveButtonSmall = styled.button`
  padding: 0.5rem 0.75rem;
  background: var(--error-failure-100);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  cursor: pointer;
  white-space: nowrap;
  align-self: flex-end;

  &:hover {
    background: var(--error-failure-100);
  }
`;