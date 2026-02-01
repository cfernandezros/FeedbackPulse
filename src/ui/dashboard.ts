// Dashboard HTML served inline from the Worker (no static asset hosting needed)
export const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FeedbackPulse</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .loader { border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; width: 20px; height: 20px; animation: spin .6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-bg { background: rgba(0,0,0,0.5); }
  </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen">
  <!-- Header -->
  <header class="bg-indigo-600 text-white px-6 py-4 shadow">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <h1 class="text-2xl font-bold tracking-tight">FeedbackPulse</h1>
      <span class="text-indigo-200 text-sm">Product Feedback Aggregator</span>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-6 py-8 space-y-6">
    <!-- Action buttons -->
    <div class="flex gap-3 flex-wrap">
      <button onclick="seedData()" id="btn-seed" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Seed Mock Data</button>
      <button onclick="analyzeAll()" id="btn-analyze" class="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition">Analyze All</button>
      <button onclick="showSummary()" id="btn-summary" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">Generate AI Summary</button>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats">
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-sm text-gray-500">Total Feedback</div>
        <div class="text-3xl font-bold" id="stat-total">-</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-sm text-gray-500">Positive</div>
        <div class="text-3xl font-bold text-emerald-600" id="stat-positive">-</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-sm text-gray-500">Negative</div>
        <div class="text-3xl font-bold text-red-500" id="stat-negative">-</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-sm text-gray-500">Urgent</div>
        <div class="text-3xl font-bold text-amber-500" id="stat-urgent">-</div>
      </div>
    </div>

    <!-- Sentiment bar -->
    <div class="bg-white rounded-xl shadow p-4">
      <div class="text-sm text-gray-500 mb-2">Sentiment Distribution</div>
      <div class="flex h-4 rounded-full overflow-hidden bg-gray-200" id="sentiment-bar"></div>
      <div class="flex gap-4 mt-2 text-xs text-gray-500" id="sentiment-legend"></div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap items-center">
      <select id="filter-source" onchange="loadFeedback()" class="bg-white border rounded-lg px-3 py-2 text-sm">
        <option value="">All Sources</option>
        <option value="discord">Discord</option>
        <option value="github">GitHub</option>
        <option value="twitter">Twitter</option>
        <option value="support">Support</option>
      </select>
      <select id="filter-sentiment" onchange="loadFeedback()" class="bg-white border rounded-lg px-3 py-2 text-sm">
        <option value="">All Sentiments</option>
        <option value="positive">Positive</option>
        <option value="neutral">Neutral</option>
        <option value="negative">Negative</option>
      </select>
      <select id="filter-urgency" onchange="loadFeedback()" class="bg-white border rounded-lg px-3 py-2 text-sm">
        <option value="">All Urgency</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>

    <!-- Feedback list -->
    <div id="feedback-list" class="space-y-3"></div>
    <div id="loading" class="text-center text-gray-400 py-8 hidden"><span class="loader"></span> Loading...</div>
    <div id="empty" class="text-center text-gray-400 py-8 hidden">No feedback yet. Click "Seed Mock Data" to get started.</div>
  </main>

  <!-- Summary modal -->
  <div id="modal" class="fixed inset-0 modal-bg hidden items-center justify-center z-50 p-4" onclick="if(event.target===this)closeModal()">
    <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">AI Executive Summary</h2>
        <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
      </div>
      <div id="modal-content" class="prose prose-sm max-w-none"></div>
    </div>
  </div>

<script>
const SOURCE_ICONS = { discord: '\u{1F4AC}', github: '\u{1F4BB}', twitter: '\u{1F426}', support: '\u{1F3AB}' };
const SENTIMENT_COLORS = { positive: 'emerald', neutral: 'gray', negative: 'red' };
const URGENCY_COLORS = { low: 'blue', medium: 'amber', high: 'red' };

async function api(path, opts) {
  const res = await fetch(path, opts);
  return res.json();
}

async function loadFeedback() {
  const params = new URLSearchParams();
  const s = document.getElementById('filter-source').value;
  const se = document.getElementById('filter-sentiment').value;
  const u = document.getElementById('filter-urgency').value;
  if (s) params.set('source', s);
  if (se) params.set('sentiment', se);
  if (u) params.set('urgency', u);

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('feedback-list').innerHTML = '';
  document.getElementById('empty').classList.add('hidden');

  const data = await api('/api/feedback?' + params.toString());
  document.getElementById('loading').classList.add('hidden');

  if (!data.items || data.items.length === 0) {
    document.getElementById('empty').classList.remove('hidden');
    updateStats([]);
    return;
  }

  updateStats(data.items);

  document.getElementById('feedback-list').innerHTML = data.items.map(item => {
    const themes = (() => { try { return JSON.parse(item.themes || '[]'); } catch { return []; } })();
    const sentimentBadge = item.sentiment
      ? '<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-' + SENTIMENT_COLORS[item.sentiment] + '-100 text-' + SENTIMENT_COLORS[item.sentiment] + '-700">' + item.sentiment + '</span>'
      : '<span class="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">unanalyzed</span>';
    const urgencyBadge = item.urgency
      ? '<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-' + URGENCY_COLORS[item.urgency] + '-100 text-' + URGENCY_COLORS[item.urgency] + '-700">' + item.urgency + ' urgency</span>'
      : '';
    const themeTags = themes.map(t => '<span class="inline-block px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-600">' + t + '</span>').join(' ');

    return '<div class="bg-white rounded-xl shadow p-4">' +
      '<div class="flex items-start justify-between gap-2 mb-2">' +
        '<div class="flex items-center gap-2">' +
          '<span class="text-lg" title="' + item.source + '">' + (SOURCE_ICONS[item.source] || '') + '</span>' +
          '<span class="text-xs text-gray-400">' + item.source + '</span>' +
          '<span class="text-xs text-gray-300">' + item.author + '</span>' +
        '</div>' +
        '<div class="flex gap-1.5">' + sentimentBadge + urgencyBadge + '</div>' +
      '</div>' +
      '<p class="text-sm text-gray-700 mb-2">' + escapeHtml(item.content) + '</p>' +
      (themeTags ? '<div class="flex gap-1.5 flex-wrap">' + themeTags + '</div>' : '') +
    '</div>';
  }).join('');
}

function updateStats(items) {
  document.getElementById('stat-total').textContent = items.length;
  const pos = items.filter(i => i.sentiment === 'positive').length;
  const neg = items.filter(i => i.sentiment === 'negative').length;
  const neu = items.filter(i => i.sentiment === 'neutral').length;
  const urgent = items.filter(i => i.urgency === 'high').length;
  document.getElementById('stat-positive').textContent = pos;
  document.getElementById('stat-negative').textContent = neg;
  document.getElementById('stat-urgent').textContent = urgent;

  // Sentiment bar
  const total = pos + neg + neu || 1;
  const bar = document.getElementById('sentiment-bar');
  bar.innerHTML =
    '<div class="bg-emerald-400" style="width:' + (pos/total*100) + '%"></div>' +
    '<div class="bg-gray-300" style="width:' + (neu/total*100) + '%"></div>' +
    '<div class="bg-red-400" style="width:' + (neg/total*100) + '%"></div>';
  document.getElementById('sentiment-legend').innerHTML =
    '<span>Positive: ' + pos + '</span><span>Neutral: ' + neu + '</span><span>Negative: ' + neg + '</span>';
}

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

async function seedData() {
  const btn = document.getElementById('btn-seed');
  btn.disabled = true; btn.textContent = 'Seeding...';
  await api('/api/feedback/seed', { method: 'POST' });
  btn.disabled = false; btn.textContent = 'Seed Mock Data';
  loadFeedback();
}

async function analyzeAll() {
  const btn = document.getElementById('btn-analyze');
  btn.disabled = true; btn.textContent = 'Analyzing...';
  await api('/api/feedback/analyze', { method: 'POST' });
  btn.disabled = false; btn.textContent = 'Analyze All';
  loadFeedback();
}

async function showSummary() {
  const btn = document.getElementById('btn-summary');
  btn.disabled = true; btn.textContent = 'Generating...';
  const data = await api('/api/summary');
  btn.disabled = false; btn.textContent = 'Generate AI Summary';

  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');

  if (data.error) {
    content.innerHTML = '<p class="text-red-500">' + data.error + '</p>';
  } else {
    // Simple markdown-like rendering
    content.innerHTML = data.summary
      .replace(/\\n/g, '\\n')
      .replace(/^### (.+)$/gm, '<h3 class="font-bold mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-1">$1</h1>')
      .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/\\n/g, '<br>');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modal').classList.remove('flex');
}

// Load on page init
loadFeedback();
</script>
</body>
</html>`;
