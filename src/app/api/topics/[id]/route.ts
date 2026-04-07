import { NextRequest } from 'next/server';
import { updateTopicStatus } from '../../../../data/topics.repo';
import { TopicSuggestionStatus } from '../../../../types';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status }: { status: TopicSuggestionStatus } = await req.json();
  const topic = await updateTopicStatus(id, status);
  if (!topic) return Response.json({ message: 'Topic not found' }, { status: 404 });
  return Response.json(topic);
}
