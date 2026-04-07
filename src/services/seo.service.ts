import { Post, OptimizationReport, TopicOpportunityAnalysis } from '../types';
import { openai } from '../lib/openai';
import { fetchSerperData } from '../lib/serper';

// ── Deterministic scoring ────────────────────────────────────────

function scoreSEO(post: Post): number {
  let score = 0;
  const titleLen = post.title.length;
  const metaLen = post.meta_description.length;
  if (titleLen >= 40 && titleLen <= 70) score += 25;
  if (metaLen >= 120 && metaLen <= 160) score += 25;
  if (post.meta_title && post.meta_title.length > 0) score += 25;
  if (post.slug && post.slug.length < 80) score += 25;
  return score;
}

function scoreReadability(post: Post): number {
  let score = 0;
  const headings = (post.body.match(/^##\s/gm) ?? []).length;
  const wordCount = post.body.split(/\s+/).filter(Boolean).length;
  const paragraphs = post.body.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  if (headings >= 3) score += 25;
  if (wordCount >= 500 && wordCount <= 2500) score += 25;
  if (/how to implement/i.test(post.body)) score += 25;
  if (paragraphs >= 5) score += 25;
  return score;
}

function scoreContentDepth(post: Post): number {
  let score = 0;
  const wordCount = post.body.split(/\s+/).filter(Boolean).length;
  const headings = (post.body.match(/^##\s/gm) ?? []).length;
  if (wordCount >= 600) score += 20;
  if (/^\d+\./m.test(post.body)) score += 20;         // numbered steps
  if (/##\s*conclusion/i.test(post.body)) score += 20;
  if (headings >= 3) score += 20;
  if (post.cta_text && post.cta_text.length > 20) score += 20;
  return score;
}

function scoreIntentMatch(post: Post): number {
  let score = 0;
  const wordCount = post.body.split(/\s+/).filter(Boolean).length;
  const headings = (post.body.match(/^##\s/gm) ?? []).length;
  if (wordCount >= 400) score += 40;
  if (headings >= 2) score += 30;
  if (post.body.includes('\n\n')) score += 30;
  return score;
}

function scoreCTR(post: Post): number {
  let score = 0;
  const titleLen = post.title.length;
  if (titleLen >= 30 && titleLen <= 70) score += 25;
  if (/\d/.test(post.title)) score += 25;
  if (post.meta_description.length >= 100) score += 25;
  if (post.cta_text && post.cta_text.length > 0) score += 25;
  return score;
}

function scoreInternalLinks(post: Post, publishedPosts: Post[]): number {
  if (publishedPosts.length === 0) return 50; // neutral: no reference base yet
  const bodyLower = post.body.toLowerCase();
  const matches = publishedPosts.filter(p => {
    const words = p.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    return words.some(w => bodyLower.includes(w));
  });
  return Math.min(100, matches.length * 25);
}

function detectIssues(post: Post): string[] {
  const flags: string[] = [];
  const titleLen = post.title.length;
  const metaLen = post.meta_description.length;
  const wordCount = post.body.split(/\s+/).filter(Boolean).length;
  const headings = (post.body.match(/^##\s/gm) ?? []).length;

  if (titleLen < 30) flags.push('Title too short (under 30 chars)');
  if (titleLen > 80) flags.push('Title too long (over 80 chars)');
  if (metaLen < 100) flags.push('Meta description too short (under 100 chars)');
  if (metaLen > 160) flags.push('Meta description too long (over 160 chars)');
  if (headings < 3) flags.push('Insufficient heading structure (fewer than 3 ## sections)');
  if (wordCount < 400) flags.push('Content too short (under 400 words)');
  if (!/how to implement/i.test(post.body)) flags.push('Missing implementation guide section');
  if (!post.cta_text || post.cta_text.length < 20) flags.push('Weak or missing CTA');
  if (!post.meta_title || post.meta_title.length === 0) flags.push('Meta title is empty');
  if (!/\d/.test(post.title)) flags.push('Title has no number (lower CTR)');
  return flags;
}

// ── AI improvement ───────────────────────────────────────────────

interface Improvement {
  title: string;
  meta_title: string;
  meta_description: string;
  cta_text: string;
  body: string;
  improvementsApplied: string[];
}

async function improvePost(post: Post, issueFlags: string[]): Promise<Improvement> {
  const issueList = issueFlags.length > 0
    ? issueFlags.map(f => `- ${f}`).join('\n')
    : '- None detected';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a senior SEO editor for ZenetexAI. You improve blog posts for MENA business audiences.
Fix only what the issue flags say. Do not rewrite content that is already good.
Preserve the structure and expertise of the original article.`,
      },
      {
        role: 'user',
        content: `Improve this blog post based on the issue flags below.

=== CURRENT POST ===
Title: ${post.title}
Meta title: ${post.meta_title}
Meta description: ${post.meta_description}
CTA: ${post.cta_text}
Body:
${post.body}

=== ISSUE FLAGS ===
${issueList}

Return a JSON object with exactly these fields:
- title: string (improved title — 40-70 chars, specific, benefit-driven, include a number if natural)
- meta_title: string (50-60 chars, descriptive)
- meta_description: string (140-155 chars, specific and click-worthy)
- cta_text: string (one value-led sentence)
- body: string (improved full article — fix heading structure, add implementation steps if missing, strengthen intro; keep existing good content)
- improvementsApplied: string[] (short list of what you changed, e.g. ["Added number to title", "Expanded meta description"])

Return only valid JSON, no explanation.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content ?? '{}') as Improvement;
}

// ── Topic Opportunity Analysis ───────────────────────────────────

export async function analyzeTopicOpportunity(keyword: string): Promise<TopicOpportunityAnalysis> {
  // Step 1: fetch live SERP data from Serper.dev (graceful fallback if key not set)
  const serper = await fetchSerperData(keyword);

  // Build context block from real SERP data so GPT can calibrate scores accurately
  const serperContext = serper.validated
    ? `
Real SERP data from Google (use this to calibrate your scores):
- Top domains ranking: ${serper.topDomains.join(', ')} (if dominated by Wikipedia/Forbes/major brands → competition is high → lower competitionScore)
- Estimated result count: ${serper.resultCount.toLocaleString()} (>10M = high competition)
- Related searches from Google: ${serper.relatedSearches.join(' | ')}
- People also ask (real questions): ${serper.peopleAlsoAsk.join(' | ')}`
    : `No live SERP data available — estimate scores based on keyword characteristics alone.`;

  // Step 2: GPT analysis calibrated by real SERP signals
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a senior SEO strategist specializing in AI and technology content for MENA business audiences. Return precise, realistic scores — not inflated ones. Base your scores on the SERP data provided when available.`,
      },
      {
        role: 'user',
        content: `Analyze the SEO opportunity for this keyword: "${keyword}"
${serperContext}

Return a JSON object with exactly these fields:
- primaryKeyword: string (cleaned, most-searchable form of the keyword)
- secondaryKeywords: string[] (3-5 closely related keywords; prefer terms from the related searches above if provided)
- longtailVariants: string[] (4-6 long-tail search phrases a business would actually type; use real related searches above if provided)
- relatedQuestions: string[] (3-5 questions; use the "people also ask" questions above if provided, otherwise generate realistic ones)
- intentLabel: string (one of: "informational", "commercial", "transactional", "navigational")
- demandScore: number 0-100 (search demand — calibrate using result count: >50M=80+, 10-50M=60-79, 1-10M=40-59, <1M=20-39)
- relevanceScore: number 0-100 (relevance to AI, business growth, and MENA market — 80+ if directly about AI for business)
- intentClarityScore: number 0-100 (80+ for specific how-to queries, 40-60 for ambiguous or broad topics)
- competitionScore: number 0-100 (OPPORTUNITY score: if top domains are Wikipedia/Investopedia/Forbes→30-50; if niche sites→70-90; MENA-specific angle adds +10)
- topicalCoverageScore: number 0-100 (80+ if one article can thoroughly cover it; 40-60 if too broad)
- opportunityScore: number 0-100 (weighted: demand×0.25 + relevance×0.30 + intentClarity×0.15 + competition×0.15 + topicalCoverage×0.15)

Return only valid JSON, no explanation.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(response.choices[0].message.content ?? '{}');

  // Merge real SERP questions/searches into the analysis if GPT didn't use them
  if (serper.validated) {
    if (serper.peopleAlsoAsk.length > 0 && parsed.relatedQuestions.length === 0) {
      parsed.relatedQuestions = serper.peopleAlsoAsk;
    }
    if (serper.relatedSearches.length > 0 && parsed.longtailVariants.length < 3) {
      parsed.longtailVariants = [...parsed.longtailVariants, ...serper.relatedSearches].slice(0, 6);
    }
  }

  return { ...parsed, serperValidated: serper.validated } as TopicOpportunityAnalysis;
}

// ── Main export ──────────────────────────────────────────────────

export async function optimizePost(
  post: Post,
  publishedPosts: Post[] = []
): Promise<{ post: Post; report: OptimizationReport }> {
  // 1. Analyze original
  const issueFlags = detectIssues(post);

  // 2. Improve via AI (always run — even no flags, it may tighten copy)
  const improvement = await improvePost(post, issueFlags);

  // 3. Build improved post
  const improved: Post = {
    ...post,
    title: improvement.title || post.title,
    meta_title: improvement.meta_title || post.meta_title,
    meta_description: improvement.meta_description || post.meta_description,
    cta_text: improvement.cta_text || post.cta_text,
    body: improvement.body || post.body,
    updated_at: new Date(),
  };

  // 4. Score the improved version
  const seoScore           = scoreSEO(improved);
  const readabilityScore   = scoreReadability(improved);
  const contentDepthScore  = scoreContentDepth(improved);
  const intentMatchScore   = scoreIntentMatch(improved);
  const ctrScore           = scoreCTR(improved);
  const internalLinkScore  = scoreInternalLinks(improved, publishedPosts);

  const report: OptimizationReport = {
    seoScore,
    readabilityScore,
    intentMatchScore,
    ctrScore,
    contentDepthScore,
    internalLinkScore,
    issueFlags,
    improvementsApplied: improvement.improvementsApplied ?? [],
    finalTitle: improved.title,
    finalMetaDescription: improved.meta_description,
    finalSlug: improved.slug,
    finalContent: improved.body,
  };

  return { post: improved, report };
}
