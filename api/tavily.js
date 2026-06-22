export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const TAVILY_KEY = process.env.TAVILY_KEY;
  if (!TAVILY_KEY) return res.status(500).json({ error: 'TAVILY_KEY not configured' });
  try {
    const { query, max_results } = req.body;
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, max_results: max_results || 5, search_depth: 'advanced', include_answer: true })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
