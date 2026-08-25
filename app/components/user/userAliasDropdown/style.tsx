import styled from "styled-components";

export const DropdownContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

/**
 * One pill instead of a stack of buttons. While aliased it splits into two
 * segments — the label opens the picker, the ✕ leaves the alias — so the whole
 * control stays a single object in the top bar.
 */
export const Pill = styled.div<{ $active: boolean }>`
  display: inline-flex;
  align-items: stretch;
  height: 2rem;
  border-radius: var(--radius-pill);
  border: 1px solid
    ${(props) =>
      props.$active ? "var(--error-warning-60)" : "var(--primary-black-10)"};
  background: ${(props) =>
    props.$active ? "var(--error-warning-10)" : "var(--primary-white)"};
  overflow: hidden;
`;

export const PillButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.75rem;
  border: none;
  background: transparent;
  color: var(--primary-black-60);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: var(--primary-black-5);
    color: var(--primary-black-100);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** The alias name is the one thing worth reading at a glance. */
export const PillName = styled.strong`
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const PillIcon = styled.span`
  display: inline-flex;
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
`;

export const PillChevron = styled(PillIcon)<{ $open: boolean }>`
  transition: transform 0.15s ease;
  transform: rotate(${(props) => (props.$open ? "180deg" : "0deg")});
`;

export const PillDivider = styled.span`
  width: 1px;
  background: var(--error-warning-60);
  flex-shrink: 0;
`;

/** Icon-only, so exiting the alias stays one click without a third button. */
export const ExitAliasButton = styled(PillButton)`
  padding: 0 0.6rem;

  &:hover:not(:disabled) {
    background: var(--error-failure-10);
    color: var(--error-failure-100);
  }
`;

export const DropdownContent = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
  width: 18rem;
  max-height: 22rem;
  padding: 0.35rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

export const DropdownLabel = styled.p`
  margin: 0;
  padding: 0.35rem 0.5rem;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-black-30);
`;

export const SearchInput = styled.input`
  margin: 0 0.15rem 0.35rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  background: var(--primary-white);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--primary-black-100);

  &::placeholder {
    color: var(--primary-black-30);
  }

  &:focus {
    outline: none;
    border-color: var(--theme-module3-60);
  }
`;

export const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow-y: auto;
  min-height: 0;
`;

export const DropdownItem = styled.button<{ $current?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: var(--radius-md);
  background: ${(props) =>
    props.$current ? "var(--theme-module3-10)" : "transparent"};
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover:not(:disabled) {
    background: var(--primary-black-5);
  }

  &:disabled {
    cursor: default;
  }
`;

export const ItemText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

export const ItemName = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemMeta = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemBadge = styled.span`
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--theme-module3-100);
`;

export const EmptyMessage = styled.p`
  margin: 0;
  padding: 0.75rem 0.5rem;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  text-align: center;
`;
