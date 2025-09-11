import React, { useState, useRef, useCallback, useEffect } from "react";
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

const ToolbarButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'none'};
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

const EditorArea = styled.div`
  min-height: 200px;
  padding: 16px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  
  &:empty::before {
    content: "Input text...";
    color: #999;
  }

  strong {
    font-weight: bold;
  }

  a {
    color: #0066cc;
    text-decoration: underline;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    list-style-type: disc;
  }

  ol {
    margin: 0;
    padding-left: 20px;
    list-style-type: decimal;
  }

  li {
    margin-bottom: 4px;
    display: list-item;
  }

  div {
    margin-bottom: 0;
  }
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const Tooltip = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: auto;
  top: auto;
  right: auto;
  left: auto;
  padding: 12px;
  background: #333;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  width: 280px;
  z-index: 9999;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 12px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #333;
  }

  ul {
    margin: 0;
    padding-left: 16px;
  }

  li {
    margin-bottom: 4px;
  }
`;

interface RichTextEditorProps {
  value: string;
  setValue: (value: string) => void;
  guideCategory?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  setValue,
  guideCategory
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const tooltipButtonRef = useRef<HTMLButtonElement>(null);

  // Store cursor position
  const saveCursorPosition = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    }
    return null;
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback((cursorPos: any) => {
    if (cursorPos && editorRef.current?.contains(cursorPos.startContainer)) {
      const selection = window.getSelection();
      const range = document.createRange();
      try {
        range.setStart(cursorPos.startContainer, cursorPos.startOffset);
        range.setEnd(cursorPos.endContainer, cursorPos.endOffset);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch (e) {
        // If cursor position is invalid, place at end
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      // Get the plain text content for simple cases
      const plainText = editorRef.current.innerText || '';
      
      // If it's just plain text with no formatting, use that
      if (editorRef.current.innerHTML === plainText || editorRef.current.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '') === plainText) {
        setValue(plainText.trim());
        return;
      }
      
      // Convert HTML back to markdown for formatted content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorRef.current.innerHTML;
      
      let markdown = '';
      
      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const children = Array.from(element.childNodes).map(processNode).join('');
          
          switch (element.tagName?.toLowerCase()) {
            case 'strong':
            case 'b':
              return `**${children}**`;
            case 'a':
              const href = element.getAttribute('href') || 'url';
              return `[${children}](${href})`;
            case 'li':
              // Check if parent is ol or ul
              const parent = element.parentElement;
              if (parent?.tagName?.toLowerCase() === 'ol') {
                return `1. ${children}\n`;
              } else {
                return `- ${children}\n`;
              }
            case 'br':
              return '\n';
            case 'div':
              return `${children}\n`;
            case 'ul':
            case 'ol':
              return children;
            default:
              return children;
          }
        }
        
        return '';
      };

      Array.from(tempDiv.childNodes).forEach(node => {
        markdown += processNode(node);
      });

      const result = markdown.trim();
      setValue(result);
    }
  }, [setValue]);

  // Initialize content only once
  useEffect(() => {
    if (!initialized && editorRef.current && value) {
      // Convert initial markdown to HTML
      let html = value
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n/g, '<br>');
      
      editorRef.current.innerHTML = html;
      setInitialized(true);
    }
  }, [value, initialized]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTooltip && tooltipButtonRef.current && !tooltipButtonRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const handleBold = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    executeCommand('bold');
  }, [executeCommand]);

  const handleLink = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  }, [executeCommand]);

  const handleBulletList = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    executeCommand('insertUnorderedList');
  }, [executeCommand]);

  const handleNumberedList = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    executeCommand('insertOrderedList');
  }, [executeCommand]);

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

  const handleTooltipToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!showTooltip && tooltipButtonRef.current) {
      // Calculate position relative to the button
      const rect = tooltipButtonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 160, // Position above the button
        left: Math.max(10, rect.right - 280) // Ensure it doesn't go off screen
      });
    }
    
    setShowTooltip(!showTooltip);
  }, [showTooltip]);

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
            ref={tooltipButtonRef}
            type="button"
            onClick={handleTooltipToggle}
            title="Review Tips"
          >
            ?
          </ToolbarButton>
          <Tooltip 
            $visible={showTooltip}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`
            }}
          >
            <strong>{isCodeGuide ? 'Code Review Tips:' : 'Design Review Tips:'}</strong>
            <ul>
              {tooltipContent.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </Tooltip>
        </TooltipContainer>
      </Toolbar>
      <EditorArea
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning={true}
      />
    </EditorContainer>
  );
};

export default RichTextEditor;