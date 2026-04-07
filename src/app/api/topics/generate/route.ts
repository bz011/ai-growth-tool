import { NextRequest } from 'next/server';
import { getTrendById } from '../../../../data/trends.repo';
import { createTopic } from '../../../../data/topics.repo';
import { generateTopicSuggestionsFromTrend } from '../../../../services/content.service';

export async function POST(req: NextRequest) {
  const { trend_id } = await req.json();

  const trend = await getTrendById(trend_id);
  if (!trend) return Response.json({ message: 'Trend not found' }, { status: 404 });

  const suggestions = await generateTopicSuggestionsFromTrend(trend);
  const created = await Promise.all(suggestions.map((s) => createTopic(s)));
  return Response.json(created, { status: 201 });
}
