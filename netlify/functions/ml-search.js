// ML search using user access token passed from browser
exports.handler = async function(event) {
  const q = event.queryStringParameters && event.queryStringParameters.q;
  const token = event.queryStringParameters && event.queryStringParameters.token;
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: 'Missing q' }) };

  try {
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(
      'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=10',
      { headers }
    );
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
