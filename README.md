# FeedbackPulse

A product feedback aggregator that uses AI to analyze and summarize customer feedback from multiple sources. Built entirely on Cloudflare's developer platform.

## What It Does

FeedbackPulse collects product feedback from various channels (Discord, GitHub, Twitter, Support tickets) and uses AI to:

- **Classify sentiment** — positive, neutral, or negative
- **Determine urgency** — low, medium, or high priority
- **Extract themes** — automatically tag feedback with relevant topics (api, billing, documentation, etc.)
- **Generate summaries** — create executive summaries with actionable insights

## Features

- Dashboard with real-time stats and sentiment distribution
- Filter feedback by source, sentiment, and urgency
- One-click AI analysis of all feedback items
- AI-generated executive summaries for stakeholder reports
- Mock data seeding for demo purposes

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com/) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge) |
| AI | [Workers AI](https://developers.cloudflare.com/workers-ai/) (Llama 3.1 8B Instruct) |
| Framework | [Hono](https://hono.dev/) |
| Frontend | Vanilla JS + [Tailwind CSS](https://tailwindcss.com/) (via CDN) |
| Language | TypeScript |

## Architecture

```
Browser → Worker (Hono router)
              ├── env.DB  → D1 (read/write feedback)
              └── env.AI  → Workers AI (analyze/summarize)
```

**Why D1?** Feedback data is structured and relational — filtering by source, sentiment, and urgency requires indexed queries, making SQL a natural fit. D1 runs within the Worker runtime with zero connection overhead and no egress costs.

**Why Workers AI?** Eliminates external API dependencies, keys, and billing. Inference runs on Cloudflare's edge GPUs colocated with the Worker, keeping latency low and the entire stack on one platform.

## Project Structure

```
src/
├── index.ts              # Hono app entry point
├── types.ts              # TypeScript interfaces
├── routes/
│   ├── feedback.ts       # Feedback CRUD + analysis endpoints
│   └── summary.ts        # AI summary generation
├── services/
│   ├── ai.ts             # Workers AI wrapper
│   └── db.ts             # D1 query helpers
├── data/
│   └── mock.ts           # 25 realistic mock feedback items
└── ui/
    └── dashboard.ts      # Inline HTML dashboard
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Dashboard UI |
| `GET` | `/api/feedback` | List feedback (supports `?source=`, `?sentiment=`, `?urgency=` filters) |
| `POST` | `/api/feedback/seed` | Populate database with mock data |
| `POST` | `/api/feedback/analyze` | Run AI analysis on unanalyzed items |
| `GET` | `/api/summary` | Generate AI executive summary |

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed via npm)
- Cloudflare account

### Installation

```bash
# Clone the repo
git clone https://github.com/cfernandezros/FeedbackPulse.git
cd FeedbackPulse

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create the D1 database
npx wrangler d1 create feedback-pulse-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`.

### Run Locally

```bash
# Apply schema to local DB
npx wrangler d1 execute feedback-pulse-db --local --file=./schema.sql

# Start dev server
npx wrangler dev
```

Note: AI features require remote access to Cloudflare. If `wrangler dev` times out, deploy to production to test AI.

### Deploy to Production

```bash
# Apply schema to remote DB
npx wrangler d1 execute feedback-pulse-db --remote --file=./schema.sql

# Deploy
npx wrangler deploy
```

Your app will be live at `https://feedback-pulse.<your-subdomain>.workers.dev`

## Usage

1. Open the dashboard URL
2. Click **Seed Mock Data** to populate the database
3. Click **Analyze All** to run AI classification on all items
4. Use the filters to explore feedback by source, sentiment, or urgency
5. Click **Generate AI Summary** for an executive overview

## License

MIT
