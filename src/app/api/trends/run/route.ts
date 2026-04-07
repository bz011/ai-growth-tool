import { runTrendsJob } from '../../../../jobs/trends.job';

export async function POST() {
  try {
    await runTrendsJob();
    return Response.json({ message: 'Trends job completed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ message: `Trends job failed: ${message}` }, { status: 500 });
  }
}
