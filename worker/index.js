const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

// All 104 match kickoff times in UTC (EDT = UTC-4)
const MATCH_KICKOFFS_UTC = [
  // Jun 11 — Group A
  '2026-06-11T19:00Z', // Mexico vs South Africa
  '2026-06-12T02:00Z', // Korea Republic vs Czechia
  // Jun 12 — Groups B, D
  '2026-06-12T19:00Z', // Canada vs Bosnia and Herzegovina
  '2026-06-13T01:00Z', // United States vs Paraguay
  // Jun 13 — Groups C, D, B
  '2026-06-13T04:00Z', // Australia vs Türkiye
  '2026-06-13T19:00Z', // Qatar vs Switzerland
  '2026-06-13T22:00Z', // Brazil vs Morocco
  '2026-06-14T01:00Z', // Haiti vs Scotland
  // Jun 14 — Groups E, F
  '2026-06-14T17:00Z', // Germany vs Curaçao
  '2026-06-14T20:00Z', // Netherlands vs Japan
  '2026-06-14T23:00Z', // Côte d\'Ivoire vs Ecuador
  '2026-06-15T02:00Z', // Sweden vs Tunisia
  // Jun 15 — Groups G, H
  '2026-06-15T16:00Z', // Spain vs Cabo Verde
  '2026-06-15T19:00Z', // Belgium vs Egypt
  '2026-06-15T22:00Z', // Saudi Arabia vs Uruguay
  '2026-06-16T01:00Z', // Iran vs New Zealand
  // Jun 16 — Groups I, J
  '2026-06-16T04:00Z', // Austria vs Jordan
  '2026-06-16T19:00Z', // France vs Senegal
  '2026-06-16T22:00Z', // Iraq vs Norway
  '2026-06-17T01:00Z', // Argentina vs Algeria
  // Jun 17 — Groups K, L
  '2026-06-17T17:00Z', // Portugal vs Congo DR
  '2026-06-17T20:00Z', // England vs Croatia
  '2026-06-17T23:00Z', // Ghana vs Panama
  '2026-06-18T02:00Z', // Uzbekistan vs Colombia
  // Jun 18 — Groups A, B
  '2026-06-18T16:00Z', // Czechia vs South Africa
  '2026-06-18T19:00Z', // Switzerland vs Bosnia and Herzegovina
  '2026-06-18T22:00Z', // Canada vs Qatar
  '2026-06-19T01:00Z', // Mexico vs Korea Republic
  // Jun 19 — Groups C, D
  '2026-06-19T19:00Z', // United States vs Australia
  '2026-06-19T22:00Z', // Scotland vs Morocco
  '2026-06-20T01:00Z', // Brazil vs Haiti
  '2026-06-20T03:00Z', // Türkiye vs Paraguay
  // Jun 20 — Groups E, F
  '2026-06-20T04:00Z', // Tunisia vs Japan
  '2026-06-20T17:00Z', // Netherlands vs Sweden
  '2026-06-20T20:00Z', // Germany vs Côte d\'Ivoire
  '2026-06-21T00:00Z', // Ecuador vs Curaçao
  // Jun 21 — Groups G, H
  '2026-06-21T16:00Z', // Spain vs Saudi Arabia
  '2026-06-21T19:00Z', // Belgium vs Iran
  '2026-06-21T22:00Z', // Uruguay vs Cabo Verde
  '2026-06-22T01:00Z', // New Zealand vs Egypt
  // Jun 22 — Groups I, J
  '2026-06-22T17:00Z', // Argentina vs Austria
  '2026-06-22T21:00Z', // France vs Iraq
  '2026-06-23T00:00Z', // Norway vs Senegal
  '2026-06-23T03:00Z', // Jordan vs Algeria
  // Jun 23 — Groups K, L
  '2026-06-23T17:00Z', // Portugal vs Uzbekistan
  '2026-06-23T20:00Z', // England vs Ghana
  '2026-06-23T23:00Z', // Panama vs Croatia
  '2026-06-24T02:00Z', // Colombia vs Congo DR
  // Jun 24 — Groups A, B, C (final matchday)
  '2026-06-24T19:00Z', // Switzerland vs Canada + Bosnia vs Qatar
  '2026-06-24T22:00Z', // Scotland vs Brazil + Morocco vs Haiti
  '2026-06-25T01:00Z', // Czechia vs Mexico + South Africa vs Korea Republic
  // Jun 25 — Groups D, E, F (final matchday)
  '2026-06-25T20:00Z', // Curaçao vs Côte d\'Ivoire + Ecuador vs Germany
  '2026-06-25T23:00Z', // Japan vs Sweden + Tunisia vs Netherlands
  '2026-06-26T02:00Z', // Türkiye vs United States + Paraguay vs Australia
  // Jun 26 — Groups G, H, I (final matchday)
  '2026-06-26T19:00Z', // Norway vs France + Senegal vs Iraq
  '2026-06-27T00:00Z', // Cabo Verde vs Saudi Arabia + Uruguay vs Spain
  '2026-06-27T03:00Z', // Egypt vs Iran + New Zealand vs Belgium
  // Jun 27 — Groups J, K, L (final matchday)
  '2026-06-27T21:00Z', // Panama vs England + Croatia vs Ghana
  '2026-06-27T23:30Z', // Colombia vs Portugal + Congo DR vs Uzbekistan
  '2026-06-28T02:00Z', // Algeria vs Austria + Jordan vs Argentina
  // Round of 32
  '2026-06-28T19:00Z', // R32 #73
  '2026-06-29T17:00Z', // R32 #76
  '2026-06-29T20:30Z', // R32 #74
  '2026-06-30T01:00Z', // R32 #75
  '2026-06-30T17:00Z', // R32 #78
  '2026-06-30T21:00Z', // R32 #77
  '2026-07-01T01:00Z', // R32 #79
  '2026-07-01T16:00Z', // R32 #80
  '2026-07-01T20:00Z', // R32 #82
  '2026-07-02T00:00Z', // R32 #81
  '2026-07-02T19:00Z', // R32 #84
  '2026-07-02T23:00Z', // R32 #83
  '2026-07-03T03:00Z', // R32 #85
  '2026-07-03T18:00Z', // R32 #88
  '2026-07-03T22:00Z', // R32 #86
  '2026-07-04T01:30Z', // R32 #87
  // Round of 16
  '2026-07-04T17:00Z', // R16 #90
  '2026-07-04T21:00Z', // R16 #89
  '2026-07-05T20:00Z', // R16 #91
  '2026-07-06T00:00Z', // R16 #92
  '2026-07-06T19:00Z', // R16 #93
  '2026-07-07T00:00Z', // R16 #94
  '2026-07-07T16:00Z', // R16 #95
  '2026-07-07T20:00Z', // R16 #96
  // Quarter-finals
  '2026-07-09T20:00Z', // QF #97
  '2026-07-10T19:00Z', // QF #98
  '2026-07-11T21:00Z', // QF #99
  '2026-07-12T01:00Z', // QF #100
  // Semi-finals
  '2026-07-14T19:00Z', // SF #101
  '2026-07-15T19:00Z', // SF #102
  // Third Place + Final
  '2026-07-18T21:00Z', // Third Place #103
  '2026-07-19T19:00Z', // Final #104
];

const WINDOW_BEFORE_MS = 50 * 60 * 1000;  // 50 min before kickoff (lineups)
const WINDOW_AFTER_MS  = 120 * 60 * 1000; // 120 min after kickoff (full time)

function isInMatchWindow(nowMs) {
  for (const iso of MATCH_KICKOFFS_UTC) {
    const kick = Date.parse(iso);
    if (nowMs >= kick - WINDOW_BEFORE_MS && nowMs <= kick + WINDOW_AFTER_MS) return true;
  }
  return false;
}

function etDateString(date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
}

async function fetchAndStoreScoreboard(env) {
  const todayEt = etDateString(new Date());
  try {
    const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${todayEt}`);
    const data = await res.text();
    await env.KV.put(`scoreboard:${todayEt}`, data, { expirationTtl: 70 });
  } catch(e) {
    console.error('Cron scoreboard fetch failed:', e);
  }
}

export default {
  // Cron trigger — fires every minute, but only fetches ESPN during match windows
  async scheduled(event, env, ctx) {
    if (isInMatchWindow(Date.now())) {
      ctx.waitUntil(fetchAndStoreScoreboard(env));
      ctx.waitUntil(
        fetch('https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings')
          .then(r => r.text())
          .then(d => env.KV.put('standings', d, { expirationTtl: 120 }))
          .catch(e => console.error('Cron standings fetch failed:', e))
      );
    }
  },

  // HTTP handler — serves KV data to frontend; falls back to ESPN on KV miss
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/scoreboard') {
      const dates = url.searchParams.get('dates');
      if (!dates) return new Response('Missing dates param', { status: 400, headers: CORS_HEADERS });

      let data = await env.KV.get(`scoreboard:${dates}`);

      if (!data) {
        try {
          const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dates}`);
          data = await res.text();
          const todayEt = etDateString(new Date());
          const isPastDate = dates < todayEt;
          let ttl;
          if (isPastDate) {
            ttl = null; // permanent — past dates never change
          } else if (isInMatchWindow(Date.now())) {
            ttl = 70;   // match window — refresh fast
          } else {
            ttl = 300;  // today but no match — 5 min is fine
          }
          await env.KV.put(
            `scoreboard:${dates}`,
            data,
            ttl ? { expirationTtl: ttl } : undefined
          );
        } catch(e) {
          return new Response('ESPN unavailable', { status: 503, headers: CORS_HEADERS });
        }
      }

      return new Response(data, {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    if (url.pathname === '/summary') {
      const event = url.searchParams.get('event');
      if (!event) return new Response('Missing event param', { status: 400, headers: CORS_HEADERS });

      const kvKey = `summary:${event}`;

      // Serve from KV if cached (only FT matches are stored here)
      let data = await env.KV.get(kvKey);
      if (data) {
        return new Response(data, {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      try {
        const res = await fetch(`${ESPN_BASE}/summary?event=${event}`);
        data = await res.text();

        // Cache permanently in KV if the match is completed — FT data never changes
        try {
          const parsed = JSON.parse(data);
          const isCompleted = parsed?.header?.competitions?.[0]?.status?.type?.completed === true;
          if (isCompleted) {
            await env.KV.put(kvKey, data); // no expiration — permanent
          }
        } catch(e) { /* don't cache if unparseable */ }

        return new Response(data, {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      } catch(e) {
        return new Response('ESPN unavailable', { status: 503, headers: CORS_HEADERS });
      }
    }

    if (url.pathname === '/standings') {
      let data = await env.KV.get('standings');
      if (!data) {
        try {
          const res = await fetch(
            'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings'
          );
          if (res.ok) {
            data = await res.text();
            const standingsTtl = isInMatchWindow(Date.now()) ? 120 : 600;
            await env.KV.put('standings', data, { expirationTtl: standingsTtl });
          } else {
            return new Response('Standings unavailable', { status: 503, headers: CORS_HEADERS });
          }
        } catch(e) {
          return new Response('Standings unavailable', { status: 503, headers: CORS_HEADERS });
        }
      }
      return new Response(data, {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', ts: Date.now() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  },
};
