'use client';

import { useCallback, useEffect, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────
interface Trend {
  id: string; keyword: string; source: string;
  region: string; score: number; fetched_at: string;
}
interface TopicOpportunityAnalysis {
  primaryKeyword: string;
  secondaryKeywords: string[];
  longtailVariants: string[];
  relatedQuestions: string[];
  intentLabel: string;
  demandScore: number;
  relevanceScore: number;
  intentClarityScore: number;
  competitionScore: number;
  topicalCoverageScore: number;
  opportunityScore: number;
  serperValidated: boolean;
}
interface Topic {
  id: string; suggested_title: string; suggested_outline: string[];
  status: string; trend_id: string;
  opportunity_analysis?: TopicOpportunityAnalysis | null;
}
interface OptimizationReport {
  seoScore: number;
  readabilityScore: number;
  intentMatchScore: number;
  ctrScore: number;
  contentDepthScore: number;
  internalLinkScore: number;
  issueFlags: string[];
  improvementsApplied: string[];
  finalTitle: string;
  finalMetaDescription: string;
  finalSlug: string;
}

interface GscData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Post {
  id: string; title: string; status: string; slug: string;
  body: string; meta_title: string; meta_description: string; created_at: string;
  optimization_report?: OptimizationReport | null;
  opportunity_analysis?: TopicOpportunityAnalysis | null;
  postUrl?: string | null;
  gsc?: GscData | null;
  gscConfigured?: boolean;
}

// ── Design tokens ─────────────────────────────────────────────────
const C = {
  bg:       '#f4f6fa',
  surface:  '#ffffff',
  border:   '#e2e8f0',
  heading:  '#0f172a',
  body:     '#334155',
  muted:    '#94a3b8',
  primary:  '#4f46e5',
  danger:   '#dc2626',
  success:  '#16a34a',
  warning:  '#d97706',
  shadow:   '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
  shadowSm: '0 1px 2px rgba(0,0,0,0.06)',
};

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: 'Pending',        bg: '#fef9c3', color: '#854d0e' },
  accepted:         { label: 'Accepted',       bg: '#dbeafe', color: '#1d4ed8' },
  rejected:         { label: 'Rejected',       bg: '#fee2e2', color: '#991b1b' },
  draft:            { label: 'Draft',          bg: '#f1f5f9', color: '#475569' },
  pending_approval: { label: 'Needs approval', bg: '#ffedd5', color: '#c2410c' },
  published:        { label: 'Published',      bg: '#dcfce7', color: '#15803d' },
};

// ── Components ────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const b = BADGE[status] ?? { label: status, bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20, background: b.bg, color: b.color,
    }}>{b.label}</span>
  );
}

function ActionTag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      color, padding: '2px 7px', borderRadius: 4, border: `1px solid ${color}`, opacity: 0.8,
    }}>{label}</span>
  );
}

function KpiCard({ label, value, accent, sub }: { label: string; value: number; accent: string; sub?: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 130, background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, padding: '18px 20px', boxShadow: C.shadowSm,
    }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 5, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: accent, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function FilterTabs<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3, width: 'fit-content' }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            padding: '5px 13px', fontSize: 12, fontWeight: active ? 700 : 500,
            borderRadius: 6, border: 'none', cursor: 'pointer',
            background: active ? C.surface : 'transparent',
            color: active ? C.heading : C.muted,
            boxShadow: active ? C.shadowSm : 'none',
          }}>
            {opt.label}{opt.count !== undefined ? ` (${opt.count})` : ''}
          </button>
        );
      })}
    </div>
  );
}

function PrimaryBtn({ label, loadingLabel, loading, disabled, onClick }: {
  label: string; loadingLabel?: string; loading?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8,
      border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      background: disabled || loading ? '#c7d2fe' : C.primary, color: '#fff',
    }}>
      {loading ? (loadingLabel ?? '...') : label}
    </button>
  );
}

function SecondaryBtn({ label, loadingLabel, loading, disabled, onClick }: {
  label: string; loadingLabel?: string; loading?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
      border: `1px solid ${C.border}`, cursor: disabled || loading ? 'not-allowed' : 'pointer',
      background: '#fff', color: disabled || loading ? C.muted : C.body,
    }}>
      {loading ? (loadingLabel ?? '...') : label}
    </button>
  );
}

function DangerBtn({ label, loadingLabel, loading, disabled, onClick }: {
  label: string; loadingLabel?: string; loading?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
      border: '1px solid #fecaca', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      background: '#fff1f2', color: disabled || loading ? '#fca5a5' : C.danger,
    }}>
      {loading ? (loadingLabel ?? '...') : label}
    </button>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? C.success : value >= 50 ? C.warning : C.danger;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: C.body }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}/100</span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function OptimizationPanel({ report }: { report: OptimizationReport }) {
  const [open, setOpen] = useState(false);
  const avg = Math.round(
    (report.seoScore + report.readabilityScore + report.intentMatchScore +
     report.ctrScore + report.contentDepthScore + report.internalLinkScore) / 6
  );
  const avgColor = avg >= 75 ? C.success : avg >= 50 ? C.warning : C.danger;
  return (
    <div style={{ marginTop: 12, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', padding: '10px 14px', background: '#f8fafc', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.body }}>Optimization Report</span>
        <span style={{
          fontSize: 12, fontWeight: 800, color: avgColor,
          background: avg >= 75 ? '#dcfce7' : avg >= 50 ? '#fef9c3' : '#fee2e2',
          padding: '2px 8px', borderRadius: 12,
        }}>
          {avg}/100 avg
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: 14 }}>
            <ScoreBar label="SEO"            value={report.seoScore} />
            <ScoreBar label="Readability"    value={report.readabilityScore} />
            <ScoreBar label="Intent Match"   value={report.intentMatchScore} />
            <ScoreBar label="CTR Potential"  value={report.ctrScore} />
            <ScoreBar label="Content Depth"  value={report.contentDepthScore} />
            <ScoreBar label="Internal Links" value={report.internalLinkScore} />
          </div>

          {report.issueFlags.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, marginBottom: 4 }}>Issues detected</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: C.body, lineHeight: 1.8 }}>
                {report.issueFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {report.improvementsApplied.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.success, marginBottom: 4 }}>Improvements applied</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: C.body, lineHeight: 1.8 }}>
                {report.improvementsApplied.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OpportunityPanel({ analysis }: { analysis: TopicOpportunityAnalysis }) {
  const [open, setOpen] = useState(false);
  const score = analysis.opportunityScore;
  const scoreColor = score >= 70 ? C.success : score >= 45 ? C.warning : C.danger;
  const scoreBg    = score >= 70 ? '#dcfce7' : score >= 45 ? '#fef9c3' : '#fee2e2';
  const verdict    = score >= 70 ? 'Strong opportunity' : score >= 45 ? 'Moderate opportunity' : 'Weak opportunity';

  return (
    <div style={{ marginTop: 10, border: `2px solid ${scoreColor}22`, borderRadius: 10, overflow: 'hidden', background: scoreBg + '55' }}>
      {/* Always-visible summary row */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 12, color: scoreColor, fontWeight: 700 }}>/100</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{verdict}</div>
          <div style={{ fontSize: 11, color: C.muted }}>Topic Opportunity Score</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '3px 8px', borderRadius: 10, textTransform: 'capitalize' }}>
            {analysis.intentLabel}
          </span>
          {analysis.serperValidated && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0891b2', background: '#e0f2fe', padding: '3px 8px', borderRadius: 10 }}>
              Google SERP validated
            </span>
          )}
        </div>
        {/* Inline mini score bars */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {[
            { label: 'Demand', value: analysis.demandScore },
            { label: 'Relevance', value: analysis.relevanceScore },
            { label: 'Competition', value: analysis.competitionScore },
          ].map(({ label, value }) => {
            const c = value >= 70 ? C.success : value >= 45 ? C.warning : C.danger;
            return (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{value}</div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>{label}</div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setOpen(v => !v)} style={{
          fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
        }}>
          {open ? '▲ Less' : '▼ Details'}
        </button>
      </div>

      {/* Primary keyword — always visible */}
      <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Primary keyword:</span>
        <span style={{ fontSize: 12, background: '#eff6ff', color: '#1d4ed8', padding: '2px 9px', borderRadius: 6, fontWeight: 700 }}>
          {analysis.primaryKeyword}
        </span>
        {analysis.secondaryKeywords.slice(0, 3).map((k, i) => (
          <span key={i} style={{ fontSize: 11, background: '#f1f5f9', color: C.body, padding: '2px 7px', borderRadius: 5 }}>{k}</span>
        ))}
        {analysis.secondaryKeywords.length > 3 && (
          <span style={{ fontSize: 11, color: C.muted }}>+{analysis.secondaryKeywords.length - 3} more</span>
        )}
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${C.border}`, background: '#fff' }}>
          {/* All 5 score bars */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.body, marginBottom: 8 }}>Score breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <ScoreBar label="Demand"           value={analysis.demandScore} />
              <ScoreBar label="Relevance"        value={analysis.relevanceScore} />
              <ScoreBar label="Intent Clarity"   value={analysis.intentClarityScore} />
              <ScoreBar label="Competition opp." value={analysis.competitionScore} />
              <ScoreBar label="Topical Coverage" value={analysis.topicalCoverageScore} />
            </div>
          </div>

          {/* Long-tail variants */}
          {analysis.longtailVariants.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.body, marginBottom: 5 }}>
                Long-tail variants {analysis.serperValidated ? '(from Google related searches)' : '(GPT estimated)'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {analysis.longtailVariants.map((v, i) => (
                  <span key={i} style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 5, border: '1px solid #bbf7d0' }}>{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Related questions */}
          {analysis.relatedQuestions.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.body, marginBottom: 5 }}>
                Related questions {analysis.serperValidated ? '(people also ask — live Google data)' : '(GPT estimated)'}
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: C.body, lineHeight: 2 }}>
                {analysis.relatedQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchPerformancePanel({ post }: { post: Post }) {
  if (post.status !== 'published') {
    return (
      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Search Performance</span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>No data for drafts</span>
      </div>
    );
  }

  if (!post.gscConfigured) {
    return (
      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Search Performance</span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>GSC not configured — add Google Search Console credentials to enable</span>
      </div>
    );
  }

  if (!post.gsc) {
    return (
      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Search Performance</span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>No data yet — page may not be indexed</span>
      </div>
    );
  }

  const { clicks, impressions, ctr, position } = post.gsc;
  return (
    <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 10 }}>
        Search Performance
        <span style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginLeft: 6 }}>(last 28 days · Google Search Console)</span>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Impressions', value: impressions.toLocaleString(), color: C.body },
          { label: 'Clicks',      value: clicks.toLocaleString(),      color: C.primary },
          { label: 'CTR',         value: `${ctr}%`,                   color: ctr >= 3 ? C.success : C.warning },
          { label: 'Position',    value: `#${position}`,              color: position <= 10 ? C.success : position <= 20 ? C.warning : C.danger },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      {post.postUrl && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>
          <span style={{ fontWeight: 600 }}>Live URL:</span>{' '}
          <a href={post.postUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: C.primary, textDecoration: 'none' }}>
            {post.postUrl}
          </a>
        </div>
      )}
    </div>
  );
}

function BodyPreview({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = body.split('\n');
  const hasMore = lines.length > 4;
  return (
    <div>
      <pre style={{
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit',
        fontSize: 13, lineHeight: 1.7, color: C.body,
        background: '#f8fafc', border: `1px solid ${C.border}`,
        padding: '12px 16px', borderRadius: 8, margin: 0,
        maxHeight: expanded ? 560 : 96, overflow: 'hidden',
      }}>
        {body}
      </pre>
      {hasMore && (
        <button onClick={() => setExpanded(v => !v)} style={{
          fontSize: 12, color: C.primary, background: 'none', border: 'none',
          cursor: 'pointer', padding: '5px 0', fontWeight: 600,
        }}>
          {expanded ? '▲ Collapse' : '▼ Read more'}
        </button>
      )}
    </div>
  );
}

function SectionCard({ step, title, count, children, right }: {
  step: string; title: string; count: number; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`,
      boxShadow: C.shadow, overflow: 'hidden',
    }}>
      <div style={{
        padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 7, background: C.primary, color: '#fff',
          fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{step}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.heading }}>{title}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: C.muted,
          padding: '2px 8px', borderRadius: 20,
        }}>{count}</span>
        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p style={{ color: C.muted, fontSize: 13, margin: 0, padding: '8px 0' }}>{message}</p>;
}

// ── Page ─────────────────────────────────────────────────────────
type TopicFilter = 'active' | 'rejected' | 'all';
type PostFilter  = 'draft'  | 'published' | 'all';

export default function AdminPage() {
  const [trends, setTrends]   = useState<Trend[]>([]);
  const [topics, setTopics]   = useState<Topic[]>([]);
  const [posts,  setPosts]    = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy,   setBusy]     = useState<string | null>(null);
  const [error,  setError]    = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [topicFilter,  setTopicFilter]  = useState<TopicFilter>('active');
  const [postFilter,   setPostFilter]   = useState<PostFilter>('all');
  const [showTopics,   setShowTopics]   = useState(false);
  const [showAllTrends, setShowAllTrends] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualKeyword,  setManualKeyword]  = useState('');
  const [manualRegion,   setManualRegion]   = useState('');

  const loadData = useCallback(async () => {
    const [tr, to, po] = await Promise.all([
      fetch('/api/trends', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/topics', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/posts',  { cache: 'no-store' }).then(r => r.json()),
    ]);
    setTrends(Array.isArray(tr) ? tr : []);
    setTopics(Array.isArray(to) ? to : []);
    setPosts (Array.isArray(po) ? po : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function run(key: string, fn: () => Promise<Response>, successMsg = 'Done.') {
    setBusy(key); setError(null); setSuccess(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? `Error ${res.status}`);
      } else {
        await loadData();
        setSuccess(successMsg);
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (e) { setError(String(e)); }
    finally { setBusy(null); }
  }

  async function injectManualTrend() {
    if (!manualKeyword.trim()) return;
    setBusy('manual-inject'); setError(null); setSuccess(null);
    try {
      const res = await fetch('/api/trends/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: manualKeyword.trim(), region: manualRegion.trim() || 'global' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message ?? `Error ${res.status}`);
      } else {
        await loadData();
        setSuccess(`Trend "${manualKeyword.trim()}" injected.`);
        setTimeout(() => setSuccess(null), 3500);
        setManualKeyword('');
        setManualRegion('');
        setShowManualForm(false);
      }
    } catch (e) { setError(String(e)); }
    finally { setBusy(null); }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <span style={{ color: C.muted, fontSize: 14 }}>Loading...</span>
    </div>
  );

  // ── Single source of truth for all counts and display ────────
  // Trends
  const uniqueTrends = trends.reduce<Trend[]>((acc, t) => {
    if (!acc.some(x => x.keyword.toLowerCase() === t.keyword.toLowerCase())) acc.push(t);
    return acc;
  }, []);
  const visibleTrends = showAllTrends ? uniqueTrends : uniqueTrends.slice(0, 10);

  // Topics — sorted, then filtered for display
  const sortedTopics = [...topics].sort((a, b) => {
    const order: Record<string, number> = { pending: 0, accepted: 1, rejected: 2 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });
  const filteredTopics = sortedTopics.filter(t => {
    if (topicFilter === 'active')   return t.status === 'pending' || t.status === 'accepted';
    if (topicFilter === 'rejected') return t.status === 'rejected';
    return true;
  });

  // Posts — newest first, then filtered for display
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const filteredPosts = sortedPosts.filter(p => {
    if (postFilter === 'draft')     return p.status === 'draft';
    if (postFilter === 'published') return p.status === 'published';
    return true;
  });

  // Counts — all derived from the same state arrays, used by both KPIs and filter tabs
  const totalUniqueTrends = uniqueTrends.length;   // matches Trends section after dedup
  const totalTopics       = topics.length;          // matches Topics toggle badge
  const draftCount        = posts.filter(p => p.status === 'draft').length;
  const publishedCount    = posts.filter(p => p.status === 'published').length;
  const totalPosts        = posts.length;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.body }}>

      {/* ── Header ── */}
      <div style={{ background: C.heading, color: '#fff', padding: '28px 0' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>Z</div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>ZenetexAI Growth Dashboard</h1>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Trends → Topics → Posts · Internal workflow</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#94a3b8' }}>
            <span><strong style={{ color: '#fff', fontSize: 16 }}>{totalUniqueTrends}</strong> trends</span>
            <span><strong style={{ color: '#fff', fontSize: 16 }}>{totalTopics}</strong> topics</span>
            <span><strong style={{ color: '#fff', fontSize: 16 }}>{draftCount}</strong> drafts</span>
            <span><strong style={{ color: '#fff', fontSize: 16 }}>{publishedCount}</strong> published</span>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              style={{
                padding: '5px 13px', fontSize: 12, fontWeight: 600, borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)',
                color: '#cbd5e1', cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 32px 64px' }}>

        {/* ── Alerts ── */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: C.danger, padding: '10px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: C.success, padding: '10px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
            {success}
          </div>
        )}

        {/* ── KPI row ── */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          <KpiCard label="Unique trends" value={totalUniqueTrends} accent={C.primary} />
          <KpiCard label="Topics"        value={totalTopics}       accent='#0891b2' />
          <KpiCard label="Drafts"        value={draftCount}        accent={C.body}    sub={draftCount > 0 ? 'Ready to publish' : undefined} />
          <KpiCard label="Published"     value={publishedCount}    accent={C.success} />
          <KpiCard label="Total posts"   value={totalPosts}        accent={C.muted} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ══ STEP 1: TRENDS ══ */}
          <SectionCard
            step="1" title="Trends" count={totalUniqueTrends}
            right={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {uniqueTrends.length > 10 && (
                  <button onClick={() => setShowAllTrends(v => !v)} style={{ fontSize: 12, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {showAllTrends ? 'Show fewer' : `Show all ${uniqueTrends.length}`}
                  </button>
                )}
                <SecondaryBtn
                  label={showManualForm ? '✕ Cancel' : '+ Inject Trend'}
                  onClick={() => setShowManualForm(v => !v)}
                />
              </div>
            }
          >
            {showManualForm && (
              <div style={{
                marginBottom: 16, padding: '14px 16px', borderRadius: 8,
                background: '#f8fafc', border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.body, marginBottom: 12 }}>Inject Manual Trend</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Keyword *</label>
                    <input
                      value={manualKeyword}
                      onChange={e => setManualKeyword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && injectManualTrend()}
                      placeholder="e.g. AI tools for startups"
                      style={{
                        padding: '7px 10px', fontSize: 13, borderRadius: 6, width: 260,
                        border: `1px solid ${C.border}`, outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Region</label>
                    <input
                      value={manualRegion}
                      onChange={e => setManualRegion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && injectManualTrend()}
                      placeholder="sa, ae, global…"
                      style={{
                        padding: '7px 10px', fontSize: 13, borderRadius: 6, width: 130,
                        border: `1px solid ${C.border}`, outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <PrimaryBtn
                    label="Inject"
                    loadingLabel="Injecting..."
                    loading={busy === 'manual-inject'}
                    disabled={!manualKeyword.trim() || !!busy}
                    onClick={injectManualTrend}
                  />
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                  Injected trends appear with <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>source = manual</code> and score 100.
                </div>
              </div>
            )}
            {visibleTrends.length === 0 ? (
              <EmptyState message="No trends yet. Use '+ Inject Trend' above or call POST /api/trends/run." />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Keyword', 'Region', 'Score', 'Fetched', ''].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleTrends.map(trend => (
                    <tr key={trend.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: C.heading }}>{trend.keyword}</td>
                      <td style={{ padding: '10px 10px', color: C.muted, fontSize: 12 }}>{trend.region}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: C.primary }}>{trend.score}</td>
                      <td style={{ padding: '10px 10px', color: C.muted, fontSize: 11 }}>{new Date(trend.fetched_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <PrimaryBtn
                          label="Generate Topics" loadingLabel="Generating..."
                          loading={busy === `${trend.id}:gen-topics`} disabled={!!busy}
                          onClick={() => run(
                            `${trend.id}:gen-topics`,
                            () => fetch('/api/topics/generate', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ trend_id: trend.id }),
                            }),
                            `Topics generated for "${trend.keyword}".`
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          {/* ══ STEP 2: TOPICS (secondary / collapsible) ══ */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.surface, boxShadow: C.shadowSm, overflow: 'hidden' }}>
            <button
              onClick={() => setShowTopics(v => !v)}
              style={{
                width: '100%', padding: '14px 24px', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              }}
            >
              <span style={{ width: 28, height: 28, borderRadius: 7, background: '#e2e8f0', color: C.muted, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: C.body }}>Topic Suggestions</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: C.muted, padding: '2px 8px', borderRadius: 20 }}>{topics.length}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>{showTopics ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {showTopics && (
              <div style={{ padding: '0 24px 20px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ paddingTop: 16, marginBottom: 14 }}>
                  <FilterTabs<TopicFilter>
                    value={topicFilter} onChange={setTopicFilter}
                    options={[
                      { value: 'active',   label: 'Active',   count: topics.filter(t => t.status === 'pending' || t.status === 'accepted').length },
                      { value: 'rejected', label: 'Rejected', count: topics.filter(t => t.status === 'rejected').length },
                      { value: 'all',      label: 'All',      count: topics.length },
                    ]}
                  />
                </div>
                {filteredTopics.length === 0 ? (
                  <EmptyState message="No topics in this view." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredTopics.map(topic => {
                      const isRowBusy  = busy?.startsWith(topic.id) ?? false;
                      const isPending  = topic.status === 'pending';
                      const isAccepted = topic.status === 'accepted';
                      const isRejected = topic.status === 'rejected';
                      return (
                        <div key={topic.id} style={{
                          border: `1px solid ${isAccepted ? '#bfdbfe' : C.border}`,
                          borderRadius: 8, padding: '12px 14px',
                          background: isAccepted ? '#f0f7ff' : isRejected ? '#fafafa' : C.surface,
                          opacity: isRejected ? 0.5 : 1,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isAccepted ? 8 : 0, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: C.heading, flex: 1 }}>{topic.suggested_title}</span>
                            <Badge status={topic.status} />
                          </div>
                          {topic.opportunity_analysis && (
                            <OpportunityPanel analysis={topic.opportunity_analysis} />
                          )}
                          {!isRejected && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                              {isPending && (
                                <>
                                  <SecondaryBtn label="Accept" loadingLabel="..." loading={busy === `${topic.id}:accept`} disabled={isRowBusy}
                                    onClick={() => run(`${topic.id}:accept`, () => fetch(`/api/topics/${topic.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' }) }), 'Topic accepted.')}
                                  />
                                  <DangerBtn label="Reject" loadingLabel="..." loading={busy === `${topic.id}:reject`} disabled={isRowBusy}
                                    onClick={() => run(`${topic.id}:reject`, () => fetch(`/api/topics/${topic.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }) }), 'Topic rejected.')}
                                  />
                                </>
                              )}
                              {isAccepted && (
                                <PrimaryBtn label="Generate Post" loadingLabel="Generating..." loading={busy === `${topic.id}:generate`} disabled={isRowBusy}
                                  onClick={() => run(`${topic.id}:generate`, () => fetch(`/api/topics/${topic.id}/generate`, { method: 'POST' }), 'Draft generated.')}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ STEP 3: POSTS ══ */}
          <SectionCard
            step="3" title="Posts" count={totalPosts}
            right={
              <FilterTabs<PostFilter>
                value={postFilter}
                onChange={setPostFilter}
                options={[
                  { value: 'draft',     label: 'Drafts',    count: draftCount },
                  { value: 'published', label: 'Published', count: publishedCount },
                  { value: 'all',       label: 'All',       count: totalPosts },
                ]}
              />
            }
          >
            {filteredPosts.length === 0 ? (
              <EmptyState message={
                postFilter === 'draft'     ? 'No drafts. Accept a topic and generate a post.' :
                postFilter === 'published' ? 'No published posts yet.' : 'No posts yet.'
              } />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredPosts.map(post => (
                  <div key={post.id} style={{
                    border: `1px solid ${post.status === 'published' ? '#bbf7d0' : C.border}`,
                    borderRadius: 10, padding: '16px 18px',
                    background: post.status === 'published' ? '#f0fdf4' : C.surface,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.heading, flex: 1, minWidth: 200 }}>{post.title}</span>
                      <Badge status={post.status} />
                      {post.status === 'draft' && <ActionTag label="Ready to publish" color={C.body} />}
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{post.slug}</span>
                      {post.status !== 'published' && (
                        <PrimaryBtn label="Publish" loadingLabel="Publishing..."
                          loading={busy === `${post.id}:publish`}
                          disabled={!!busy}
                          onClick={() => run(`${post.id}:publish`,
                            () => fetch(`/api/posts/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published' }) }),
                            'Post published.'
                          )}
                        />
                      )}
                      {post.status === 'published' && (
                        <>
                          <SecondaryBtn label="Republish" loadingLabel="Republishing..."
                            loading={busy === `${post.id}:republish`}
                            disabled={!!busy}
                            onClick={() => run(`${post.id}:republish`,
                              () => fetch(`/api/posts/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published' }) }),
                              'Post republished to website.'
                            )}
                          />
                          <DangerBtn label="Delete from website" loadingLabel="Deleting..."
                            loading={busy === `${post.id}:delete-web`}
                            disabled={!!busy}
                            onClick={() => run(`${post.id}:delete-web`,
                              () => fetch(`/api/posts/${post.id}`, { method: 'DELETE' }),
                              `"${post.title}" removed from website.`
                            )}
                          />
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>
                      <strong style={{ color: C.body }}>Slug:</strong>{' '}
                      <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 3 }}>{post.slug}</code>
                      {post.postUrl && (
                        <a href={post.postUrl} target="_blank" rel="noopener noreferrer"
                          style={{ marginLeft: 8, color: C.primary, fontSize: 11, fontWeight: 600 }}>
                          ↗ View live
                        </a>
                      )}
                    </div>
                    {post.meta_title && (
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>
                        <strong style={{ color: C.body }}>Meta title:</strong> {post.meta_title}
                      </div>
                    )}
                    {post.meta_description && (
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
                        <strong style={{ color: C.body }}>Meta desc:</strong> {post.meta_description}
                      </div>
                    )}
                    {post.opportunity_analysis && (
                      <OpportunityPanel analysis={post.opportunity_analysis} />
                    )}
                    {post.optimization_report && (
                      <OptimizationPanel report={post.optimization_report} />
                    )}
                    <SearchPerformancePanel post={post} />
                    <div style={{ marginTop: 12 }}>
                      <BodyPreview body={post.body} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
