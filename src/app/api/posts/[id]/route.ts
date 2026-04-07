import { NextRequest } from 'next/server';
import { getPostById, updatePostStatus } from '../../../../data/posts.repo';
import { PostStatus } from '../../../../types';

const WEBSITE_PUBLISH_URL = 'https://zentexai.com/api/publish-post';

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

  // Push to website when publishing
  if (status === 'published') {
    try {
      const res = await fetch(WEBSITE_PUBLISH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            post.title,
          slug:             post.slug,
          body:             post.body,
          meta_title:       post.meta_title,
          meta_description: post.meta_description,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        return Response.json(
          { message: `Post marked published in DB, but website rejected it: ${text}` },
          { status: 502 }
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { message: `Post marked published in DB, but could not reach website: ${msg}` },
        { status: 502 }
      );
    }
  }

  return Response.json(post);
}
