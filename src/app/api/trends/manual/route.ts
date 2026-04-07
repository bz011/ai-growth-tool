import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keyword, region } = body ?? {};

  if (!keyword || typeof keyword !== 'string') {
    return Response.json({ error: 'keyword is required' }, { status: 400 });
  }

  const existing = await pool.query(
    'SELECT id FROM trends WHERE keyword = $1',
    [keyword]
  );

  if (existing.rows.length > 0) {
    return Response.json(
      { success: false, message: `Keyword "${keyword}" already exists in trends` },
      { status: 409 }
    );
  }

  await pool.query(
    `INSERT INTO trends (id, keyword, source, score, region, fetched_at)
     VALUES ($1, $2, 'manual', 100, $3, NOW())`,
    [randomUUID(), keyword, region ?? 'global']
  );

  return Response.json({ success: true, keyword });
}
