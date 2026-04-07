export type PostStatus = 'draft' | 'pending_approval' | 'published';

export type Language = 'en' | 'ar';

export type TopicSuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface GscData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TopicOpportunityAnalysis {
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

export interface Post {
  id: string;
  title: string;
  slug: string;
  body: string;
  meta_title: string;
  meta_description: string;
  language: Language;
  status: PostStatus;
  internal_links: Array<{ title: string; url: string }>;
  cta_text: string;
  opportunity_analysis?: TopicOpportunityAnalysis | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface Trend {
  id: string;
  keyword: string;
  source: string;
  score: number;
  region: string;
  fetched_at: Date;
}

export interface OptimizationReport {
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
  finalContent: string;
}

export interface TopicSuggestion {
  id: string;
  trend_id: string;
  suggested_title: string;
  suggested_outline: string[];
  status: TopicSuggestionStatus;
  created_at: Date;
  opportunity_analysis?: TopicOpportunityAnalysis | null;
}
