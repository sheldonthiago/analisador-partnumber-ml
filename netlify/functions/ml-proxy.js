exports.handler = async function(event) {
  const q = event.queryStringParameters && event.queryStringParameters.q;
  if (!q) return { statusCode: 400, body: 'Missing q parameter' };

  try {
    const res = await fetch(
      'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=10',
      { headers: { 'Accept': 'application/json' } }
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
