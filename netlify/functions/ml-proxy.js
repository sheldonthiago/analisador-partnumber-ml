const ML_CLIENT_ID = process.env.ML_CLIENT_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: 'grant_type=client_credentials&client_id=' + ML_CLIENT_ID + '&client_secret=' + ML_CLIENT_SECRET
  });

  const data = await res.json();
  if (!res.ok) throw new Error('Token error: ' + JSON.stringify(data));

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

exports.handler = async function(event) {
  const q = event.queryStringParameters && event.queryStringParameters.q;
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: 'Missing q' }) };

  try {
    const token = await getToken();
    const res = await fetch(
      'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=10',
      { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' } }
    );
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
