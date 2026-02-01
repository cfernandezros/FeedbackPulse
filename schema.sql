CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL CHECK (source IN ('discord', 'github', 'twitter', 'support')),
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')),
  themes TEXT DEFAULT '[]', -- JSON array of theme strings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  analyzed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_urgency ON feedback(urgency);
