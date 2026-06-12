module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  var key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_KEY not configured' });
  try {
    var body = req.body || {};
    var model = body.model || 'gemini-1.5-flash';
    var payload = { contents: body.contents, generationConfig: body.generationConfig };
    var r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    var data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
