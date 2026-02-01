import { Hono } from 'hono';
import { Env } from '../types';
import { getAllFeedback } from '../services/db';
import { generateSummary } from '../services/ai';

const app = new Hono<{ Bindings: Env }>();

// GET /api/summary - generate AI executive summary of all feedback
app.get('/', async (c) => {
  const items = await getAllFeedback(c.env.DB, {});

  if (items.length === 0) {
    return c.json({ error: 'No feedback to summarize. Seed data first.' }, 400);
  }

  // Only summarize analyzed items for better results
  const analyzed = items.filter((i) => i.analyzed_at);
  if (analyzed.length === 0) {
    return c.json({ error: 'No analyzed feedback yet. Run /api/feedback/analyze first.' }, 400);
  }

  const summary = await generateSummary(c.env.AI, analyzed);

  // Compute stats to return alongside the summary
  const stats = {
    total: items.length,
    analyzed: analyzed.length,
    sentiment: {
      positive: analyzed.filter((i) => i.sentiment === 'positive').length,
      neutral: analyzed.filter((i) => i.sentiment === 'neutral').length,
      negative: analyzed.filter((i) => i.sentiment === 'negative').length,
    },
    urgent: analyzed.filter((i) => i.urgency === 'high').length,
  };

  return c.json({ summary, stats });
});

export default app;
