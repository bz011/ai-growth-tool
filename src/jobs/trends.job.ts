import { fetchTrends } from '../services/trends.service';
import { saveTrend } from '../data/trends.repo';
import { generateTopicSuggestionsFromTrend, generateOptimizedDraft } from '../services/content.service';
import { createTopic, getTopicCountByTrendId, updateTopicOpportunity } from '../data/topics.repo';
import { createPostWithReport, getAllPosts } from '../data/posts.repo';
import { analyzeTopicOpportunity } from '../services/seo.service';

export async function runTrendsJob(): Promise<void> {
  const trends = await fetchTrends();
  if (trends.length === 0) throw new Error('fetchTrends returned no results');

  // Strict control: process only the first trend
  const trend = trends[0];
  const saved = await saveTrend(trend);

  // Skip if topics already exist for this trend
  const existing = await getTopicCountByTrendId(saved.id);
  if (existing > 0) return;

  // Generate exactly 1 accepted topic
  const suggestions = await generateTopicSuggestionsFromTrend(saved);
  const savedTopic = await createTopic(suggestions[0]);

  // Analyze SEO opportunity for this keyword, then save to topic
  const analysis = await analyzeTopicOpportunity(saved.keyword);
  await updateTopicOpportunity(savedTopic.id, analysis);

  // Fetch published posts for internal link scoring
  const allPosts = await getAllPosts();
  const publishedPosts = allPosts.filter(p => p.status === 'published');

  // Generate, optimize, and save exactly 1 draft post — analysis guides content generation
  const { post, report } = await generateOptimizedDraft(savedTopic, publishedPosts, analysis);
  await createPostWithReport(post, report, analysis);
}
