import { NextRequest } from 'next/server';
import { getTopicById } from '../../../../../data/topics.repo';
import { updateTopicOpportunity } from '../../../../../data/topics.repo';
import { createPostWithReport, getAllPosts } from '../../../../../data/posts.repo';
import { generateOptimizedDraft } from '../../../../../services/content.service';
import { analyzeTopicOpportunity } from '../../../../../services/seo.service';
import { getAllTrends } from '../../../../../data/trends.repo';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const topic = await getTopicById(id);
  if (!topic) return Response.json({ message: 'Topic not found' }, { status: 404 });

  if (topic.status !== 'accepted') {
    return Response.json({ message: 'Topic must be accepted before generation' }, { status: 400 });
  }

  // Resolve the trend keyword for this topic so we can run opportunity analysis
  const trends = await getAllTrends();
  const trend = trends.find(t => t.id === topic.trend_id);
  const keyword = trend?.keyword ?? topic.suggested_title;

  // Run opportunity analysis (uses Serper.dev if key set, falls back to GPT-only)
  const analysis = await analyzeTopicOpportunity(keyword);
  await updateTopicOpportunity(topic.id, analysis);

  const allPosts = await getAllPosts();
  const publishedPosts = allPosts.filter(p => p.status === 'published');

  const { post, report } = await generateOptimizedDraft(topic, publishedPosts, analysis);
  const saved = await createPostWithReport(post, report, analysis);
  return Response.json(saved, { status: 201 });
}
