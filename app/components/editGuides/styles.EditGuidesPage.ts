import styled from "styled-components";
import Link from "next/link";

export {
  PageContainer,
  TitleBlock as Header,
  PageTitle as Title,
  PageSubtitle as Subtitle,
} from "globalStyles/pageStyles";

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const SearchInput = styled.input`
  flex: 1 1 240px;
  max-width: 400px;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  font-size: var(--text-base);

  &:focus {
    outline: none;
    border-color: var(--primary-black-100);
  }
`;

export const FilterSelect = styled.select`
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--primary-white);

  &:focus {
    outline: none;
    border-color: var(--primary-black-100);
  }
`;

export const ModuleHeading = styled.h2`
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary-black-60);
  margin: 1.5rem 0 0.6rem 0;

  &:first-of-type {
    margin-top: 0;
  }
`;

export const GuidesList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
`;

export const GuideCard = styled.li`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  padding: 1.1rem 1.25rem;
`;

export const CardTop = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
`;

export const OrderBadge = styled.span`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  flex-shrink: 0;
`;

export const GuideTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0;
  flex: 1;
  min-width: 0;
`;

export const GuideDescription = styled.p`
  color: var(--primary-black-60);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin: 0;
`;

export const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

export const Pill = styled.span<{ $tone?: "code" | "design" | "muted" }>`
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  background: ${({ $tone }) =>
    $tone === "code"
      ? "var(--accent-blue-10)"
      : $tone === "design"
        ? "var(--accent-rose-10)"
        : "var(--primary-black-5)"};
  color: ${({ $tone }) =>
    $tone === "code"
      ? "var(--accent-blue-text)"
      : $tone === "design"
        ? "var(--accent-rose-text)"
        : "var(--primary-black-60)"};
`;

export const GuideActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: auto;
  padding-top: 0.4rem;
`;

const actionStyles = `
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.8rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
`;

export const ActionLink = styled(Link)<{ $primary?: boolean }>`
  ${actionStyles}
  border: 1px solid
    ${({ $primary }) => ($primary ? "var(--primary-black-100)" : "var(--primary-black-30)")};
  background: ${({ $primary }) => ($primary ? "var(--primary-black-100)" : "var(--primary-white)")};
  color: ${({ $primary }) => ($primary ? "var(--primary-white)" : "var(--primary-black-100)")};

  &:hover {
    border-color: var(--primary-black-100);
  }
`;

export const DangerButton = styled.button`
  ${actionStyles}
  margin-left: auto;
  border: 1px solid transparent;
  background: transparent;
  color: var(--error-failure-100);
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 600;

  &:hover {
    background: var(--primary-black-5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export const ConfirmRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

export const ConfirmButton = styled.button<{ $danger?: boolean }>`
  ${actionStyles}
  border: 1px solid
    ${({ $danger }) => ($danger ? "var(--error-failure-100)" : "var(--primary-black-30)")};
  background: ${({ $danger }) => ($danger ? "var(--error-failure-100)" : "var(--primary-white)")};
  color: ${({ $danger }) => ($danger ? "var(--primary-white)" : "var(--primary-black-100)")};
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 600;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export const Message = styled.p<{ $error?: boolean }>`
  margin: 0 0 1rem 0;
  font-size: var(--text-sm);
  color: ${({ $error }) => ($error ? "var(--error-failure-100)" : "var(--primary-black-60)")};
`;

export const EmptyNote = styled.p`
  text-align: center;
  padding: 2rem;
  color: var(--primary-black-60);
`;
