import { NextRequest } from 'next/server';
import { getPostById, updatePostStatus } from '../../../../data/posts.repo';
import { PostStatus } from '../../../../types';

const WEBSITE_PUBLISH_URL = 'https://zentexai.com/api/publish-post';
const WEBSITE_DELETE_URL  = 'https://zentexai.com/api/delete-post';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return Response.json({ message: 'Post not found' }, { status: 404 });
  return Response.json(post);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(`[PATCH /api/posts/${id}] handler entered`);

  const { status }: { status: PostStatus } = await req.json();
  console.log(`[PATCH /api/posts/${id}] requested status=${status}`);

  // Non-publish changes (e.g. revert to draft) — update DB directly
  if (status !== 'published') {
    const post = await updatePostStatus(id, status);
    if (!post) return Response.json({ message: 'Post not found' }, { status: 404 });
    return Response.json(post);
  }

  // ── Publish flow ──────────────────────────────────────────────
  // Step 1: load the full post from DB (do NOT update status yet)
  console.log(`[PATCH /api/posts/${id}] loading post from DB`);
  const post = await getPostById(id);
  if (!post) {
    console.log(`[PATCH /api/posts/${id}] post not found`);
    return Response.json({ message: 'Post not found' }, { status: 404 });
  }
  console.log(`[PATCH /api/posts/${id}] post loaded: "${post.title}"`);

  // Step 2: send to website API
  const payload = {
    title:            post.title,
    slug:             post.slug,
    body:             post.body,
    meta_title:       post.meta_title,
    meta_description: post.meta_description,
  };
  console.log('Sending publish request to website:', WEBSITE_PUBLISH_URL);
  console.log(`[PATCH /api/posts/${id}] payload keys: ${Object.keys(payload).join(', ')}, body length: ${post.body?.length ?? 0}`);

  try {
    const websiteRes = await fetch(WEBSITE_PUBLISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const websiteBody = await websiteRes.text();
    console.log('Publish response status:', websiteRes.status);
    console.log(`[PATCH /api/posts/${id}] website API body: ${websiteBody}`);

    if (!websiteRes.ok) {
      return Response.json(
        { message: `Website API rejected the post (${websiteRes.status}): ${websiteBody}` },
        { status: 502 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[PATCH /api/posts/${id}] website API fetch error:`, msg);
    return Response.json(
      { message: `Could not reach website API: ${msg}` },
      { status: 502 }
    );
  }

  // Step 3: website accepted — now mark published in DB
  console.log(`[PATCH /api/posts/${id}] website accepted — marking published in DB`);
  const updated = await updatePostStatus(id, 'published');
  if (!updated) return Response.json({ message: 'Post not found' }, { status: 404 });
  console.log(`[PATCH /api/posts/${id}] done`);
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const post = await getPostById(id);
  if (!post) return Response.json({ message: 'Post not found' }, { status: 404 });

  try {
    const res = await fetch(WEBSITE_DELETE_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: post.slug }),
    });
    const body = await res.text();

    if (!res.ok) {
      return Response.json(
        { message: `Website delete failed (${res.status}): ${body}` },
        { status: 502 }
      );
    }

    return Response.json({ success: true, slug: post.slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ message: `Could not reach website: ${msg}` }, { status: 502 });
  }
}
