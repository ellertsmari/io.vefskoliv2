"use client";
import styled from "styled-components";

/**
 * Pulls the markdown body onto our tokens.
 *
 * MDEditor.Markdown ships the `wmde-markdown` stylesheet, which brings its own
 * font stack, background and link colour — so every rendered guide, review and
 * comment was typeset by a third-party theme while the frame around it used the
 * design system. This overrides only the things that made it read as a
 * different app; block layout and code highlighting are left to the library.
 */
export const MarkdownWrapper = styled.div`
  word-break: break-word;

  .wmde-markdown {
    font-family: inherit;
    font-size: var(--text-base);
    line-height: 1.6;
    color: var(--primary-black-100);
    background-color: transparent;

    a {
      color: var(--theme-module3-100);
    }

    code {
      background-color: var(--primary-black-5);
      border-radius: var(--radius-sm);
    }

    pre {
      background-color: var(--primary-black-5);
      border-radius: var(--radius-md);
    }

    blockquote {
      color: var(--primary-black-60);
      border-left-color: var(--primary-black-10);
    }

    hr {
      background-color: var(--primary-black-10);
    }

    /* Markdown headings sit inside a section that already has a heading, so
       they step down from it rather than restating the page's top level. */
    h1 {
      font-size: var(--text-lg);
    }
    h2 {
      font-size: var(--text-base);
    }
    h3,
    h4,
    h5,
    h6 {
      font-size: var(--text-sm);
    }
  }
`;
