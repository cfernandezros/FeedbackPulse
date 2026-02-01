import { Hono } from 'hono';
import { Env } from '../types';
import { getAllFeedback, insertFeedback, getUnanalyzedFeedback, getFeedbackById, updateAnalysis, clearFeedback } from '../services/db';
import { analyzeFeedback } from '../services/ai';
import { mockFeedback } from '../data/mock';

const app = new Hono<{ Bindings: Env }>();

// GET /api/feedback - list feedback with optional filters
app.get('/', async (c) => {
  const source = c.req.query('source');
  const sentiment = c.req.query('sentiment');
  const urgency = c.req.query('urgency');

  const items = await getAllFeedback(c.env.DB, { source, sentiment, urgency });
  return c.json({ items, count: items.length });
});

// POST /api/feedback/seed - populate DB with mock data
app.post('/seed', async (c) => {
  await clearFeedback(c.env.DB);
  for (const item of mockFeedback) {
    await insertFeedback(c.env.DB, item);
  }
  return c.json({ message: `Seeded ${mockFeedback.length} feedback items`, count: mockFeedback.length });
});

// POST /api/feedback/analyze - analyze unanalyzed items (or a specific ID via ?id=)
app.post('/analyze', async (c) => {
  const idParam = c.req.query('id');
  let items;

  if (idParam) {
    const item = await getFeedbackById(c.env.DB, parseInt(idParam));
    if (!item) return c.json({ error: 'Feedback not found' }, 404);
    items = [item];
  } else {
    items = await getUnanalyzedFeedback(c.env.DB);
  }

  if (items.length === 0) {
    return c.json({ message: 'No items to analyze', analyzed: 0 });
  }

  let analyzed = 0;
  for (const item of items) {
    try {
      const analysis = await analyzeFeedback(c.env.AI, item.content);
      await updateAnalysis(c.env.DB, item.id, analysis);
      analyzed++;
    } catch (err) {
      console.error(`Failed to analyze feedback ${item.id}:`, err);
    }
  }

  return c.json({ message: `Analyzed ${analyzed} items`, analyzed });
});

export default app;
