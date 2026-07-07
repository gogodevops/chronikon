export type WikiLinkTarget = { id: string; title: string };

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

export function extractWikiLinks(body: string | null | undefined): string[] {
  if (!body) return [];
  const links: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(WIKI_LINK_RE.source, "g");
  while ((match = re.exec(body)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdown(
  md: string | null | undefined,
  resolveLink?: (label: string) => WikiLinkTarget | null,
): string {
  if (!md) return "";

  const tokens: string[] = [];
  let html = md.replace(WIKI_LINK_RE, (_, label: string) => {
    const trimmed = label.trim();
    const entry = resolveLink?.(trimmed);
    const i = tokens.length;
    if (entry) {
      tokens.push(
        `<a href="/entries/${entry.id}" class="wiki-link" data-entry-id="${entry.id}">${escapeHtml(entry.title)}</a>`,
      );
    } else {
      tokens.push(
        `<span class="wiki-link-missing" title="Noch kein Eintrag">[[${escapeHtml(trimmed)}]]</span>`,
      );
    }
    return `\x00T${i}\x00`;
  });

  html = escapeHtml(html);
  tokens.forEach((token, i) => {
    html = html.replace(`\x00T${i}\x00`, token);
  });

  html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(
    /^- \[ \] (.+)$/gm,
    '<div class="md-check"><input type="checkbox" disabled> $1</div>',
  );
  html = html.replace(
    /^- \[x\] (.+)$/gim,
    '<div class="md-check done"><input type="checkbox" checked disabled> $1</div>',
  );
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>(\n|$))+/g, (m) =>
    `<ul class="md-list">${m}</ul>`,
  );

  html = html
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (/^<(h[234]|ul|div)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return html;
}
