import { runTrendsJob } from '../../../../jobs/trends.job';

// Called once per day by the scheduler.
// Set CRON_SECRET in env and pass it as: Authorization: Bearer <secret>
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await runTrendsJob();
    return Response.json({ message: 'Daily pipeline completed', timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ message: `Daily pipeline failed: ${message}` }, { status: 500 });
  }
}
