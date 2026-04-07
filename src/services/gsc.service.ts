import { createSign } from 'node:crypto';

export interface GscData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function isGscConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GSC_SITE_URL
  );
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
  // Vercel stores multiline env vars with literal \n — normalize them
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
  const signingInput = `${header}.${payload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(privateKey, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`GSC auth failed: ${data.error ?? 'unknown error'}`);
  }
  return data.access_token as string;
}

/**
 * Batch-fetches GSC search analytics for all provided slugs in a single API call.
 * Returns a map of post id → GscData. Posts with no SERP data are absent from the map.
 */
export async function fetchGscDataForPosts(
  posts: Array<{ id: string; slug: string }>
): Promise<Record<string, GscData>> {
  if (!isGscConfigured() || posts.length === 0) return {};

  const siteUrl    = process.env.GSC_SITE_URL!;
  const baseUrl    = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  const blogPrefix = (process.env.BLOG_PATH_PREFIX ?? '/blog').replace(/\/$/, '');

  try {
    const token = await getAccessToken();

    const endDate   = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 1000,
        }),
      }
    );

    if (!res.ok) return {};

    const data = await res.json();
    type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
    const rows: Row[] = data.rows ?? [];

    const result: Record<string, GscData> = {};
    for (const { id, slug } of posts) {
      const pageUrl = `${baseUrl}${blogPrefix}/${slug}`;
      const row = rows.find(
        r => r.keys[0] === pageUrl || r.keys[0].endsWith(`${blogPrefix}/${slug}`)
      );
      if (row) {
        result[id] = {
          clicks:      row.clicks,
          impressions: row.impressions,
          ctr:         Math.round(row.ctr * 10000) / 100,     // store as percentage, 2dp
          position:    Math.round(row.position * 10) / 10,    // 1dp
        };
      }
    }

    return result;
  } catch {
    // Never crash the admin because GSC is unavailable
    return {};
  }
}

/** Build the public URL for a post slug based on env config. */
export function buildPostUrl(slug: string): string | null {
  const baseUrl    = process.env.SITE_URL;
  const blogPrefix = (process.env.BLOG_PATH_PREFIX ?? '/blog').replace(/\/$/, '');
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/$/, '')}${blogPrefix}/${slug}`;
}
