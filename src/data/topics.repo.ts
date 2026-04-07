import { TopicSuggestion, TopicSuggestionStatus, TopicOpportunityAnalysis } from '../types';
import { pool } from '../lib/db';

export async function getAllTopics(): Promise<TopicSuggestion[]> {
  const result = await pool.query('SELECT * FROM topic_suggestions ORDER BY created_at DESC');
  return result.rows;
}

export async function createTopic(topic: TopicSuggestion): Promise<TopicSuggestion> {
  const result = await pool.query(
    `INSERT INTO topic_suggestions (id, trend_id, suggested_title, suggested_outline, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      topic.id,
      topic.trend_id,
      topic.suggested_title,
      JSON.stringify(topic.suggested_outline),
      topic.status,
      topic.created_at,
    ]
  );
  return result.rows[0];
}

export async function getTopicCountByTrendId(trendId: string): Promise<number> {
  const result = await pool.query('SELECT COUNT(*) FROM topic_suggestions WHERE trend_id = $1', [trendId]);
  return parseInt(result.rows[0].count, 10);
}

export async function getTopicById(id: string): Promise<TopicSuggestion | null> {
  const result = await pool.query('SELECT * FROM topic_suggestions WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function updateTopicStatus(id: string, status: TopicSuggestionStatus): Promise<TopicSuggestion | null> {
  const result = await pool.query(
    `UPDATE topic_suggestions
     SET status = $2::topic_suggestion_status
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );
  return result.rows[0] ?? null;
}

export async function updateTopicOpportunity(id: string, analysis: TopicOpportunityAnalysis): Promise<void> {
  await pool.query(
    `UPDATE topic_suggestions SET opportunity_analysis = $2 WHERE id = $1`,
    [id, JSON.stringify(analysis)]
  );
}
