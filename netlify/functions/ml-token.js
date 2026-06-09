// Exchange authorization code for access token
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const ML_CLIENT_ID = process.env.ML_CLIENT_ID;
  const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
  const REDIRECT_URI = process.env.ML_REDIRECT_URI;

  try {
    const { code, refresh_token, grant_type } = JSON.parse(event.body);

    let body = 'client_id=' + ML_CLIENT_ID + '&client_secret=' + ML_CLIENT_SECRET;
    if (grant_type === 'refresh_token') {
      body += '&grant_type=refresh_token&refresh_token=' + refresh_token;
    } else {
      body += '&grant_type=authorization_code&code=' + code + '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    }

    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: body
    });

    const data = await res.json();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
