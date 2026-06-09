import { TEAMS } from '../data/teams.js';
import { GROUPS } from '../data/groups.js';

// ─── Constants ────────────────────────────────────────────────────────────────

// June 11, 2026 20:00 UTC — opening match kickoff
const TOURNAMENT_START = new Date('2026-06-11T20:00:00Z');

const GLOSSARY = [
  {
    term: 'Offside',
    def: 'A player is offside if they are closer to the opponent\'s goal than both the ball and the second-to-last defender when the ball is passed to them. It stops attackers from camping near the goal. VAR now uses sub-millimetre tracking lines to check offside — it is that precise.',
  },
  {
    term: 'VAR',
    def: 'Video Assistant Referee. A system where officials review critical decisions — goals, penalties, red cards, and mistaken identity — using multiple camera angles. Checks take 1–3 minutes on average and can overturn on-field decisions.',
  },
  {
    term: 'Clean Sheet',
    def: 'When a goalkeeper and their team prevent the opposition from scoring for the entire match. Zero goals conceded. Goalkeepers take enormous pride in clean sheets — it is the defensive equivalent of a perfect game.',
  },
  {
    term: 'Hat-trick',
    def: 'When a single player scores three goals in one match. One of the rarest and most celebrated achievements in football. The term originally comes from cricket in the 1850s, when a bowler taking three wickets in a row earned a new hat.',
  },
  {
    term: 'Extra Time',
    def: 'In knockout rounds, if a match is level after 90 minutes, two extra 15-minute halves are played. Teams switch ends after the first period. If still tied after 30 minutes of extra time, the match is decided by a penalty shootout.',
  },
  {
    term: 'Penalty Shootout',
    def: 'When extra time cannot separate the teams. Each side chooses five players to take turns shooting from the penalty spot — 12 yards out, one-on-one with the goalkeeper. If still tied after five kicks each, it becomes sudden death: one miss and you are out.',
  },
  {
    term: 'Yellow Card',
    def: 'A caution shown for dangerous fouls, timewasting, or dissent. Collect two yellow cards in the same match and you receive an automatic red card and are sent off. Yellows also accumulate across matches — too many means a suspension for the next game.',
  },
  {
    term: 'Red Card',
    def: 'Immediate ejection from the match for violent conduct, serious foul play, or two yellow cards. The team plays the rest of the match with 10 players. No replacement is allowed — the gap stays open for the remainder of the game.',
  },
  {
    term: 'Group Stage',
    def: 'The opening phase of the tournament. All 48 teams split into 12 groups of 4. Every team plays the other 3 in their group. The top 2 from each group qualify automatically. The 8 best third-place finishers also advance — making 32 teams total.',
  },
  {
    term: 'Knockout Round',
    def: 'From the Round of 32 onwards, every match is sudden death — lose and you go home. No second chances, no group standings to cushion the fall. This is where the tournament becomes genuinely nerve-wracking for even experienced fans.',
  },
];

const CONF_COLORS = {
  UEFA:      '#4A90D9',
  CONCACAF:  '#00BFA5',
  CONMEBOL:  '#E53935',
  CAF:       '#FF8F00',
  AFC:       '#7B1FA2',
  OFC:       '#2E7D32',
};

const COUNTRY_ISO = {
  'Mexico': 'mx', 'South Africa': 'za', 'South Korea': 'kr', 'Czechia': 'cz',
  'Canada': 'ca', 'Bosnia and Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'United States': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', 'Ivory Coast': 'ci', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'Iran': 'ir', 'New Zealand': 'nz',
  'Spain': 'es', 'Cape Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Norway': 'no', 'Iraq': 'iq',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'DR Congo': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa',
};

const PLAYERS_WATCH = [
  {
    tier: 1, label: 'The Stars', sub: 'Best in the world right now',
    players: [
      { name: 'Kylian Mbappé',     country: 'France',    iso: 'fr',     club: 'Real Madrid',    pos: 'Forward',    stat: 'World Cup winner at 19',              init: 'KM',  conf: 'UEFA'     },
      { name: 'Erling Haaland',    country: 'Norway',    iso: 'no',     club: 'Man City',        pos: 'Forward',    stat: '91 goals in 97 games for City',       init: 'EH',  conf: 'UEFA'     },
      { name: 'Vinicius Jr',       country: 'Brazil',    iso: 'br',     club: 'Real Madrid',     pos: 'Forward',    stat: 'Ballon d\'Or 2024',                   init: 'VJ',  conf: 'CONMEBOL' },
      { name: 'Jude Bellingham',   country: 'England',   iso: 'gb-eng', club: 'Real Madrid',     pos: 'Midfielder', stat: '23 goals in debut season at RM',      init: 'JB',  conf: 'UEFA'     },
      { name: 'Lamine Yamal',      country: 'Spain',     iso: 'es',     club: 'Barcelona',       pos: 'Forward',    stat: 'Euro 2024 winner at 16',              init: 'LY',  conf: 'UEFA'     },
      { name: 'Federico Valverde', country: 'Uruguay',   iso: 'uy',     club: 'Real Madrid',     pos: 'Midfielder', stat: '3× Champions League winner',          init: 'FV',  conf: 'CONMEBOL' },
      { name: 'Ousmane Dembélé',   country: 'France',    iso: 'fr',     club: 'PSG',             pos: 'Forward',    stat: '40+ goal contributions 2024–25',      init: 'OD',  conf: 'UEFA'     },
      { name: 'Bruno Fernandes',   country: 'Portugal',  iso: 'pt',     club: 'Man United',      pos: 'Midfielder', stat: 'Portugal captain, 60+ int\'l goals',  init: 'BF',  conf: 'UEFA'     },
    ],
  },
  {
    tier: 2, label: 'The Legends', sub: 'Icons making their final runs',
    players: [
      { name: 'Lionel Messi',      country: 'Argentina', iso: 'ar',     club: 'Inter Miami',     pos: 'Forward',    stat: 'World Cup winner 2022, 8× Ballon d\'Or', init: 'LM',  conf: 'CONMEBOL' },
      { name: 'Cristiano Ronaldo', country: 'Portugal',  iso: 'pt',     club: 'Al Nassr',        pos: 'Forward',    stat: '900+ career goals',                   init: 'CR',  conf: 'UEFA'     },
      { name: 'Luka Modrić',       country: 'Croatia',   iso: 'hr',     club: 'AC Milan',        pos: 'Midfielder', stat: '2018 WC finalist, Ballon d\'Or 2018', init: 'LMo', conf: 'UEFA'     },
      { name: 'Mohamed Salah',     country: 'Egypt',     iso: 'eg',     club: 'Liverpool',       pos: 'Forward',    stat: 'Egypt\'s greatest ever player',       init: 'MS',  conf: 'CAF'      },
      { name: 'Virgil van Dijk',   country: 'Netherlands', iso: 'nl',   club: 'Liverpool',       pos: 'Defender',   stat: 'Regarded as world\'s best CB',        init: 'VVD', conf: 'UEFA'     },
      { name: 'Thibaut Courtois',  country: 'Belgium',   iso: 'be',     club: 'Real Madrid',     pos: 'Goalkeeper', stat: '2022 WC Golden Glove winner',         init: 'TC',  conf: 'UEFA'     },
      { name: 'Declan Rice',       country: 'England',   iso: 'gb-eng', club: 'Arsenal',         pos: 'Midfielder', stat: 'PL Player of the Year 2024',          init: 'DR',  conf: 'UEFA'     },
      { name: 'Raphinha',          country: 'Brazil',    iso: 'br',     club: 'Barcelona',       pos: 'Forward',    stat: '27 goals for Barca 2024–25',          init: 'RA',  conf: 'CONMEBOL' },
      { name: 'Pedri',             country: 'Spain',     iso: 'es',     club: 'Barcelona',       pos: 'Midfielder', stat: 'Spain\'s creative heartbeat',         init: 'PE',  conf: 'UEFA'     },
      { name: 'Julián Álvarez',    country: 'Argentina', iso: 'ar',     club: 'Atlético Madrid', pos: 'Forward',    stat: '4 goals at 2022 World Cup',           init: 'JA',  conf: 'CONMEBOL' },
      { name: 'Sadio Mané',        country: 'Senegal',   iso: 'sn',     club: 'Al Nassr',        pos: 'Forward',    stat: 'AFCON winner, Africa\'s finest',      init: 'SM',  conf: 'CAF'      },
      { name: 'Edin Džeko',        country: 'Bosnia and Herzegovina', iso: 'ba', club: 'FC Schalke 04', pos: 'Forward', stat: 'Bosnia\'s all-time top scorer', init: 'ED', conf: 'UEFA' },
      { name: 'Guillermo Ochoa',   country: 'Mexico',    iso: 'mx',     club: 'AEL Limassol',    pos: 'Goalkeeper', stat: '5 consecutive World Cups',            init: 'GO',  conf: 'CONCACAF' },
      { name: 'Rodri',             country: 'Spain',     iso: 'es',     club: 'Man City',        pos: 'Midfielder', stat: 'Ballon d\'Or 2024, Euro winner',      init: 'RO',  conf: 'UEFA'     },
      { name: 'Neymar Jr',         country: 'Brazil',    iso: 'br',     club: 'Santos',          pos: 'Forward',    stat: 'Brazil\'s record scorer (79 goals)',  init: 'NJ',  conf: 'CONMEBOL' },
    ],
  },
  {
    tier: 3, label: 'The Ones to Watch', sub: 'Breakout stars of this generation',
    players: [
      { name: 'Florian Wirtz',     country: 'Germany',   iso: 'de',     club: 'Bayer Leverkusen', pos: 'Midfielder', stat: 'Treble winner, 18 goals 2024–25',     init: 'FW',  conf: 'UEFA'     },
      { name: 'Jamal Musiala',     country: 'Germany',   iso: 'de',     club: 'Bayern Munich',   pos: 'Midfielder', stat: 'Germany\'s electric playmaker',       init: 'JM',  conf: 'UEFA'     },
      { name: 'Nico Paz',          country: 'Argentina', iso: 'ar',     club: 'Como',            pos: 'Midfielder', stat: 'Rising star at 20',                   init: 'NP',  conf: 'CONMEBOL' },
      { name: 'Scott McTominay',   country: 'Scotland',  iso: 'gb-sct', club: 'Napoli',          pos: 'Midfielder', stat: 'Scotland\'s talisman, Serie A star',  init: 'SM2', conf: 'UEFA'     },
      { name: 'Viktor Gyökeres',   country: 'Sweden',    iso: 'se',     club: 'Sporting CP',     pos: 'Forward',    stat: '46 goals in 2024–25 season',          init: 'VG',  conf: 'UEFA'     },
      { name: 'Désiré Doué',       country: 'France',    iso: 'fr',     club: 'PSG',             pos: 'Forward',    stat: 'France\'s next superstar at 19',      init: 'DD',  conf: 'UEFA'     },
      { name: 'Vitinha',           country: 'Portugal',  iso: 'pt',     club: 'PSG',             pos: 'Midfielder', stat: 'Portugal\'s midfield engine',         init: 'VI',  conf: 'UEFA'     },
      { name: 'Michael Olise',     country: 'France',    iso: 'fr',     club: 'Bayern Munich',   pos: 'Forward',    stat: '22 goals, 15 assists 2024–25',        init: 'MO',  conf: 'UEFA'     },
      { name: 'Achraf Hakimi',     country: 'Morocco',   iso: 'ma',     club: 'PSG',             pos: 'Defender',   stat: 'Africa\'s best right back',           init: 'AH',  conf: 'CAF'      },
      { name: 'Rúben Dias',        country: 'Portugal',  iso: 'pt',     club: 'Man City',        pos: 'Defender',   stat: 'City\'s defensive cornerstone',       init: 'RD',  conf: 'UEFA'     },
      { name: 'Bukayo Saka',       country: 'England',   iso: 'gb-eng', club: 'Arsenal',         pos: 'Forward',    stat: 'England\'s most consistent performer', init: 'BS', conf: 'UEFA'     },
      { name: 'Gavi',              country: 'Spain',     iso: 'es',     club: 'Barcelona',       pos: 'Midfielder', stat: 'Spain double winner at 20',           init: 'GA',  conf: 'UEFA'     },
      { name: 'Antoine Semenyo',   country: 'Ghana',     iso: 'gh',     club: 'Man City',        pos: 'Forward',    stat: 'Ghana\'s electric winger',            init: 'AS',  conf: 'CAF'      },
    ],
  },
];

const WC_MOMENTS = [
  { year: '1986', flags: ['ar', 'gb-eng'], title: 'Hand of God + Goal of the Century',
    desc: 'Maradona scored the most controversial goal in history — then, four minutes later, the greatest. Both in one quarter-final. Argentina beat England 2–1.',
    yt: 'Maradona Hand of God Goal of the Century 1986 World Cup' },
  { year: '2022', flags: ['ar', 'fr'], title: 'The Greatest Final Ever',
    desc: 'France came back from 2–0 down to level at 3–3 in extra time. Mbappé hat-trick vs Messi\'s Argentina. Decided on penalties. Called the greatest sporting event of modern times.',
    yt: 'Argentina France 2022 World Cup Final full highlights' },
  { year: '2010', flags: ['es', 'nl'], title: 'Iniesta\'s Extra Time Winner',
    desc: 'Spain\'s first-ever World Cup. 0–0 after 90 minutes. Iniesta volleyed home in extra time. The goal that made a generation fall in love with tiki-taka.',
    yt: 'Iniesta goal 2010 World Cup Final Spain Netherlands' },
  { year: '2002', flags: ['kr', 'de'], title: 'South Korea\'s Miracle Run',
    desc: 'The co-hosts knocked out Portugal, Spain, and Italy to reach the semi-finals — the greatest overachievement in World Cup history. Their nation went delirious.',
    yt: 'South Korea 2002 World Cup miracle run highlights' },
  { year: '1950', flags: ['uy', 'br'], title: 'The Maracanazo',
    desc: 'Uruguay beat Brazil in the deciding match before 200,000 fans at the Maracanã. Brazil expected to win. The stadium went silent. Uruguay lifted the trophy.',
    yt: 'Maracanazo 1950 World Cup Uruguay Brazil' },
  { year: '1966', flags: ['gb-eng', 'de'], title: 'Geoff Hurst\'s Hat-trick Final',
    desc: 'England beat West Germany 4–2 at Wembley. Hurst scored a hat-trick — the only player ever to do so in a World Cup final. England\'s only World Cup title.',
    yt: 'England West Germany 1966 World Cup Final Geoff Hurst' },
  { year: '1970', flags: ['br', 'it'], title: 'Brazil\'s Greatest Team',
    desc: 'Pelé\'s final World Cup. Brazil beat Italy 4–1 in the final with football so beautiful it became the sport\'s gold standard. Still the greatest team ever assembled.',
    yt: 'Brazil 1970 World Cup greatest team Pele highlights' },
  { year: '2014', flags: ['de', 'br'], title: 'Germany 7–1 Brazil',
    desc: 'The host nation, at home, destroyed 7–1 in the semi-final. Five German goals in 18 first-half minutes. Brazil\'s greatest humiliation on their own soil.',
    yt: 'Germany Brazil 7-1 2014 World Cup semifinal highlights' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function posLabel(pos) {
  return { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' }[pos] || pos;
}

function spiceEmoji(level) {
  const filled = Math.min(5, Math.round((level / 10) * 5));
  return '🔥'.repeat(filled) + '·'.repeat(5 - filled);
}

function groupTeams(teams) {
  const map = {};
  for (const t of teams) {
    if (!map[t.group]) map[t.group] = [];
    map[t.group].push(t);
  }
  return map;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function initCountdown() {
  const el = document.getElementById('countdown');
  const days  = document.getElementById('cd-days');
  const hours = document.getElementById('cd-hours');
  const mins  = document.getElementById('cd-mins');
  const secs  = document.getElementById('cd-secs');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = TOURNAMENT_START - Date.now();
    if (diff <= 0) {
      el.innerHTML = '<div class="countdown-live">⚽ Tournament is live!</div>';
      return;
    }
    days.textContent  = pad(Math.floor(diff / 86400000));
    hours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    mins.textContent  = pad(Math.floor((diff % 3600000)  / 60000));
    secs.textContent  = pad(Math.floor((diff % 60000)    / 1000));
  }

  tick();
  setInterval(tick, 1000);
}

// ─── Teams Grid ───────────────────────────────────────────────────────────────

function renderTeamsGrid() {
  const container = document.getElementById('teams-grid');
  const grouped = groupTeams(TEAMS);
  const letters = Object.keys(grouped).sort();

  container.innerHTML = letters.map(letter => {
    const cards = grouped[letter].map(t => {
      const iso = COUNTRY_ISO[t.country];
      const flagHtml = iso
        ? `<span class="fi fi-${iso} team-flag-icon"></span>`
        : `<span class="team-flag">${t.flag_emoji || ''}</span>`;
      const confColor = CONF_COLORS[t.confederation] || '#444';
      return `
        <button class="team-card${t.spotlight ? ' spotlight' : ''}"
                data-country="${esc(t.country)}"
                style="--conf-color:${confColor}"
                aria-label="View ${esc(t.country)}">
          ${flagHtml}
          <span class="team-name">${esc(t.country)}</span>
          <span class="team-conf" style="background:${confColor}">${esc(t.confederation)}</span>
          ${t.spotlight ? '<span class="team-spotlight-badge">★ Spotlight</span>' : ''}
        </button>
      `;
    }).join('');

    return `
      <div class="group-block">
        <h3 class="group-label">Group ${letter}</h3>
        <div class="group-cards">${cards}</div>
      </div>
    `;
  }).join('');
}

// ─── Group Previews ───────────────────────────────────────────────────────────

function renderGroupPreviews() {
  const container = document.getElementById('groups-grid');

  container.innerHTML = GROUPS.map(g => {
    const topFixture = (g.fixture_spice || []).reduce(
      (best, f) => (f.spice_level > (best?.spice_level ?? 0) ? f : best),
      null
    );

    const callouts = `
      <div class="gp-callouts">
        ${g.favorite ? `
          <div class="callout">
            <span class="callout-icon">⭐</span>
            <div>
              <strong>Favourite</strong>
              <span>${esc(g.favorite.country)}</span>
              <p>${esc(g.favorite.reason)}</p>
            </div>
          </div>` : ''}
        ${g.dark_horse ? `
          <div class="callout">
            <span class="callout-icon">🐴</span>
            <div>
              <strong>Dark Horse</strong>
              <span>${esc(g.dark_horse.country)}</span>
              <p>${esc(g.dark_horse.reason)}</p>
            </div>
          </div>` : ''}
      </div>
    `;

    const fixtureHtml = topFixture ? `
      <p class="gp-section-title">Top Fixture</p>
      <div class="top-fixture">
        <div class="fixture-match">${esc(topFixture.match)}</div>
        <div class="fixture-story">${esc(topFixture.story)}</div>
        <div class="fixture-spice">${spiceEmoji(topFixture.spice_level)} ${topFixture.spice_level}/10</div>
      </div>
    ` : '';

    const tableRows = (g.projected_table || []).map(row => {
      const cls = row.status.toLowerCase().includes('likely') ? 'qualified'
        : row.status.toLowerCase().includes('third') ? 'third' : 'underdog';
      return `<tr>
        <td class="pt-pos">${row.position}</td>
        <td class="pt-country">${esc(row.country)}</td>
        <td><span class="pt-status ${cls}">${esc(row.status)}</span></td>
      </tr>`;
    }).join('');

    const tableHtml = tableRows ? `
      <p class="gp-section-title">Projected Standings</p>
      <table class="projected-table">
        <thead><tr><th>#</th><th>Team</th><th>Outlook</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    ` : '';

    const heartbreak = g.heartbreak_watch ? `
      <div class="heartbreak">
        💔 <strong>Heartbreak watch:</strong> ${esc(g.heartbreak_watch.country)} — ${esc(g.heartbreak_watch.reason)}
      </div>
    ` : '';

    return `
      <div class="group-preview-card">
        <button class="group-preview-header" aria-expanded="false">
          <span class="gp-label">${esc(g.group)}</span>
          <span class="gp-teams">${(g.teams || []).map(esc).join(' · ')}</span>
          <span class="gp-toggle" aria-hidden="true">▼</span>
        </button>
        <div class="group-preview-body" hidden>
          <p class="gp-intro">${esc(g.group_intro)}</p>
          ${callouts}
          ${fixtureHtml}
          ${tableHtml}
          ${heartbreak}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.group-preview-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.querySelector('.gp-toggle').textContent = expanded ? '▼' : '▲';
      btn.nextElementSibling.hidden = expanded;
    });
  });
}

// ─── Glossary ─────────────────────────────────────────────────────────────────

function renderGlossary() {
  const container = document.getElementById('glossary-list');

  container.innerHTML = GLOSSARY.map((item, i) => `
    <div class="glossary-item">
      <button class="glossary-term" aria-expanded="false" aria-controls="gdef-${i}">
        ${esc(item.term)}
        <span class="glossary-icon" aria-hidden="true">+</span>
      </button>
      <div class="glossary-def" id="gdef-${i}" hidden>
        <p>${esc(item.def)}</p>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.glossary-term').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.querySelector('.glossary-icon').textContent = expanded ? '+' : '−';
      document.getElementById(btn.getAttribute('aria-controls')).hidden = expanded;
    });
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const modal    = document.getElementById('team-modal');
const modalBody = document.getElementById('modal-content');

function openModal(country) {
  const team = TEAMS.find(t => t.country === country);
  if (!team) return;
  modalBody.innerHTML = team.spotlight ? buildSpotlightModal(team) : buildCompactModal(team);
  modal.classList.add('open');
  modal.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  // Scroll modal to top
  modal.querySelector('.modal-panel').scrollTop = 0;
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function modalHeader(team) {
  const totalVal = team.squad_total_value_eur
    ? '€' + (team.squad_total_value_eur / 1_000_000).toFixed(0) + 'm'
    : null;

  const stats = [
    team.wc_appearances != null && `<div class="wc-stat"><span>${team.wc_appearances}</span><em>WC appearances</em></div>`,
    team.wc_best_finish  && `<div class="wc-stat"><span>${esc(team.wc_best_finish)}</span><em>Best finish</em></div>`,
    team.manager         && `<div class="wc-stat"><span>${esc(team.manager)}</span><em>Manager</em></div>`,
    totalVal             && `<div class="wc-stat"><span>${totalVal}</span><em>Squad value</em></div>`,
  ].filter(Boolean).join('');

  return `
    <div class="modal-header">
      <div class="modal-flag">${team.flag_emoji || ''}</div>
      <div class="modal-title-block">
        <h2 class="modal-country">${esc(team.country)}</h2>
        <div class="modal-meta">
          <span class="meta-badge" style="background:${CONF_COLORS[team.confederation] || '#444'}">${esc(team.confederation)}</span>
          <span class="meta-group">Group ${esc(team.group)}</span>
          ${team.spotlight ? '<span class="meta-spotlight">★ Spotlight</span>' : ''}
        </div>
      </div>
    </div>
    ${stats ? `<div class="modal-wc-bar">${stats}</div>` : ''}
  `;
}

function squadHtml(players, topLeagueOnly = false) {
  const list = topLeagueOnly ? players.filter(p => p.in_top_league) : players;
  if (!list.length) return '';

  const ORDER = ['GK', 'DF', 'MF', 'FW'];
  const byPos = Object.fromEntries(ORDER.map(p => [p, []]));
  for (const p of list) {
    if (byPos[p.position]) byPos[p.position].push(p);
    else byPos['FW'].push(p);
  }

  return ORDER.filter(pos => byPos[pos].length > 0).map(pos => `
    <div class="squad-position-group">
      <h4 class="squad-pos-label">${posLabel(pos)}s</h4>
      <div class="squad-players">
        ${byPos[pos].map(p => `
          <div class="squad-player">
            <div class="sp-num">${p.squad_number ?? '—'}</div>
            <div class="sp-info">
              <span class="sp-name">${esc(p.full_name)}</span>
              <span class="sp-club">${esc(p.club || '')}${p.in_top_league ? ' <em class="top-league-badge">Top League</em>' : ''}</span>
            </div>
            <div class="sp-right">
              ${p.market_value_fmt ? `<span class="sp-value">${esc(p.market_value_fmt)}</span>` : ''}
              ${p.caps != null ? `<span class="sp-caps">${p.caps} caps</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function buildSpotlightModal(team) {
  const kpCards = (team.key_players || []).map(kp => `
    <div class="key-player ${kp.type === 'young' ? 'key-young' : 'key-star'}">
      <div class="kp-header">
        <span class="kp-name">${esc(kp.name)}</span>
        <span class="kp-type">${kp.type === 'young' ? '🌟 Rising Star' : '⭐ Star Player'}</span>
      </div>
      <div class="kp-meta">${esc(kp.position)} · ${esc(kp.club)}</div>
      <p class="kp-why">${esc(kp.why)}</p>
    </div>
  `).join('');

  const wch = team.recent_world_cup_history;
  const wcYears = wch ? ['2022', '2018', '2014', '2010'].filter(y => wch[y]) : [];
  const wcHtml = wcYears.length ? `
    <div class="modal-section">
      <h3 class="msec-title">Recent World Cup History</h3>
      <div class="wc-history">
        ${wcYears.map(y => `
          <div class="wc-year">
            <span class="wc-yr">${y}</span>
            <span class="wc-result">${esc(wch[y])}</span>
          </div>`).join('')}
      </div>
    </div>
  ` : '';

  const squad = squadHtml(team.squad || []);

  return `
    ${modalHeader(team)}
    <div class="modal-body">
      ${team.story ? `
        <div class="modal-section">
          <p class="team-story">${esc(team.story)}</p>
        </div>` : ''}

      ${kpCards ? `
        <div class="modal-section">
          <h3 class="msec-title">Key Players</h3>
          <div class="key-players">${kpCards}</div>
        </div>` : ''}

      ${(team.goalkeeper_note || team.defense || team.midfield || team.attack) ? `
        <div class="modal-section">
          <h3 class="msec-title">Tactical Shape</h3>
          ${team.goalkeeper_note ? `<div class="tactic-block"><strong>🧤 Goalkeeper</strong><p>${esc(team.goalkeeper_note)}</p></div>` : ''}
          ${team.defense  ? `<div class="tactic-block"><strong>🛡️ Defence</strong><p>${esc(team.defense)}</p></div>` : ''}
          ${team.midfield ? `<div class="tactic-block"><strong>⚙️ Midfield</strong><p>${esc(team.midfield)}</p></div>` : ''}
          ${team.attack   ? `<div class="tactic-block"><strong>⚡ Attack</strong><p>${esc(team.attack)}</p></div>` : ''}
        </div>` : ''}

      ${wcHtml}

      ${team.fun_fact ? `
        <div class="modal-section fun-fact-section">
          <h3 class="msec-title">Fun Fact</h3>
          <p class="fun-fact">${esc(team.fun_fact)}</p>
        </div>` : ''}

      ${squad ? `
        <div class="modal-section">
          <h3 class="msec-title">Full Squad</h3>
          ${squad}
        </div>` : ''}
    </div>
  `;
}

function buildCompactModal(team) {
  const squad = squadHtml(team.squad || [], true);

  return `
    ${modalHeader(team)}
    <div class="modal-body">
      <div class="modal-section">
        <div class="compact-info">
          ${team.wc_debut_year  ? `<div class="ci-row"><span>WC Debut</span><strong>${team.wc_debut_year}</strong></div>` : ''}
          ${team.wc_best_finish ? `<div class="ci-row"><span>Best Finish</span><strong>${esc(team.wc_best_finish)}</strong></div>` : ''}
          ${team.manager        ? `<div class="ci-row"><span>Manager</span><strong>${esc(team.manager)}</strong></div>` : ''}
          ${team.data_completeness_pct != null
            ? `<div class="ci-row"><span>Data completeness</span><strong>${Math.round(team.data_completeness_pct)}%</strong></div>`
            : ''}
        </div>
      </div>

      ${squad ? `
        <div class="modal-section">
          <h3 class="msec-title">Elite League Players</h3>
          <p class="squad-note">Players currently competing in the world's top football leagues.</p>
          ${squad}
        </div>` : `
        <div class="modal-section">
          <p class="no-squad-note">No elite-league players confirmed for this squad.</p>
        </div>`}
    </div>
  `;
}

// ─── Players to Watch ─────────────────────────────────────────────────────────

function renderPlayersSection() {
  const container = document.getElementById('players-grid');
  if (!container) return;

  container.innerHTML = PLAYERS_WATCH.map(tier => {
    const cards = tier.players.map(p => {
      const bg = CONF_COLORS[p.conf] || '#444';
      return `
        <div class="player-watch-card" data-player="${esc(p.name.toLowerCase().replace(/\s+/g, '-'))}">
          <div class="player-photo" style="background:${bg}">
            <span>${esc(p.init)}</span>
          </div>
          <span class="player-name">${esc(p.name)}</span>
          <div class="player-flag-club">
            <span class="fi fi-${p.iso}"></span>
            <span>${esc(p.club)}</span>
          </div>
          <span class="player-pos-pill">${esc(p.pos)}</span>
          <span class="player-stat">${esc(p.stat)}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="players-tier">
        <div class="tier-label">
          ${esc(tier.label)} <em>${esc(tier.sub)}</em>
        </div>
        <div class="players-row">${cards}</div>
      </div>
    `;
  }).join('');
}

// ─── WC Historic Moments ──────────────────────────────────────────────────────

function renderMomentsSection() {
  const container = document.getElementById('moments-grid');
  if (!container) return;

  container.innerHTML = WC_MOMENTS.map(m => {
    const flags = m.flags.map(f => `<span class="fi fi-${f}"></span>`).join('');
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(m.yt)}`;
    return `
      <div class="moment-card">
        <div class="moment-top">
          <span class="moment-year">${esc(m.year)}</span>
          <div class="moment-flags">${flags}</div>
        </div>
        <div class="moment-title">${esc(m.title)}</div>
        <p class="moment-desc">${esc(m.desc)}</p>
        <a class="moment-yt" href="${ytUrl}" target="_blank" rel="noopener">▶ Watch on YouTube</a>
      </div>
    `;
  }).join('');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Module scripts are deferred — DOM is always ready when this runs.

renderTeamsGrid();
renderGroupPreviews();
renderGlossary();
renderPlayersSection();
renderMomentsSection();
initCountdown();

// Modal close — close button, click outside panel, or Escape
document.querySelector('.modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => {
  if (!e.target.closest('.modal-panel')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Team card clicks — event delegation on the grid
document.getElementById('teams-grid').addEventListener('click', e => {
  const card = e.target.closest('.team-card[data-country]');
  if (card) openModal(card.dataset.country);
});

// Nav scroll highlight
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const observer = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    }
  },
  { threshold: 0.3 }
);
sections.forEach(s => observer.observe(s));
