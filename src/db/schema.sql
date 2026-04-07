CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE post_status AS ENUM ('draft', 'pending_approval', 'published');
CREATE TYPE topic_suggestion_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  score NUMERIC(10, 2) NOT NULL DEFAULT 0,
  region TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE topic_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
  suggested_title TEXT NOT NULL,
  suggested_outline JSONB NOT NULL DEFAULT '[]',
  status topic_suggestion_status NOT NULL DEFAULT 'pending',
  opportunity_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trend_id, suggested_title)
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  language TEXT NOT NULL,
  status post_status NOT NULL DEFAULT 'draft',
  internal_links JSONB NOT NULL DEFAULT '[]',
  cta_text TEXT NOT NULL,
  optimization_report JSONB,
  opportunity_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
