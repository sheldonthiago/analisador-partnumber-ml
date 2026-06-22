export default async function handler(req, res) {
  const { q, token } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing q' });
  try {
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const response = await fetch(
      'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=10',
      { headers }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
