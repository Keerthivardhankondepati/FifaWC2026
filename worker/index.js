const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    let upstreamUrl;

    if (url.pathname === '/scoreboard') {
      const dates = url.searchParams.get('dates') || '';
      upstreamUrl = `${ESPN_BASE}/scoreboard?dates=${dates}`;
    } else if (url.pathname === '/summary') {
      const event = url.searchParams.get('event') || '';
      upstreamUrl = `${ESPN_BASE}/summary?event=${event}`;
    } else {
      return new Response('Not found', { status: 404, headers: CORS_HEADERS });
    }

    try {
      const upstream = await fetch(upstreamUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};
