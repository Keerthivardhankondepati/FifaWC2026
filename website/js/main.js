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
  UEFA:      '#1a6cce',
  CONMEBOL:  '#2e8b57',
  CAF:       '#c97c2e',
  AFC:       '#c92e2e',
  CONCACAF:  '#2e8b8b',
  OFC:       '#7c2ec9',
};

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
    const cards = grouped[letter].map(t => `
      <button class="team-card${t.spotlight ? ' spotlight' : ''}"
              data-country="${esc(t.country)}"
              aria-label="View ${esc(t.country)}">
        <span class="team-flag">${t.flag_emoji || ''}</span>
        <span class="team-name">${esc(t.country)}</span>
        <span class="team-conf" style="background:${CONF_COLORS[t.confederation] || '#444'}">${esc(t.confederation)}</span>
        ${t.spotlight ? '<span class="team-spotlight-badge">★ Spotlight</span>' : ''}
      </button>
    `).join('');

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

// ─── Init ─────────────────────────────────────────────────────────────────────
// Module scripts are deferred — DOM is always ready when this runs.

renderTeamsGrid();
renderGroupPreviews();
renderGlossary();
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
