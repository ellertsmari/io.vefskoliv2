import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";

const EditorContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  background: white;
`;

const Toolbar = styled.div`
  background: #000;
  padding: 8px 12px;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ToolbarButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  min-width: 24px;
  height: 24px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  border: none;
  padding: 16px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  
  &::placeholder {
    color: #999;
  }
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const Tooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 12px;
  background: #333;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  width: 280px;
  z-index: 1000;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 12px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid #333;
  }

  ul {
    margin: 0;
    padding-left: 16px;
  }

  li {
    margin-bottom: 4px;
  }
`;

interface CustomMarkdownEditorProps {
  value: string;
  setValue: (value: string) => void;
  guideCategory?: string;
}

const CustomMarkdownEditor: React.FC<CustomMarkdownEditorProps> = ({
  value,
  setValue,
  guideCategory
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    setValue(newText);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, setValue]);

  const handleBold = (e: React.MouseEvent) => {
    e.preventDefault();
    insertText('**', '**');
  };
  const handleLink = (e: React.MouseEvent) => {
    e.preventDefault();
    insertText('[', '](url)');
  };
  const handleBulletList = (e: React.MouseEvent) => {
    e.preventDefault();
    insertText('\n- ', '');
  };
  const handleNumberedList = (e: React.MouseEvent) => {
    e.preventDefault();
    insertText('\n1. ', '');
  };

  const isCodeGuide = guideCategory === 'code' || guideCategory === 'speciality code';

  const codeReviewTips = [
    "Check if the code is clean and readable",
    "Look for proper variable and function naming",
    "Verify that the solution meets the requirements",
    "Check for any potential bugs or edge cases",
    "Consider if the approach is efficient",
    "Look at code structure and organization"
  ];

  const designReviewTips = [
    "Evaluate visual hierarchy and layout",
    "Check color scheme and contrast",
    "Assess typography choices and readability",
    "Look at spacing and alignment",
    "Consider user experience and usability",
    "Check responsiveness across devices"
  ];

  const tooltipContent = isCodeGuide ? codeReviewTips : designReviewTips;

  return (
    <EditorContainer>
      <Toolbar>
        <ToolbarButton type="button" onClick={handleBold} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton type="button" onClick={handleLink} title="Insert Link">
          🔗
        </ToolbarButton>
        <ToolbarButton type="button" onClick={handleBulletList} title="Bullet List">
          •
        </ToolbarButton>
        <ToolbarButton type="button" onClick={handleNumberedList} title="Numbered List">
          1.
        </ToolbarButton>
        <TooltipContainer>
          <ToolbarButton 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(!showTooltip);
            }}
            title="Review Tips"
          >
            ?
          </ToolbarButton>
          <Tooltip $visible={showTooltip}>
            <strong>{isCodeGuide ? 'Code Review Tips:' : 'Design Review Tips:'}</strong>
            <ul>
              {tooltipContent.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </Tooltip>
        </TooltipContainer>
      </Toolbar>
      <TextArea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Input text..."
      />
    </EditorContainer>
  );
};

export default CustomMarkdownEditor;