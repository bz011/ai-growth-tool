import { Trend } from '../types';
import { pool } from '../lib/db';

export async function getAllTrends(): Promise<Trend[]> {
  const result = await pool.query('SELECT * FROM trends ORDER BY fetched_at DESC');
  return result.rows.map((row) => ({ ...row, score: Number(row.score) }));
}

export async function getTrendById(id: string): Promise<Trend | null> {
  const result = await pool.query('SELECT * FROM trends WHERE id = $1', [id]);
  if (!result.rows[0]) return null;
  return { ...result.rows[0], score: Number(result.rows[0].score) };
}

export async function saveTrend(trend: Trend): Promise<Trend> {
  // Upsert by keyword so repeat runs on the same keyword return the same row id.
  // This allows getTopicCountByTrendId to correctly block re-processing.
  const result = await pool.query(
    `INSERT INTO trends (id, keyword, source, score, region, fetched_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (keyword)
     DO UPDATE SET fetched_at = EXCLUDED.fetched_at
     RETURNING *`,
    [trend.id, trend.keyword, trend.source, trend.score, trend.region, trend.fetched_at]
  );
  const row = result.rows[0];
  return { ...row, score: Number(row.score) };
}
