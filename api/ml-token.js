export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI } = process.env;
  try {
    const { code, refresh_token, grant_type } = req.body;
    let body = 'client_id=' + ML_CLIENT_ID + '&client_secret=' + ML_CLIENT_SECRET;
    if (grant_type === 'refresh_token') {
      body += '&grant_type=refresh_token&refresh_token=' + refresh_token;
    } else {
      body += '&grant_type=authorization_code&code=' + code + '&redirect_uri=' + encodeURIComponent(ML_REDIRECT_URI);
    }
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
