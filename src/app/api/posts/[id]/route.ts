import { NextRequest } from 'next/server';
import { getPostById, updatePostStatus } from '../../../../data/posts.repo';
import { PostStatus } from '../../../../types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return Response.json({ message: 'Post not found' }, { status: 404 });
  return Response.json(post);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status }: { status: PostStatus } = await req.json();
  const post = await updatePostStatus(id, status);
  if (!post) return Response.json({ message: 'Post not found' }, { status: 404 });
  return Response.json(post);
}
