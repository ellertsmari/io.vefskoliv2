import styled from "styled-components";
import { PageContainer } from "globalStyles/pageStyles";
import { tileSurface } from "UIcomponents/guideTiles/style";

export const StatusMessage = styled.p<{ $error?: boolean }>`
  margin: -1rem 0 1.5rem 0;
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: ${({ $error }) => ($error ? "var(--error-failure-10, #fdecec)" : "var(--accent-green-10, #e8f5ec)")};
  color: ${({ $error }) => ($error ? "var(--error-failure-100)" : "var(--accent-green-text, #1f6b3a)")};
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
// ── The board ─────────────────────────────────────────────────────────────
//
// The editor is the guide page's board with the sections opened up: the same
// tiles, fixed in place, each holding the editable version of its section.


export const EditorShell = styled(PageContainer).attrs({ $width: "full" as const })`
  gap: 1rem;
`;

export const EditorHeader = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  flex-wrap: wrap;
`;

export const EditorTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1 1 320px;
  min-width: 0;
`;

/** The title is edited where it is read: as the page heading. */
export const TitleInput = styled.input`
  width: 100%;
  padding: 0.2rem 0.4rem;
  margin-left: -0.4rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  font: inherit;
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--primary-black-100);

  &:hover {
    border-color: var(--primary-black-10);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-black-100);
    background: var(--primary-white);
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

/** Module, order, discipline and the like: one row above the board. */
export const SettingsStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem 1.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  background: var(--primary-white);
`;

export const SettingField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  min-width: 8rem;

  input,
  select {
    padding: 0.45rem 0.6rem;
    font-size: var(--text-sm);
  }
`;

export const SettingCheck = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  padding-bottom: 0.45rem;
`;

export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/** A tile that stays where it is. Tall enough to edit in, scrolls inside. */
export const EditTile = styled.article<{ $span?: 1 | 2; $tall?: boolean }>`
  ${tileSurface}
  height: ${({ $tall }) => ($tall ? "34rem" : "26rem")};
  grid-column: ${({ $span }) => ($span === 2 ? "1 / -1" : "auto")};

  @media (max-width: 900px) {
    height: auto;
    max-height: 34rem;
  }
`;

export const TileHint = styled.p`
  margin: 0 0 0.75rem 0;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  line-height: 1.45;
`;

/** Fills its tile so the editor's own scrollbar is the tile's. */
export const TileEditor = styled.div`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .w-md-editor {
    flex: 1;
    min-height: 0;
    box-shadow: none;
    border: 1px solid var(--primary-black-30);
    border-radius: var(--radius-md);
  }

  .w-md-editor-text-pre > code,
  .w-md-editor-text-input {
    font-size: var(--text-sm) !important;
    line-height: 1.5 !important;
  }
`;

export const ListRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  margin-bottom: 0.5rem;

  input {
    padding: 0.45rem 0.6rem;
    font-size: var(--text-sm);
  }
`;

export const RowFields = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.35rem;
`;

export const RowRemove = styled.button`
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.6rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  background: var(--primary-white);
  color: var(--primary-black-60);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;

  &:hover {
    border-color: var(--error-failure-100);
    color: var(--error-failure-100);
  }
`;

export const RowAdd = styled.button`
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px dashed var(--primary-black-30);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--primary-black-60);
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: var(--primary-black-100);
    color: var(--primary-black-100);
  }
`;

// ── Focus mode ────────────────────────────────────────────────────────────

export const FocusOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: var(--primary-white);
`;

export const FocusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--primary-black-10);
  flex-shrink: 0;
`;

export const FocusTitle = styled.h2`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
`;

export const FocusKbd = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);

  kbd {
    padding: 0.1rem 0.35rem;
    border: 1px solid var(--primary-black-30);
    border-radius: var(--radius-sm);
    font: inherit;
  }
`;

export const FocusPanes = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const FocusPane = styled.div`
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;

  &:first-child {
    border-right: 1px solid var(--primary-black-10);
  }

  .w-md-editor {
    flex: 1;
    min-height: 0;
    box-shadow: none;
    border: 1px solid var(--primary-black-30);
    border-radius: var(--radius-md);
  }

  @media (max-width: 900px) {
    &:last-child {
      display: none;
    }
  }
`;

export const FocusPaneLabel = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-black-60);
`;

export const FocusPreview = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
`;
