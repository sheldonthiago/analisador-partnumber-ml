module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ML_CLIENT_ID     = process.env.ML_CLIENT_ID;
  const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
  const REDIRECT_URI     = process.env.ML_REDIRECT_URI;

  try {
    const { code, refresh_token, grant_type } = req.body;
    let body = 'client_id=' + ML_CLIENT_ID + '&client_secret=' + ML_CLIENT_SECRET;
    if (grant_type === 'refresh_token') {
      body += '&grant_type=refresh_token&refresh_token=' + refresh_token;
    } else {
      body += '&grant_type=authorization_code&code=' + code + '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    }
    const r = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
