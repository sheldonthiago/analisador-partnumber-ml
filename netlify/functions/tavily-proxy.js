exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TAVILY_KEY = process.env.TAVILY_KEY;
  if (!TAVILY_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'TAVILY_KEY not configured' }) };
  }

  try {
    const { query } = JSON.parse(event.body);
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query + ' site:mercadolivre.com.br',
        max_results: 10,
        search_depth: 'basic',
        include_domains: ['mercadolivre.com.br']
      })
    });

    const data = await res.json();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
