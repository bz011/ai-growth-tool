import { NextRequest } from 'next/server';
import { getAllTopics, createTopic } from '../../../data/topics.repo';
import { TopicSuggestion } from '../../../types';
import { randomUUID } from 'crypto';

export async function GET() {
  const topics = await getAllTopics();
  return Response.json(topics);
}

export async function POST(req: NextRequest) {
  const { trend_id, suggested_title, suggested_outline } = await req.json();

  const topic: TopicSuggestion = {
    id: randomUUID(),
    trend_id,
    suggested_title,
    suggested_outline,
    status: 'pending',
    created_at: new Date(),
  };

  const created = await createTopic(topic);
  return Response.json(created, { status: 201 });
}
