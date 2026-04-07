import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, createPost } from '../../../data/posts.repo';
import { Post } from '../../../types';
import { fetchGscDataForPosts, isGscConfigured, buildPostUrl } from '../../../services/gsc.service';
import { randomUUID } from 'crypto';

export async function GET() {
  const posts = await getAllPosts();

  // Batch-fetch GSC data for published posts in a single API call
  const publishedPosts = posts.filter(p => p.status === 'published');
  const gscMap = await fetchGscDataForPosts(
    publishedPosts.map(p => ({ id: p.id, slug: p.slug }))
  );

  const gscConfigured = isGscConfigured();

  // Attach gsc + postUrl to every post
  const enriched = posts.map(p => ({
    ...p,
    postUrl: buildPostUrl(p.slug),
    gsc: p.status === 'published'
      ? (gscMap[p.id] ?? (gscConfigured ? null : undefined))
      : undefined,
    gscConfigured: p.status === 'published' ? gscConfigured : undefined,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const { title, slug, body, language } = await req.json();

  const now = new Date();
  const post: Post = {
    id: randomUUID(),
    title,
    slug,
    body,
    language,
    status: 'draft',
    meta_title: '',
    meta_description: '',
    internal_links: [],
    cta_text: '',
    created_at: now,
    updated_at: now,
    published_at: null,
  };

  const created = await createPost(post);
  return NextResponse.json(created, { status: 201 });
}
