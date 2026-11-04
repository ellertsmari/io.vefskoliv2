import { Fragment, ReactNode } from "react";

/**
 * The little inline formatting brief texts may use: **bold**, *italic*,
 * `code` and [links](https://…). Everything else is plain text — React
 * escapes it — so a brief can never inject markup.
 */
const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g;

export function rich(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [, bold, italic, code, label, href] = match;
    const key = index++;
    if (bold) out.push(<strong key={key}>{rich(bold)}</strong>);
    else if (italic) out.push(<em key={key}>{rich(italic)}</em>);
    else if (code) out.push(<code key={key}>{code}</code>);
    else if (label && href) {
      const external = href.startsWith("http");
      out.push(
        <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
          {label}
        </a>
      );
    }
    last = at + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length === 1 ? out[0] : <Fragment>{out}</Fragment>;
}

export const Rich = ({ children }: { children: string }) => <>{rich(children)}</>;

/** The same text without the formatting marks, for metadata. */
export const plainText = (text: string): string =>
  text.replace(TOKEN, (_all, bold, italic, code, label) => bold ?? italic ?? code ?? label ?? "");
