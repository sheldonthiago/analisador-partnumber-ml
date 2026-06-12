module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var q = req.query && req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing q' });

  try {
    var url = 'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=12';
    var r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    var text = await r.text();
    var data = JSON.parse(text);
    return res.status(200).json({ results: data.results || [], total: (data.paging && data.paging.total) || 0 });
  } catch (e) {
    return res.status(500).json({ error: e.message, results: [] });
  }
};
