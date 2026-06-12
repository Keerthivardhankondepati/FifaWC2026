const fs = require('fs');
const PROXY = 'https://kickoff26-proxy.kondepatikeerthi.workers.dev/standings';

async function main() {
  const res = await fetch(PROXY);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${PROXY}`);
  const data = await res.json();

  const groups = {};
  for (const child of (data?.children || [])) {
    const letter = (child.name || '').replace('Group ', '').trim();
    if (!letter || letter.length !== 1) continue;
    const getStat = (stats, name) => stats.find(s => s.name === name)?.value ?? 0;
    const rows = (child.standings?.entries || []).map(entry => {
      const stats = entry.stats || [];
      return {
        pos:  entry.note?.rank ?? 0,
        name: entry.team?.displayName || entry.team?.name || '',
        pld:  getStat(stats, 'gamesPlayed'),
        w:    getStat(stats, 'wins'),
        d:    getStat(stats, 'ties'),
        l:    getStat(stats, 'losses'),
        gf:   getStat(stats, 'pointsFor'),
        ga:   getStat(stats, 'pointsAgainst'),
        gd:   getStat(stats, 'pointDifferential'),
        pts:  getStat(stats, 'points'),
      };
    }).sort((a, b) => a.pos - b.pos);
    groups[letter] = rows;
  }

  const totalMatches = Object.values(groups).flat().reduce((s, t) => s + t.pld, 0) / 2;
  const stage =
    totalMatches >= 48 ? 'group_stage_complete'
    : totalMatches > 0 ? 'group_stage'
    : 'pre_tournament';

  fs.writeFileSync('standings.json', JSON.stringify({
    last_updated: new Date().toISOString(),
    stage,
    groups,
  }, null, 2));
  console.log(`Updated — ${totalMatches} matches played, stage: ${stage}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
