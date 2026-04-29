export type VaultDocument = {
  path: string;
  content: string;
};

export type VaultSnippet = {
  path: string;
  snippet: string;
  score: number;
};

export type VaultSearchOptions = {
  maxResults: number;
  maxSnippetChars: number;
};

export function searchVaultSnippets(documents: VaultDocument[], query: string, options: VaultSearchOptions): VaultSnippet[] {
  const terms = tokenize(query);
  if (terms.length === 0 || options.maxResults <= 0) return [];

  return documents
    .map((document) => scoreDocument(document, terms, options.maxSnippetChars))
    .filter((result): result is VaultSnippet => result !== null)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, options.maxResults);
}

function scoreDocument(document: VaultDocument, terms: string[], maxSnippetChars: number): VaultSnippet | null {
  const haystack = `${document.path}\n${document.content}`.toLowerCase();
  let score = 0;
  let firstIndex = -1;

  for (const term of terms) {
    const index = haystack.indexOf(term);
    if (index >= 0) {
      score += document.path.toLowerCase().includes(term) ? 3 : 1;
      firstIndex = firstIndex === -1 ? index : Math.min(firstIndex, index);
    }
  }

  if (score === 0) return null;
  return {
    path: document.path,
    snippet: makeSnippet(document.content, firstIndex, maxSnippetChars),
    score
  };
}

function makeSnippet(content: string, firstIndex: number, maxSnippetChars: number): string {
  const max = Math.max(1, maxSnippetChars);
  if (content.length <= max) return content;

  const start = Math.max(0, Math.min(content.length - max, firstIndex - Math.floor(max / 3)));
  const snippet = content.slice(start, start + max).trim();
  return `${start > 0 ? "..." : ""}${snippet}${start + max < content.length ? "..." : ""}`;
}

function tokenize(query: string): string[] {
  return [...new Set(query.toLowerCase().match(/[\p{L}\p{N}_-]{2,}/gu) ?? [])];
}

