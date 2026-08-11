Based on the provided architecture.md for the Hassaniya Translation Manager and the structure of the previous infra-plan.md, here is a complete and well-structured Infrastructure Plan tailored to the new application.

---

Hassaniya Translation Manager – Infrastructure Plan

Version: 1.0 – Août 2026
Production‑Ready & Scalable Infrastructure

---

1. Overview

This document defines the infrastructure for Hassaniya Translation Manager, a lightweight web application for managing and translating Arabic sentences into Hassaniya, with automated export to Hugging Face.

Based on the architecture described in architecture.md, the platform consists of:

· Backend API – Node.js / Next.js API Routes (monolithic, serverless-ready)
· Frontend – Next.js App Router (React + Tailwind CSS)
· Database – PostgreSQL (transactional, single schema)
· Cache – Redis (optional, for rate limiting and export job status)
· Object Storage – None (no file storage in V1)
· External Services – Hugging Face Hub API (datasets)

The infrastructure must be production‑ready, cost‑effective, secure, and support environment separation (dev / staging / prod).

---

2. Infrastructure Components

Component Technology Purpose
Compute (Full‑Stack) Vercel / Railway / Render Next.js application (API + Frontend)
Database Neon / Supabase / AWS RDS (PostgreSQL) Managed PostgreSQL, backups, point‑in‑time recovery
Cache (Optional) Upstash Redis Rate limiting, export job status tracking
Object Storage None (V1) No file uploads; JSONL generated in memory
CDN Vercel Edge Network Automatic static asset acceleration
DNS & SSL Vercel / Cloudflare Custom domain, automatic TLS certificates
Monitoring & Logging Vercel Analytics / Sentry Error tracking, performance monitoring
CI/CD GitHub Actions / Vercel Git Integration Build, test, deploy on push
Backup & DR Neon / Supabase native Automatic daily backups, point‑in‑time recovery

---

3. Compute & Deployment

3.1 Platform Choice: Vercel (Recommended)

Why Vercel:

· Native Next.js support – Built‑in App Router, API Routes, and Edge functions
· Automatic scaling – Handles traffic spikes without configuration
· Zero‑config deployments – Git‑based CI/CD
· Global CDN – Static assets and pages served from edge locations
· Cost‑effective – Free tier for development, pay‑as‑you‑go for production
· Environment variables – Separate dev/staging/prod environments

Alternative Platforms:

Platform Pros Cons
Railway Simple, predictable pricing, good for monorepos Less Next.js optimization
Render Easy to use, built‑in PostgreSQL Higher latency for global users
AWS ECS Full control, enterprise‑ready Overkill for this project, complex setup

3.2 Deployment Configuration

Vercel Project Settings:

```json
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10,
      "memory": 1024
    }
  },
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url",
    "HUGGINGFACE_TOKEN": "@huggingface_token",
    "HUGGINGFACE_REPO": "ahmed200512/hassanie_claude-translation",
    "REDIS_URL": "@redis_url"
  }
}
```

Build Settings:

```bash
# Build command
npm run build

# Start command (production)
npm start
```

3.3 Resource Allocation

Environment Memory Function Duration Instances
Development 512 MB 5 seconds 1 (auto)
Staging 1024 MB 10 seconds 1 (auto)
Production 1024 MB 10 seconds 1-3 (auto)

---

4. Database

4.1 PostgreSQL – Neon (Recommended)

Why Neon:

· Serverless PostgreSQL – Scales to zero when idle
· Branching – Instant dev/staging branches from production
· Point‑in‑time recovery – 7‑day retention (free)
· Automatic backups – Daily snapshots
· Connection pooling – Built‑in for serverless environments
· Cost‑effective – Free tier (0.5 GB storage), pay for compute

Configuration:

```env
# Production
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/hassaniya_prod?sslmode=require

# Staging (branch from production)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/hassaniya_staging?sslmode=require

# Development (local)
DATABASE_URL=postgresql://localhost:5432/hassaniya_dev
```

Alternative Providers:

Provider Pros Cons
Supabase Free tier, built‑in auth, realtime Additional features not needed
AWS RDS Full control, enterprise support Higher cost, management overhead
Railway PostgreSQL Simple, integrated with Railway Limited global distribution

4.2 Database Schema

```sql
-- From architecture.md
CREATE TABLE sentences (
  id SERIAL PRIMARY KEY,
  arabic TEXT UNIQUE NOT NULL,
  hassaniya TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  exported_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sentences_status ON sentences(status);
CREATE INDEX idx_sentences_exported_at ON sentences(exported_at);
CREATE INDEX idx_sentences_arabic_trgm ON sentences USING gin (arabic gin_trgm_ops);
```

4.3 Backup Strategy

Provider Backup Type Retention RPO RTO
Neon Point‑in‑time recovery 7 days 1 second 2 hours
Neon Daily snapshots 30 days 24 hours 30 min
Manual pg_dump via scheduled job 90 days 24 hours 1 hour

---

5. Caching & Queue (Optional)

5.1 Redis – Upstash (Optional)

Purpose:

· Rate limiting – Store request counts per IP
· Export job status – Track export progress for async operations
· Session store – If authentication is added in V2

Why Upstash:

· Serverless Redis – Scales to zero, pay‑as‑you‑go
· Global distribution – Low latency
· Free tier – 10,000 commands/day
· Built‑in REST API – No need for persistent connections

Configuration:

```env
REDIS_URL=redis://default:password@xxx.upstash.io:6379
```

5.2 Rate Limiting Strategy

Implementation (if using Upstash):

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1m"), // 100 requests per minute
  analytics: true,
});
```

5.3 Export Job Status Tracking

Using Redis to track async exports (V2):

```typescript
// Store job status
await redis.set(`export:${jobId}`, JSON.stringify({
  status: 'processing',
  startedAt: new Date().toISOString(),
  total: 0,
  processed: 0
}), { ex: 3600 }); // Expire after 1 hour
```

---

6. External Services

6.1 Hugging Face Hub API

Purpose: Upload translated datasets to the Hugging Face repository.

Configuration:

```env
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxx
HUGGINGFACE_REPO=ahmed200512/hassanie_claude-translation
```

Authentication: API token with write permissions.

Rate Limits:

· Free tier: 30 requests per minute
· Pro tier: 100 requests per minute

6.2 Email (Optional)

If email notifications are added in V2, configure SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@hassaniya-translation.com
SMTP_PASS=xxxxxxxx
```

---

7. Network & Security

7.1 Security Headers (Vercel)

Vercel automatically provides:

· HTTPS – Automatic TLS certificates via Let's Encrypt
· DDoS protection – Built‑in Cloudflare DDoS protection
· Security headers – Can be configured via vercel.json:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

7.2 Environment Variables

All secrets stored in Vercel Environment Variables:

Variable Purpose Secret
DATABASE_URL PostgreSQL connection string ✅
HUGGINGFACE_TOKEN Hugging Face API token ✅
REDIS_URL Redis connection string (optional) ✅
SMTP_HOST Email SMTP server (optional) ✅
SMTP_PASS Email SMTP password (optional) ✅

7.3 IP Whitelisting

For database access:

· Neon: Only allow connections from Vercel IP ranges
· Or: Use connection pooling with password authentication

---

8. Environments & Separation

Environment Purpose URL Database Redis Auto‑scaling
Development Local development http://localhost:3000 Local PostgreSQL Local Redis None
Preview PR previews {pr-number}.vercel.app Neon staging branch Upstash (free) Auto
Staging Pre‑production testing staging.hassaniya-translation.com Neon staging Upstash (free) Auto
Production Live customers hassaniya-translation.com Neon production Upstash (paid) Auto (up to 3)

Environment Separation in Neon:

· Production: hassaniya_prod database
· Staging: hassaniya_staging database (branch from production)
· Development: Local database

---

9. CI/CD Pipeline

9.1 Vercel Git Integration

Workflow:

1. Developer pushes code to GitHub
2. Vercel automatically deploys:
   · main branch → Production
   · staging branch → Staging
   · pull requests → Preview deployments
3. Database migrations run via Prisma (prisma migrate deploy)

Configuration (vercel.json):

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

9.2 Database Migrations

Pre‑deployment hook (Vercel):

```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "DATABASE_URL": "@database_url"
  },
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10,
      "memory": 1024
    }
  }
}
```

Migration command:

```bash
# In package.json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postbuild": "prisma migrate deploy"
  }
}
```

---

10. Monitoring, Logging & Alerting

10.1 Logging

Vercel automatically logs:

· Request logs – All HTTP requests (method, path, status, duration)
· Function logs – console.log() and console.error() output
· Build logs – Deployment build process

Retention: 7 days (free) / 30 days (Pro)

Structured logging (backend):

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({ level: 'info', message, data, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error, timestamp: new Date().toISOString() }));
  }
};
```

10.2 Monitoring & Analytics

Tool Purpose Cost
Vercel Analytics Real‑time traffic, performance metrics Free (Pro)
Vercel Speed Insights Core Web Vitals, page performance Free (Pro)
Sentry Error tracking, crash reporting Free (5k events/month)
Better Stack Uptime monitoring, alerts Free (5 monitors)

10.3 Alerts

Metric Threshold Action
Error rate > 5% for 5 minutes Sentry alert, investigate deploy
Response time > 2000ms for 5 minutes Vercel performance alert
Database connections > 80% of max Scale Neon compute
Export job failure Any failure Email to admin
Hugging Face rate limit 429 response Alert, reduce export frequency

---

11. Backup & Disaster Recovery

11.1 Database (Neon)

· Point‑in‑time recovery: Enabled (7‑day retention)
· Daily snapshots: Retained 30 days
· Manual backup: Scheduled pg_dump to S3 (optional)

Recovery Procedure:

Scenario RTO RPO Method
Database corruption 2 hours 1 second Neon PITR restore
Accidental data deletion 1 hour 1 second Neon PITR restore to timestamp
Full database failure 4 hours 1 hour Restore from daily snapshot

11.2 Code & Configuration

· Source code: GitHub (redundant, versioned)
· Environment variables: Vercel (redundant, encrypted)
· Infrastructure: vercel.json + next.config.js in Git

11.3 Vercel Rollback

Vercel supports instant rollback to any previous deployment:

1. Go to Vercel Dashboard → Project → Deployments
2. Select previous deployment
3. Click "Promote to Production"

Rollback time: < 1 minute

---

12. Scalability Strategy (V1 → V2)

Layer V1 (MVP / Launch) V2 (Growth)
Compute Vercel (auto‑scaling) Vercel Pro (auto‑scaling)
Database Neon (0.5 GB) Neon (5 GB) or Supabase
Redis Upstash (Free) Upstash (Pro, 100k commands/day)
Rate limiting In‑memory / Upstash Upstash with distributed rate limiting
Export jobs Synchronous (≤ 10s) Asynchronous (BullMQ + Redis)
Monitoring Basic Vercel Sentry + Better Stack + Logtail
CDN Vercel Edge Network Vercel Edge + Cloudflare (custom)

Scale triggers:

· Response time > 1000ms → Check database queries
· Error rate > 2% → Investigate and rollback
· Export time > 10 seconds → Move to async job queue (V2)

---

13. Cost Estimation (Vercel + Neon)

Service Configuration Monthly (approx)
Vercel Pro ($20/month) + 1,000 build minutes $20
Neon 0.5 GB storage + 100 compute hours $19
Upstash Free tier (10k commands/day) $0
Sentry Free (5k events/month) $0
Better Stack Free (5 monitors) $0
Total  ~ $39 / month

Free Tier Alternative:

· Vercel Hobby (free) – 100 build minutes/month, 100 GB bandwidth
· Neon Free (0.5 GB storage) – 10 compute hours/month
· Upstash Free (10k commands/day)

For light usage, the entire stack can run for free.

---

14. Ports & Service Summary

Service Port Protocol Access
Frontend 3000 HTTP Public (Vercel)
Backend API 3000 (same) HTTP Internal (Vercel)
PostgreSQL 5432 TCP Internal (Neon)
Redis 6379 TCP Internal (Upstash)
Hugging Face API 443 HTTPS Outbound

Note: Vercel does not expose separate ports; all traffic goes through port 443 (HTTPS).

---

15. Deployment Runbook (First Production Release)

15.1 Pre‑Launch Checklist

· Vercel project created and configured
· Environment variables set (DATABASE_URL, HUGGINGFACE_TOKEN, etc.)
· Neon database provisioned and migrated (prisma migrate deploy)
· Database connection tested
· Hugging Face token valid and has write permissions
· Custom domain configured (DNS records)
· SSL/TLS certificates provisioned (auto via Vercel)
· Rate limiting configured (if using Upstash)
· Monitoring tools set up (Sentry, Better Stack)
· Backup schedule confirmed (Neon PITR)
· Rollback procedure documented

15.2 Deployment Steps

1. Push code to main branch:
   ```bash
   git push origin main
   ```
2. Vercel automatically builds and deploys:
   · Build logs available in Vercel Dashboard
   · Preview deployment generated
3. Run database migrations:
   ```bash
   vercel run prisma migrate deploy
   ```
4. Verify deployment:
   · Access production URL
   · Test critical paths:
     · Dashboard loads
     · Can add sentences
     · Can update translations
     · Export preview works
     · Export to HF works
5. Monitor for 24 hours:
   · Error logs (Vercel / Sentry)
   · Response times
   · Database connections

15.3 Rollback Procedure

```bash
# Option 1: Vercel Dashboard (recommended)
# 1. Go to Production Deployment
# 2. Click "Promote to Production" for previous deployment

# Option 2: CLI
vercel promote <previous-deployment-url>
```

---

16. Appendices

A. Vercel Project Configuration (vercel.json)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

B. Environment Variables Setup

```env
# Required
DATABASE_URL=postgresql://...
HUGGINGFACE_TOKEN=hf_...

# Optional (V2)
REDIS_URL=redis://...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@...
SMTP_PASS=...

# Next.js / Vercel
NODE_ENV=production
```

C. Database Migration Command

```bash
# Development
npx prisma migrate dev --name init

# Staging / Production
npx prisma migrate deploy
```

D. Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        huggingface: 'configured'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        huggingface: 'configured'
      }
    }, { status: 503 });
  }
}
```

E. Environment Separation Checklist

Item Dev Staging Production
Vercel Project hassaniya-translation-dev hassaniya-translation-staging hassaniya-translation
Database Local PostgreSQL Neon (staging branch) Neon (production)
Redis Local Upstash (free) Upstash (paid)
Hugging Face Repo test-{user}/... ahmed200512/hassanie_claude-translation Same as staging
Rate Limits None 50 req/min 100 req/min
Log Retention 7 days 30 days 30 days
Backup Frequency None Daily snapshots Continuous PITR

---

Fin du document – Infrastructure Plan Hassaniya Translation Manager V1.0