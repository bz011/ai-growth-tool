import { NextRequest } from 'next/server';
import { getAllTrends, saveTrend } from '../../../data/trends.repo';
import { Trend } from '../../../types';
import { randomUUID } from 'crypto';

export async function GET() {
  const trends = await getAllTrends();
  return Response.json(trends);
}

export async function POST(req: NextRequest) {
  const { keyword, source, score, region } = await req.json();

  const trend: Trend = {
    id: randomUUID(),
    keyword,
    source,
    score,
    region,
    fetched_at: new Date(),
  };

  const created = await saveTrend(trend);
  return Response.json(created, { status: 201 });
}
