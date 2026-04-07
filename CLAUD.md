# CLAUDE.md

## Project: ZenetexAI Autonomous Growth Agent

---

## 1. Mission

Build an AI-powered site manager integrated into the ZenetexAI website that drives business growth through:

- trend research
- content generation
- controlled publishing
- SEO monitoring
- analytics reporting

This is a real production system, not a demo.

---

## 2. Product Boundaries

The system MUST:

- operate inside the existing ZenetexAI website
- support blog creation and publishing
- require human approval before publishing (MVP)
- generate business-relevant content (not generic AI content)
- support both English and Arabic (without overcomplicating MVP)
- track performance data (analytics + SEO)

The system MUST NOT:

- auto-publish without approval (in MVP)
- act as a fully autonomous agent in early stages
- include unnecessary frameworks or complexity

---

## 3. MVP Scope (Phase 1)

Build a working content engine with:

- basic trend discovery (simple + reliable sources)
- topic suggestion
- blog draft generation (SEO-aware)
- internal linking support
- CTA generation
- draft storage
- internal approval workflow (dashboard-based)
- controlled publishing to website

---

## 4. Out of Scope (for MVP)

Do NOT build yet:

- full automation without approval
- forecasting or prediction systems
- complex multi-agent orchestration
- social media automation
- CRM integrations
- A/B testing systems

---

## 5. Engineering Principles

- keep everything simple and production-minded
- avoid over-engineering at all costs
- prefer clarity over abstraction
- use minimal dependencies
- design for real deployment, not experiments
- every component must have a clear purpose
- avoid premature optimization

---

## 6. Architecture Principles

- integrate directly into existing Next.js website
- use Next.js server capabilities unless a separate backend is clearly required
- use PostgreSQL as the primary database
- use OpenAI API for AI generation
- use scheduled jobs (cron/serverless) for automation
- structure code into clear layers:
  - routes / API layer
  - services (business logic)
  - data access
  - background jobs

- define structure BEFORE implementation

---

## 7. Data Separation Rules

NEVER mix these data types:

- trend data (external signals)
- SEO data (search console)
- analytics data (GA4 / user behavior)
- content data (blogs, drafts)

Each must have:

- separate logic
- separate storage representation
- separate processing flow

---

## 8. Workflow Rules

- always design before implementing
- validate each layer before moving forward
- keep features small and testable
- do not build multiple systems at once
- human approval is mandatory before publishing in MVP
- prioritize business value over technical perfection

---

## 9. Claude Code Behavior Rules

Claude MUST:

- generate minimal, clean, production-ready code
- avoid unnecessary files and abstractions
- avoid adding new frameworks unless clearly justified
- follow the defined architecture strictly
- keep naming consistent and clear
- not assume features that were not explicitly requested
- not expand scope without instruction
- prefer simple solutions over complex ones

---

## 10. Content Rules

Generated content MUST:

- be useful and practical
- reflect real expertise (not generic AI writing)
- be relevant to MENA audience
- support business goals (leads, conversions)
- include structured formatting (headings, sections)
- include internal linking
- include clear CTAs

---

## 11. Language Strategy

- system must support English and Arabic
- implementation should avoid doubling complexity early
- design content model to allow multi-language
- start simple, expand cleanly

---

## 12. Definition of Done (MVP Feature)

A feature is DONE only if:

- it works end-to-end
- it is testable
- it is cleanly integrated
- it follows architecture rules
- it provides real business value
- it does not introduce unnecessary complexity