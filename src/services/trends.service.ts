import { Trend } from '../types';
import { randomUUID } from 'crypto';

const TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=US';

// Only trends matching one of these keywords (whole-word, case-insensitive) are allowed
const RELEVANCE_KEYWORDS = [
  'ai',
  'artificial intelligence',
  'chatgpt',
  'openai',
  'llm',
  'ai agents',
  'ai agent',
  'automation',
  'chatbot',
  'machine learning',
  'digital transformation',
  'workflow automation',
  'business intelligence',
  'customer support automation',
  'productivity tools',
  'generative ai',
  'language model',
];

// Pre-compile: each keyword must match as a whole word (not a substring of another word)
const RELEVANCE_PATTERNS = RELEVANCE_KEYWORDS.map(k => {
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
});

function isRelevant(keyword: string): boolean {
  return RELEVANCE_PATTERNS.some(p => p.test(keyword));
}

const FALLBACK_TREND: Omit<Trend, 'id' | 'fetched_at'> = {
  keyword: 'AI agents for business automation',
  source: 'fallback',
  score: 10,
  region: 'MENA',
};

// Handles both plain text and <![CDATA[...]]> wrapped content
function extractFirst(xml: string, tag: string): string | null {
  const pattern = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))<\\/${tag}>`,
    'i'
  );
  const match = pattern.exec(xml);
  if (!match) return null;
  return (match[1] ?? match[2] ?? '').trim() || null;
}

export async function fetchTrends(): Promise<Trend[]> {
  const res = await fetch(TRENDS_RSS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZenetexAI/1.0)' },
  });

  if (!res.ok) {
    throw new Error(`Google Trends RSS returned ${res.status} for ${TRENDS_RSS_URL}`);
  }

  const xml = await res.text();
  const items = xml.split('<item>').slice(1);

  if (items.length === 0) {
    throw new Error('Google Trends RSS parsed successfully but returned no items');
  }

  const parsed = items
    .map((item): Trend | null => {
      const keyword = extractFirst(item, 'title');
      if (!keyword) return null;
      return {
        id: randomUUID(),
        keyword,
        source: 'google_trends',
        score: 10,
        region: 'MENA',
        fetched_at: new Date(),
      };
    })
    .filter((t): t is Trend => t !== null);

  if (parsed.length === 0) {
    throw new Error('Google Trends RSS items found but no titles could be extracted');
  }

  const relevant = parsed.filter(t => isRelevant(t.keyword));

  if (relevant.length > 0) return relevant;

  // No relevant trends found — return a single curated fallback
  return [{ id: randomUUID(), fetched_at: new Date(), ...FALLBACK_TREND }];
}
