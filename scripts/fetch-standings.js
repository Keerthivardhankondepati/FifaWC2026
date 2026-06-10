const fs = require('fs');
const API_KEY = process.env.WORLDCUP_API_KEY;
const BASE = 'https://api.worldcupapi.com';
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const TEAM_MAP = {
  'Mexico':'mexico',
  'South Africa':'south-africa',
  'South Korea':'south-korea',
  'Czechia':'czechia',
  'Canada':'canada',
  'Bosnia and Herzegovina':'bosnia',
  'Bosnia':'bosnia',
  'Qatar':'qatar',
  'Switzerland':'switzerland',
  'Brazil':'brazil',
  'Morocco':'morocco',
  'Haiti':'haiti',
  'Scotland':'scotland',
  'United States':'usa',
  'USA':'usa',
  'Paraguay':'paraguay',
  'Australia':'australia',
  'Turkey':'turkiye',
  'Türkiye':'turkiye',
  'Germany':'germany',
  'Ecuador':'ecuador',
  'Ivory Coast':'ivory-coast',
  "Côte d'Ivoire":'ivory-coast',
  'Curaçao':'curacao',
  'Netherlands':'netherlands',
  'Sweden':'sweden',
  'Japan':'japan',
  'Tunisia':'tunisia',
  'Belgium':'belgium',
  'Egypt':'egypt',
  'Iran':'iran',
  'New Zealand':'new-zealand',
  'Spain':'spain',
  'Cape Verde':'cape-verde',
  'Saudi Arabia':'saudi-arabia',
  'Uruguay':'uruguay',
  'France':'france',
  'Senegal':'senegal',
  'Norway':'norway',
  'Iraq':'iraq',
  'Argentina':'argentina',
  'Algeria':'algeria',
  'Austria':'austria',
  'Jordan':'jordan',
  'Portugal':'portugal',
  'DR Congo':'dr-congo',
  'Democratic Republic of Congo':'dr-congo',
  'Uzbekistan':'uzbekistan',
  'Colombia':'colombia',
  'England':'england',
  'Croatia':'croatia',
  'Ghana':'ghana',
  'Panama':'panama',
};

async function fetchGroup(group) {
  const url = `${BASE}/standings?key=${API_KEY}&group=${group}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Group ${group}: ${res.status}`);
  const data = await res.json();
  return data.map(entry => ({
    team: TEAM_MAP[entry.team.name] || entry.team.name.toLowerCase(),
    name: entry.team.name,
    pos:  entry.rank,
    pld:  entry.matches,
    w:    entry.won,
    d:    entry.drawn,
    l:    entry.lost,
    gf:   entry.goals_scored,
    ga:   entry.goals_conceded,
    gd:   entry.goal_diff,
    pts:  entry.points,
  }));
}

async function main() {
  if (!API_KEY) {
    console.error('WORLDCUP_API_KEY not set');
    process.exit(1);
  }

  let existing = { groups: {} };
  try {
    existing = JSON.parse(fs.readFileSync('standings.json', 'utf8'));
  } catch(e) {}

  const groups = {};
  let changed = false;

  for (const group of GROUPS) {
    try {
      const data = await fetchGroup(group);
      groups[group] = data;
      const old = JSON.stringify(existing.groups?.[group] || []);
      if (old !== JSON.stringify(data)) changed = true;
      await new Promise(r => setTimeout(r, 200));
    } catch(err) {
      console.error(`Failed group ${group}:`, err.message);
      groups[group] = existing.groups?.[group] || [];
    }
  }

  if (!changed) {
    console.log('No changes');
    process.exit(0);
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
  console.log(`Updated — ${totalMatches} matches played`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
