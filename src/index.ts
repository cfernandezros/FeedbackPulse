import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import feedbackRoutes from './routes/feedback';
import summaryRoutes from './routes/summary';
import { dashboardHtml } from './ui/dashboard';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// API routes
app.route('/api/feedback', feedbackRoutes);
app.route('/api/summary', summaryRoutes);

// Serve the dashboard UI
app.get('/', (c) => {
  return c.html(dashboardHtml);
});

export default app;
