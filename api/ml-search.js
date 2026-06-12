module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, token } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing q' });

  const url = 'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=10';

  async function doSearch(useToken) {
    const headers = { 'Accept': 'application/json' };
    if (useToken && token) headers['Authorization'] = 'Bearer ' + token;
    const r = await fetch(url, { headers });
    return r.json();
  }

  try {
    let data = await doSearch(true);
    // If token auth failed or returned no results, retry without token
    if (token && (!data.results || data.results.length === 0 || data.error)) {
      data = await doSearch(false);
    }
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
