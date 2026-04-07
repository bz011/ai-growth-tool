import { Post, TopicSuggestion, Trend, OptimizationReport, TopicOpportunityAnalysis } from '../types';
import { openai } from '../lib/openai';
import { getPostBySlug } from '../data/posts.repo';
import { optimizePost } from './seo.service';
import { randomUUID } from 'crypto';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 2;
  while (await getPostBySlug(slug)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export async function generateOptimizedDraft(
  topic: TopicSuggestion,
  publishedPosts: Post[] = [],
  analysis?: TopicOpportunityAnalysis
): Promise<{ post: Post; report: OptimizationReport }> {
  const raw = await generateDraft(topic, analysis);
  return optimizePost(raw, publishedPosts);
}

export async function generateTopicSuggestionsFromTrend(trend: Trend): Promise<TopicSuggestion[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `You are a content strategist for ZenetexAI, an AI solutions company serving MENA businesses.

Given this trending topic: "${trend.keyword}"

Generate exactly 1 blog post idea that is relevant to AI, business growth, or digital transformation for MENA companies.

Return a JSON object with a "suggestions" array containing exactly 1 item. The item must have:
- suggested_title: string (clear, practical blog title)
- suggested_outline: string[] (3 to 5 key points the post will cover)

Return only valid JSON, no explanation.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content ?? '{}');
  const now = new Date();

  const suggestions = raw.suggestions as Array<{ suggested_title: string; suggested_outline: string[] }>;
  const s = suggestions[0];

  return [{
    id: randomUUID(),
    trend_id: trend.id,
    suggested_title: s.suggested_title,
    suggested_outline: s.suggested_outline,
    status: 'accepted' as const,
    created_at: now,
  }];
}

export async function generateDraft(topic: TopicSuggestion, analysis?: TopicOpportunityAnalysis): Promise<Post> {
  const keywordContext = analysis
    ? `\nSEO Opportunity Context — use this to shape every section of the article:
- Primary keyword to target: "${analysis.primaryKeyword}"
- Secondary keywords to weave in naturally: ${analysis.secondaryKeywords.join(', ')}
- Long-tail variants to address within the article: ${analysis.longtailVariants.join(' | ')}
- Reader questions to answer explicitly: ${analysis.relatedQuestions.join(' | ')}
- Search intent: ${analysis.intentLabel} (Opportunity score: ${analysis.opportunityScore}/100)\n`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a senior AI consultant writing authoritative blog content for ZenetexAI, an AI implementation company working with businesses across the MENA region.

Voice and tone:
- Write like someone who has personally deployed AI systems in businesses — not someone summarising think-pieces
- Be direct and confident. Cut every sentence that does not add information
- Assume the reader is a founder, operations director, or department head weighing a real decision

Hard rules — never write:
- "As we look toward the future" or any variation
- "In today's fast-paced world" or any variation
- "Such innovations are not merely theoretical"
- "AI can improve efficiency" (explain the mechanism instead)
- "businesses can benefit from AI" (describe the specific benefit instead)
- Vague examples like "a leading company" or "a retailer in Egypt" — name a plausible specific scenario instead, e.g. "a mid-size electronics distributor in Dubai managing 8,000 SKUs"

Regional grounding:
- Draw from real MENA business contexts: Saudi Vision 2030 digitisation programmes, UAE free zone logistics, Egyptian e-commerce growth, cross-border remittances, Arabic-language customer support, family-owned businesses scaling operations
- Where relevant, acknowledge real constraints: legacy ERP systems, mixed Arabic/English workflows, varying internet infrastructure, trust-based sales cycles`,
      },
      {
        role: 'user',
        content: `Write a complete blog post for the topic below. This will be published on the ZenetexAI website.
${keywordContext}
Title: ${topic.suggested_title}
Outline:
${topic.suggested_outline.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Structure (follow exactly):
1. Hook — open with a specific, realistic problem or scenario. One short paragraph. No definitions, no context-setting fluff.
2. One ## section per outline point — each must contain:
   - A clear explanation of what this is and why it matters
   - How it works in practice (not theory)
   - A concrete example: describe a plausible specific business, not "a company" — e.g. "a logistics firm in Riyadh handling last-mile delivery for 200 retail clients"
3. A ## section titled "How to implement this in your business" containing:
   - 3-5 numbered steps
   - Tools or platforms where relevant (e.g. specific AI vendors, APIs, or internal approaches)
   - Realistic expected results with timeframes
   - One or two common mistakes to avoid
4. A short ## Conclusion — two to three sentences summarising the core takeaway. No filler.
5. CTA — final paragraph, not a heading. Must feel like a natural next step. Show urgency or value. Do not say "contact us today" as the sole message.

Return a JSON object with exactly these fields:
- title: string (final polished title — specific, benefit-driven, no clickbait)
- body: string (full article in markdown)
- meta_title: string (50-60 chars — descriptive, not keyword-stuffed)
- meta_description: string (140-155 chars — specific enough that a reader knows exactly what they will learn)
- cta_text: string (one sentence — value-led and specific, e.g. "If you are exploring AI for your supply chain and want to move past the pilot stage, ZenetexAI can help you deploy in weeks, not months.")

Return only valid JSON, no explanation.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content ?? '{}');
  const now = new Date();

  return {
    id: randomUUID(),
    title: raw.title,
    slug: await uniqueSlug(toSlug(raw.title)),
    body: raw.body,
    meta_title: raw.meta_title ?? '',
    meta_description: raw.meta_description ?? '',
    language: 'en',
    status: 'draft',
    internal_links: [],
    cta_text: raw.cta_text ?? '',
    created_at: now,
    updated_at: now,
    published_at: null,
  };
}
