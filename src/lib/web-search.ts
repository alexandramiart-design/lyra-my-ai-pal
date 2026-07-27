export type SearchResult = { title: string; url: string; snippet: string };

function decodeEntities(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanUrl(href: string): string {
  try {
    const m = href.match(/[?&]uddg=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
    if (href.startsWith("//")) return `https:${href}`;
    return href;
  } catch {
    return href;
  }
}

/** Recherche web via DuckDuckGo (pas de clé API nécessaire). */
export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  const endpoints = [
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=fr-fr`,
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const out: SearchResult[] = [];

      const anchorRe = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      const snippetRe = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
      const snippets: string[] = [];
      let sm: RegExpExecArray | null;
      while ((sm = snippetRe.exec(html))) snippets.push(decodeEntities(sm[1]));
      let am: RegExpExecArray | null;
      let i = 0;
      while ((am = anchorRe.exec(html)) && out.length < limit) {
        const title = decodeEntities(am[2]);
        if (title) out.push({ title, url: cleanUrl(am[1]), snippet: snippets[i] ?? "" });
        i++;
      }

      if (out.length === 0) {
        // Fallback : version "lite" (tableau simple)
        const liteRe = /<a[^>]+class="result-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        const liteSnipRe = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/g;
        const ls: string[] = [];
        let lm: RegExpExecArray | null;
        while ((lm = liteSnipRe.exec(html))) ls.push(decodeEntities(lm[1]));
        let k = 0;
        while ((lm = liteRe.exec(html)) && out.length < limit) {
          const title = decodeEntities(lm[2]);
          if (title) out.push({ title, url: cleanUrl(lm[1]), snippet: ls[k] ?? "" });
          k++;
        }
      }

      if (out.length) return out;
    } catch {}
  }
  return [];
}

export function formatSearchResults(query: string, results: SearchResult[]): string {
  if (!results.length) return `Aucun résultat trouvé pour "${query}".`;
  return (
    `Résultats de recherche web pour "${query}" (date du jour : ${new Date().toISOString().slice(0, 10)}) :\n\n` +
    results
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source : ${r.url}`)
      .join("\n\n")
  );
}
