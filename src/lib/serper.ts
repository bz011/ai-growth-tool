export interface SerperResult {
  relatedSearches: string[];
  peopleAlsoAsk: string[];
  topDomains: string[];
  resultCount: number;
  validated: boolean;
}

export async function fetchSerperData(keyword: string): Promise<SerperResult> {
  const key = process.env.SERPER_API_KEY;

  if (!key) {
    return { relatedSearches: [], peopleAlsoAsk: [], topDomains: [], resultCount: 0, validated: false };
  }

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: keyword, num: 10, gl: 'us', hl: 'en' }),
    });

    if (!res.ok) {
      return { relatedSearches: [], peopleAlsoAsk: [], topDomains: [], resultCount: 0, validated: false };
    }

    const data = await res.json();

    const relatedSearches: string[] = (data.relatedSearches ?? [])
      .slice(0, 6)
      .map((r: { query: string }) => r.query);

    const peopleAlsoAsk: string[] = (data.peopleAlsoAsk ?? [])
      .slice(0, 5)
      .map((r: { question: string }) => r.question);

    const topDomains: string[] = (data.organic ?? [])
      .slice(0, 5)
      .map((r: { link: string }) => {
        try { return new URL(r.link).hostname.replace('www.', ''); } catch { return ''; }
      })
      .filter(Boolean);

    const resultCount: number = data.searchInformation?.totalResults
      ? parseInt(String(data.searchInformation.totalResults).replace(/,/g, ''), 10)
      : 0;

    return { relatedSearches, peopleAlsoAsk, topDomains, resultCount, validated: true };
  } catch {
    return { relatedSearches: [], peopleAlsoAsk: [], topDomains: [], resultCount: 0, validated: false };
  }
}
