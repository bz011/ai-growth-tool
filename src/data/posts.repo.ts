import { Post, PostStatus, OptimizationReport, TopicOpportunityAnalysis } from '../types';
import { pool } from '../lib/db';

export async function getAllPosts(): Promise<Post[]> {
  const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
  return result.rows;
}

export async function getPostById(id: string): Promise<Post | null> {
  const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createPost(post: Post): Promise<Post> {
  const result = await pool.query(
    `INSERT INTO posts
      (id, title, slug, body, language, status, meta_title, meta_description, internal_links, cta_text, created_at, updated_at, published_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      post.id,
      post.title,
      post.slug,
      post.body,
      post.language,
      'draft',
      post.meta_title,
      post.meta_description,
      JSON.stringify(post.internal_links ?? []),
      post.cta_text,
      post.created_at,
      post.updated_at,
      null,
    ]
  );
  return result.rows[0];
}

export async function createPostWithReport(
  post: Post,
  report: OptimizationReport,
  opportunityAnalysis?: TopicOpportunityAnalysis
): Promise<Post> {
  const result = await pool.query(
    `INSERT INTO posts
      (id, title, slug, body, language, status, meta_title, meta_description, internal_links, cta_text, optimization_report, opportunity_analysis, created_at, updated_at, published_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      post.id,
      post.title,
      post.slug,
      post.body,
      post.language,
      'draft',
      post.meta_title,
      post.meta_description,
      JSON.stringify(post.internal_links ?? []),
      post.cta_text,
      JSON.stringify(report),
      opportunityAnalysis ? JSON.stringify(opportunityAnalysis) : null,
      post.created_at,
      post.updated_at,
      null,
    ]
  );
  return result.rows[0];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const result = await pool.query('SELECT id FROM posts WHERE slug = $1', [slug]);
  return result.rows[0] ?? null;
}

export async function updatePostStatus(id: string, status: PostStatus): Promise<Post | null> {
  const result = await pool.query(
    `UPDATE posts
     SET status = $2::post_status,
         updated_at = NOW(),
         published_at = CASE WHEN $2::post_status = 'published' THEN NOW() ELSE published_at END
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );
  return result.rows[0] ?? null;
}
