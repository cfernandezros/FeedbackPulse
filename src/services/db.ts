import { Env, FeedbackItem } from '../types';

export async function getAllFeedback(
  db: Env['DB'],
  filters: { source?: string; sentiment?: string; urgency?: string }
): Promise<FeedbackItem[]> {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.source) {
    conditions.push('source = ?');
    params.push(filters.source);
  }
  if (filters.sentiment) {
    conditions.push('sentiment = ?');
    params.push(filters.sentiment);
  }
  if (filters.urgency) {
    conditions.push('urgency = ?');
    params.push(filters.urgency);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT * FROM feedback${where} ORDER BY created_at DESC`;

  const result = await db.prepare(query).bind(...params).all<FeedbackItem>();
  return result.results;
}

export async function insertFeedback(
  db: Env['DB'],
  item: { source: string; content: string; author: string; created_at?: string }
): Promise<void> {
  await db
    .prepare('INSERT INTO feedback (source, content, author, created_at) VALUES (?, ?, ?, ?)')
    .bind(item.source, item.content, item.author, item.created_at || new Date().toISOString())
    .run();
}

export async function updateAnalysis(
  db: Env['DB'],
  id: number,
  analysis: { sentiment: string; urgency: string; themes: string[] }
): Promise<void> {
  await db
    .prepare('UPDATE feedback SET sentiment = ?, urgency = ?, themes = ?, analyzed_at = ? WHERE id = ?')
    .bind(analysis.sentiment, analysis.urgency, JSON.stringify(analysis.themes), new Date().toISOString(), id)
    .run();
}

export async function getUnanalyzedFeedback(db: Env['DB']): Promise<FeedbackItem[]> {
  const result = await db
    .prepare('SELECT * FROM feedback WHERE analyzed_at IS NULL ORDER BY created_at DESC')
    .all<FeedbackItem>();
  return result.results;
}

export async function getFeedbackById(db: Env['DB'], id: number): Promise<FeedbackItem | null> {
  return db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first<FeedbackItem>();
}

export async function clearFeedback(db: Env['DB']): Promise<void> {
  await db.prepare('DELETE FROM feedback').run();
}
