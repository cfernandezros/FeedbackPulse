import { Env } from '../types';

// Cast needed: model string may not be in the bundled type definitions yet
const MODEL = '@cf/meta/llama-3.1-8b-instruct' as any;

// Analyze a single feedback item for sentiment, urgency, and themes
export async function analyzeFeedback(
  ai: Env['AI'],
  content: string
): Promise<{ sentiment: string; urgency: string; themes: string[] }> {
  const response = await ai.run(MODEL, {
    messages: [
      {
        role: 'system',
        content: `You are a product feedback analyst. Given a piece of user feedback, respond with ONLY a JSON object (no markdown, no explanation) with these fields:
- "sentiment": one of "positive", "neutral", or "negative"
- "urgency": one of "low", "medium", or "high" (high = production issues or blocked users, medium = significant pain points, low = suggestions or praise)
- "themes": array of 1-3 short lowercase kebab-case tags (e.g. "api", "rate-limits", "documentation", "billing", "dx", "feature-request", "performance", "workers-ai", "d1")`,
      },
      { role: 'user', content },
    ],
  });

  try {
    const text = (response as { response: string }).response;
    // Extract JSON from the response, handling possible markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      sentiment: parsed.sentiment,
      urgency: parsed.urgency,
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    };
  } catch {
    // Fallback if AI returns unparseable output
    return { sentiment: 'neutral', urgency: 'low', themes: ['unclassified'] };
  }
}

// Generate an executive summary across all feedback
export async function generateSummary(
  ai: Env['AI'],
  feedbackItems: { content: string; sentiment: string | null; urgency: string | null; themes: string }[]
): Promise<string> {
  const feedbackBlock = feedbackItems
    .map((f, i) => `[${i + 1}] (${f.sentiment}, ${f.urgency}) ${f.content}`)
    .join('\n');

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const urgentCount = feedbackItems.filter((f) => f.urgency === 'high').length;
  for (const f of feedbackItems) {
    if (f.sentiment && f.sentiment in sentimentCounts) {
      sentimentCounts[f.sentiment as keyof typeof sentimentCounts]++;
    }
  }

  // Collect all themes
  const themeCounts: Record<string, number> = {};
  for (const f of feedbackItems) {
    try {
      const themes: string[] = JSON.parse(f.themes);
      for (const t of themes) {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      }
    } catch {}
  }
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => `${theme} (${count})`);

  const response = await ai.run(MODEL, {
    messages: [
      {
        role: 'system',
        content: `You are a product manager writing an executive summary of user feedback. Be concise and actionable. Use markdown formatting.`,
      },
      {
        role: 'user',
        content: `Here is recent product feedback (${feedbackItems.length} items):

${feedbackBlock}

Stats:
- Sentiment: ${sentimentCounts.positive} positive, ${sentimentCounts.neutral} neutral, ${sentimentCounts.negative} negative
- Urgent items: ${urgentCount}
- Top themes: ${topThemes.join(', ')}

Write a brief executive summary with: 1) Overview, 2) Top themes & patterns, 3) Urgent items needing attention, 4) Recommended actions. Keep it under 300 words.`,
      },
    ],
  });

  return (response as { response: string }).response;
}
