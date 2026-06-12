import { TEAMS } from '../data/teams.js';
import { GROUPS } from '../data/groups.js';

// ─── Constants ────────────────────────────────────────────────────────────────

// June 11, 2026 19:00 UTC — opening match kickoff (3 PM EDT)
const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z');

let matchResults = {};
let matchLineups = {};
let matchEvents  = {};   // { [fixtureId]: { home: [...], away: [...], final: bool } }
let fifaMatchIds = {};   // { [fixtureId]: { idMatch, idStage, homeTeamId, awayTeamId } }
let espnMatchIds = {};   // { [fixtureId]: espnEventId } — for lineup fetches only

const GLOSSARY = [
  {
    term: 'Offside',
    def: 'A player is offside if they are closer to the opponent\'s goal than both the ball and the second-to-last defender when the ball is passed to them. It stops attackers from camping near the goal. VAR now uses sub-millimetre tracking lines to check offside — it is that precise.',
    yt: 'https://www.youtube.com/embed/GePlbCsGniA',
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

const CLUB_LEAGUE = {
  'Real Madrid':      'La Liga',
  'Barcelona':        'La Liga',
  'Atlético Madrid':  'La Liga',
  'Man City':         'Premier League',
  'Arsenal':          'Premier League',
  'Liverpool':        'Premier League',
  'Man United':       'Premier League',
  'Bayern Munich':    'Bundesliga',
  'Bayer Leverkusen': 'Bundesliga',
  'PSG':              'Ligue 1',
  'AC Milan':         'Serie A',
  'Napoli':           'Serie A',
  'Como':             'Serie A',
  'Inter Miami':      'MLS',
  'Al Nassr':         'Saudi Pro League',
  'Fenerbahçe':       'Süper Lig',
  'Club América':     'Liga MX',
  'Santos':           'Brasileirão',
  'Sporting CP':      'Primeira Liga',
  'Schalke 04':       '2. Bundesliga',
};

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

// FIFA uses different team names for some countries — map to our names
const FIFA_TEAM_NAMES = {
  'Korea Republic': 'South Korea',
  "Côte d'Ivoire":  'Ivory Coast',
  'Turkey':         'Türkiye',
  'Congo DR':       'DR Congo',
  'USA':            'United States',
};
function normFifa(n) { return FIFA_TEAM_NAMES[n] || n; }

function getFifaTeamName(teamObj) {
  if (!teamObj?.TeamName?.length) return '';
  const en = teamObj.TeamName.find(d => d.Locale === 'en-GB') || teamObj.TeamName[0];
  return normFifa(en?.Description || '');
}

function extractFifaName(desc, type) {
  if (!desc) return '';
  let m;
  if (type === 1) {
    // "Assisted by Erik LIRA." — all-caps word(s) before period after "by Name"
    m = desc.match(/by\s+\S+\s+([A-Z][A-Z\s\-']+?)\s*\./);
  } else {
    // "QUINONES (Mexico) scores" / "MOKOENA (SA) is booked" — all-caps before "("
    m = desc.match(/([A-Z][A-Z\s\-']+?)\s*\(/);
  }
  if (m) return m[1].trim().split(/\s+/).map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
  const f = desc.match(/\b([A-Z]{2,})\b/);
  return f ? f[1][0] + f[1].slice(1).toLowerCase() : '';
}

function deriveFifaStatus(period) {
  if (period === 4) return 'HT';
  if (period >= 10) return 'FT';
  if (period >= 3)  return 'LIVE';
  return 'upcoming';
}

const PLAYERS_WATCH = [
  {
    tier: 1, label: 'The Stars', sub: 'Best in the world right now',
    players: [
      { name: 'Kylian Mbappé',     country: 'France',          iso: 'fr',     club: 'Real Madrid',     pos: 'Forward',    stat: 'World Cup winner at 19',                                     init: 'KM',  conf: 'UEFA',     age: 27, caps: '85+ France caps',       highlights: ['World Cup winner at 19', '250+ club goals', "Real Madrid's talisman"] },
      { name: 'Erling Haaland',    country: 'Norway',          iso: 'no',     club: 'Man City',        pos: 'Forward',    stat: '91 goals in 97 games for City',                              init: 'EH',  conf: 'UEFA',     age: 25, caps: '40+ Norway caps',       highlights: ['91 goals in 97 games for City', '2x Premier League Golden Boot', 'Most clinical striker alive'] },
      { name: 'Vinicius Jr',       country: 'Brazil',          iso: 'br',     club: 'Real Madrid',     pos: 'Forward',    stat: '2x Champions League winner, Brazil\'s main man',             init: 'VJ',  conf: 'CONMEBOL', age: 24, caps: '60+ Brazil caps',       highlights: ['2x Champions League winner', "Brazil's most dangerous attacker", 'Feared by every defender in Europe'] },
      { name: 'Jude Bellingham',   country: 'England',         iso: 'gb-eng', club: 'Real Madrid',     pos: 'Midfielder', stat: '23 goals in debut season at RM',                             init: 'JB',  conf: 'UEFA',     age: 22, caps: '50+ England caps',      highlights: ['23 goals in debut Real Madrid season', "England's most important player", 'Plays everywhere, scores everywhere'] },
      { name: 'Lamine Yamal',      country: 'Spain',           iso: 'es',     club: 'Barcelona',       pos: 'Forward',    stat: 'Euro 2024 winner at 16',                                     init: 'LY',  conf: 'UEFA',     age: 18, caps: '30+ Spain caps',        highlights: ['Euro 2024 winner at 16', 'Youngest player to score at a Euros', "Barcelona's generational talent"] },
      { name: 'Federico Valverde', country: 'Uruguay',         iso: 'uy',     club: 'Real Madrid',     pos: 'Midfielder', stat: '3× Champions League winner',                                 init: 'FV',  conf: 'CONMEBOL', age: 26, caps: '60+ Uruguay caps',      highlights: ['3× Champions League winner', "Uruguay's engine and heartbeat", 'One of the best box-to-box midfielders alive'] },
      { name: 'Ousmane Dembélé',   country: 'France',          iso: 'fr',     club: 'PSG',             pos: 'Forward',    stat: 'Ballon d\'Or 2025, 40+ goal contributions 2024-25',          init: 'OD',  conf: 'UEFA',     age: 28, caps: '50+ France caps',       highlights: ["Ballon d'Or 2025", '40+ goal contributions 2024-25', "PSG's most dangerous attacker"] },
      { name: 'Bruno Fernandes',   country: 'Portugal',        iso: 'pt',     club: 'Man United',      pos: 'Midfielder', stat: 'Premier League Player of the Season 2025-26',                init: 'BF',  conf: 'UEFA',     age: 31, caps: '80+ Portugal caps',     highlights: ['Premier League Player of the Season 2025-26', 'Portugal captain', 'One of the most creative midfielders in the world'] },
      { name: 'Declan Rice',       country: 'England',         iso: 'gb-eng', club: 'Arsenal',         pos: 'Midfielder', stat: 'Arsenal\'s midfield engine, Premier League winner 2025/26',  init: 'DR',  conf: 'UEFA',     age: 26, caps: '60+ England caps',      highlights: ["Arsenal's midfield engine", 'Premier League winner 2025/26', "England's defensive cornerstone"] },
      { name: 'Raphinha',          country: 'Brazil',          iso: 'br',     club: 'Barcelona',       pos: 'Forward',    stat: '27 goals for Barca 2024-25',                                 init: 'RA',  conf: 'CONMEBOL', age: 28, caps: '50+ Brazil caps',       highlights: ['27 goals for Barca 2024-25', "Brazil's wing wizard", 'UCL finalist with Barcelona'] },
      { name: 'Pedri',             country: 'Spain',           iso: 'es',     club: 'Barcelona',       pos: 'Midfielder', stat: 'Spain\'s creative heartbeat',                                init: 'PE',  conf: 'UEFA',     age: 23, caps: '40+ Spain caps',        highlights: ['Euro 2024 winner', "Spain's creative heartbeat", 'Two-time La Liga champion'] },
      { name: 'Julián Álvarez',    country: 'Argentina',       iso: 'ar',     club: 'Atlético Madrid', pos: 'Forward',    stat: '4 goals at 2022 World Cup',                                  init: 'JA',  conf: 'CONMEBOL', age: 25, caps: '50+ Argentina caps',    highlights: ['4 goals at 2022 World Cup', "Atlético Madrid's star striker", 'World Cup winner at 22'] },
      { name: 'Rodri',             country: 'Spain',           iso: 'es',     club: 'Man City',        pos: 'Midfielder', stat: 'Ballon d\'Or 2024, Spain\'s Euro 2024 winner, best midfielder alive', init: 'RO', conf: 'UEFA', age: 29, caps: '50+ Spain caps',   highlights: ["Ballon d'Or 2024", "Spain's Euro 2024 winner", 'Best midfielder alive'] },
      { name: 'Harry Kane',         country: 'England',         iso: 'gb-eng', club: 'Bayern Munich',    pos: 'Forward',    stat: "England's all-time top scorer, Bundesliga champion",                  init: 'HK',  conf: 'UEFA',     age: 31, caps: '100+ England caps',   highlights: ["England's all-time top scorer", 'Bundesliga champion with Bayern Munich', 'The one trophy still missing from his cabinet — the World Cup'] },
    ],
  },
  {
    tier: 2, label: 'The Legends', sub: 'Icons making their final runs',
    players: [
      { name: 'Lionel Messi',      country: 'Argentina',              iso: 'ar',     club: 'Inter Miami',     pos: 'Forward',    stat: 'World Cup winner 2022, 8× Ballon d\'Or',                                      init: 'LM',  conf: 'CONMEBOL', age: 38, caps: '180+ Argentina caps', highlights: ['2022 World Cup winner', '8× Ballon d\'Or', 'Greatest player in football history'] },
      { name: 'Cristiano Ronaldo', country: 'Portugal',               iso: 'pt',     club: 'Al Nassr',        pos: 'Forward',    stat: '900+ career goals, most capped Portugal player ever, final chapter of the greatest career', init: 'CR', conf: 'UEFA', age: 41, caps: '210+ Portugal caps',  highlights: ['900+ career goals', 'Most international caps ever (200+)', 'Final chapter of the greatest career'] },
      { name: 'Luka Modrić',       country: 'Croatia',                iso: 'hr',     club: 'AC Milan',        pos: 'Midfielder', stat: '2018 WC finalist, Ballon d\'Or 2018',                                         init: 'LMo', conf: 'UEFA',     age: 40, caps: '170+ Croatia caps',    highlights: ["2018 WC finalist & Ballon d'Or winner", "AC Milan's veteran maestro", "Croatia's greatest ever player"] },
      { name: 'Mohamed Salah',     country: 'Egypt',                  iso: 'eg',     club: 'Liverpool',       pos: 'Forward',    stat: 'Egypt\'s greatest ever player',                                               init: 'MS',  conf: 'CAF',      age: 33, caps: '100+ Egypt caps',      highlights: ["Premier League's all-time top scorer", "Egypt's greatest ever player", 'Still world class at 33'] },
      { name: 'Virgil van Dijk',   country: 'Netherlands',            iso: 'nl',     club: 'Liverpool',       pos: 'Defender',   stat: 'Regarded as world\'s best CB',                                                init: 'VVD', conf: 'UEFA',     age: 34, caps: '70+ Netherlands caps', highlights: ["World's best centre-back", 'Liverpool captain', "Netherlands' defensive rock"] },
      { name: 'Thibaut Courtois',  country: 'Belgium',                iso: 'be',     club: 'Real Madrid',     pos: 'Goalkeeper', stat: 'World\'s best goalkeeper, 2022 UCL final MOTM',                               init: 'TC',  conf: 'UEFA',     age: 33, caps: '100+ Belgium caps',    highlights: ["World's best goalkeeper", '2022 UCL final MOTM', "Belgium's most important player"] },
      { name: 'Sadio Mané',        country: 'Senegal',                iso: 'sn',     club: 'Al Nassr',        pos: 'Forward',    stat: 'AFCON winner, Africa\'s finest',                                              init: 'SM',  conf: 'CAF',      age: 34, caps: '100+ Senegal caps',    highlights: ['AFCON winner 2022', "Africa's finest of his generation", 'Former Champions League winner'] },
      { name: 'Edin Džeko',        country: 'Bosnia and Herzegovina', iso: 'ba',     club: 'Schalke 04',      pos: 'Forward',    stat: 'Bosnia\'s all-time top scorer, the veteran leading his nation',               init: 'ED',  conf: 'UEFA',     age: 39, caps: '130+ Bosnia caps',     highlights: ["Bosnia's all-time top scorer", 'The veteran leading his nation', 'Former Roma and Man City legend'] },
      { name: 'Guillermo Ochoa',   country: 'Mexico',                 iso: 'mx',     club: 'Club América',    pos: 'Goalkeeper', stat: '6 consecutive World Cups — most ever for a goalkeeper',                       init: 'GO',  conf: 'CONCACAF', age: 40, caps: '130+ Mexico caps',     highlights: ['6 consecutive World Cups — most ever for a goalkeeper', "Mexico's hero against Brazil 2014", 'A living legend of the game'] },
      { name: 'Neymar Jr',         country: 'Brazil',                 iso: 'br',     club: 'Santos',          pos: 'Forward',    stat: 'Brazil\'s record scorer, comeback story of the tournament',                   init: 'NJ',  conf: 'CONMEBOL', age: 34, caps: '120+ Brazil caps',     highlights: ["Brazil's record scorer", 'Comeback story of the tournament', 'Former PSG and Barcelona star'] },
      { name: 'Kevin De Bruyne',   country: 'Belgium',                iso: 'be',     club: 'Napoli',          pos: 'Midfielder', stat: 'Belgium\'s greatest ever player, one of the finest midfielders of his generation', init: 'KDB', conf: 'UEFA',     age: 34, caps: '100+ Belgium caps',    highlights: ["Belgium's greatest ever player", 'One of the finest midfielders of his generation', 'This may be his last chance at World Cup glory'] },
    ],
  },
  {
    tier: 3, label: 'The Ones to Watch', sub: 'Breakout stars of this generation',
    players: [
      { name: 'Florian Wirtz',     country: 'Germany',   iso: 'de',     club: 'Bayer Leverkusen', pos: 'Midfielder', stat: 'Germany\'s magician, one of the most creative players',                           init: 'FW',  conf: 'UEFA',     age: 22, caps: '30+ Germany caps',    highlights: ["Germany's magician", 'One of the most creative players in Europe', 'Treble winner 2024 with Leverkusen'] },
      { name: 'Jamal Musiala',     country: 'Germany',   iso: 'de',     club: 'Bayern Munich',    pos: 'Midfielder', stat: 'Germany\'s electric playmaker',                                                  init: 'JM',  conf: 'UEFA',     age: 22, caps: '40+ Germany caps',    highlights: ["Germany's electric playmaker", 'Bayern Munich talisman', "One of Europe's best young talents"] },
      { name: 'Nico Paz',          country: 'Argentina', iso: 'ar',     club: 'Como',             pos: 'Midfielder', stat: 'Rising star at 21',                                                              init: 'NP',  conf: 'CONMEBOL', age: 21, caps: '10+ Argentina caps',  highlights: ["Argentina's next generation", 'Impressed everyone at Como', 'Son of former Real Madrid player'] },
      { name: 'Scott McTominay',   country: 'Scotland',  iso: 'gb-sct', club: 'Napoli',           pos: 'Midfielder', stat: 'Serie A MVP 2024-25, from Man United forgotten man to Italian football royalty', init: 'SM2', conf: 'UEFA',     age: 28, caps: '40+ Scotland caps',  highlights: ['Serie A MVP 2024-25', 'From Man United forgotten man to Italian football royalty', "Scotland's talisman"] },
      { name: 'Viktor Gyökeres',   country: 'Sweden',    iso: 'se',     club: 'Sporting CP',      pos: 'Forward',    stat: '46 goals in 2024-25 season',                                                     init: 'VG',  conf: 'UEFA',     age: 26, caps: '40+ Sweden caps',     highlights: ['46 goals in 2024-25 season', "Sweden's most potent striker", "One of Europe's most in-demand forwards"] },
      { name: 'Désiré Doué',       country: 'France',    iso: 'fr',     club: 'PSG',              pos: 'Forward',    stat: 'France\'s next superstar at 20',                                                 init: 'DD',  conf: 'UEFA',     age: 20, caps: '20+ France caps',     highlights: ["France's next superstar", "PSG's explosive wide forward", "One of Europe's hottest prospects"] },
      { name: 'Vitinha',           country: 'Portugal',  iso: 'pt',     club: 'PSG',              pos: 'Midfielder', stat: 'Consecutive UCL winner, PSG\'s heartbeat and engine',                            init: 'VI',  conf: 'UEFA',     age: 25, caps: '40+ Portugal caps',   highlights: ['Consecutive UCL winner', "PSG's heartbeat and engine", "Portugal's midfield maestro"] },
      { name: 'Michael Olise',     country: 'France',    iso: 'fr',     club: 'Bayern Munich',    pos: 'Forward',    stat: '22 goals, 15 assists 2024-25',                                                   init: 'MO',  conf: 'UEFA',     age: 23, caps: '15+ France caps',     highlights: ['22 goals, 15 assists 2024-25', "Bayern Munich's creative force", "France's brightest new wide star"] },
      { name: 'Achraf Hakimi',     country: 'Morocco',   iso: 'ma',     club: 'PSG',              pos: 'Defender',   stat: 'Africa\'s best right back',                                                      init: 'AH',  conf: 'CAF',      age: 26, caps: '80+ Morocco caps',    highlights: ["Africa's best right back", '2022 WC quarter-finalist with Morocco', "PSG's attacking fullback"] },
      { name: 'Rúben Dias',        country: 'Portugal',  iso: 'pt',     club: 'Man City',         pos: 'Defender',   stat: 'City\'s defensive cornerstone',                                                  init: 'RD',  conf: 'UEFA',     age: 28, caps: '60+ Portugal caps',   highlights: ["City's defensive cornerstone", 'Premier League champion', "Portugal's defensive leader"] },
      { name: 'Bukayo Saka',       country: 'England',   iso: 'gb-eng', club: 'Arsenal',          pos: 'Forward',    stat: 'England\'s most consistent performer',                                           init: 'BS',  conf: 'UEFA',     age: 23, caps: '50+ England caps',    highlights: ["England's most consistent performer", "Arsenal's creative spark", '2024 PL Player of the Season'] },
      { name: 'Gavi',              country: 'Spain',     iso: 'es',     club: 'Barcelona',        pos: 'Midfielder', stat: 'Spain double winner at 20',                                                      init: 'GA',  conf: 'UEFA',     age: 20, caps: '40+ Spain caps',      highlights: ['Spain double winner', 'Euro 2024 champion', "Barcelona's future captain"] },
      { name: 'Antoine Semenyo',   country: 'Ghana',     iso: 'gh',     club: 'Man City',         pos: 'Forward',    stat: 'Man City\'s explosive winger, Ghana\'s brightest star',                          init: 'AS',  conf: 'CAF',      age: 24, caps: '20+ Ghana caps',      highlights: ["Man City's explosive winger", "Ghana's brightest star", "One of Africa's most exciting talents"] },
      { name: 'Christian Pulisic', country: 'United States', iso: 'us', club: 'AC Milan',         pos: 'Forward',    stat: 'USMNT captain, Serie A star, America\'s greatest ever player',                   init: 'CP',  conf: 'CONCACAF', age: 26, caps: '60+ USA caps',        highlights: ['USMNT captain', 'Serie A star at AC Milan', "America's greatest ever player"] },
    ],
  },
];

const WC_MOMENTS = [
  { year: '1986', flags: ['ar', 'gb-eng'], title: 'Hand of God + Goal of the Century',
    desc: 'Maradona scored the most controversial goal in history — then, four minutes later, the greatest. Both in one quarter-final. Argentina beat England 2–1.',
    yt: 'https://www.youtube.com/watch?v=-ccNkksrfls' },
  { year: '2022', flags: ['ar', 'fr'], title: 'The Greatest Final Ever',
    desc: 'France came back from 2–0 down to level at 3–3 in extra time. Mbappé hat-trick vs Messi\'s Argentina. Decided on penalties. Called the greatest sporting event of modern times.',
    yt: 'https://www.youtube.com/watch?v=2iaE0xHfUro' },
  { year: '2018', flags: ['fr', 'hr'], title: 'France\'s Perfect Final',
    desc: 'France demolished Croatia 4–2 in a breathtaking final. Mbappé became the second teenager to score in a World Cup final. A new generation announcing itself to the world.',
    yt: 'https://www.youtube.com/watch?v=0rtw9uCevMg' },
  { year: '2014', flags: ['de', 'br'], title: 'Germany 7–1 Brazil',
    desc: 'The host nation, at home, destroyed 7–1 in the semi-final. Five German goals in 18 first-half minutes. Brazil\'s greatest humiliation on their own soil.',
    yt: 'https://www.youtube.com/watch?v=Go75btfNyew' },
  { year: '2010', flags: ['es', 'nl'], title: 'Iniesta\'s Extra Time Winner',
    desc: 'Spain\'s first-ever World Cup. 0–0 after 90 minutes. Iniesta volleyed home in extra time. The goal that made a generation fall in love with tiki-taka.',
    yt: 'https://www.youtube.com/watch?v=lo8_Ox0YkWI' },
  { year: 'All Time', flags: [], title: 'Greatest World Cup Moments — Part 1',
    desc: 'The goals, saves, celebrations and scenes that defined decades of World Cup history. From Pelé to Zidane to Messi — every fan needs to watch this.',
    yt: 'https://www.youtube.com/watch?v=8C3we1FSAA0' },
  { year: 'All Time', flags: [], title: 'Greatest World Cup Moments — Part 2',
    desc: 'More iconic moments from the beautiful game\'s biggest stage. Upsets, heroes, heartbreak, and pure joy across nine decades of World Cup football.',
    yt: 'https://www.youtube.com/watch?v=_RD6s35qC4g' },
];

// ─── Quiz Data ────────────────────────────────────────────────────────────────

const QUIZ_TEAMS = {
  mexico:         { name:'Mexico',         flag:'🇲🇽', group:'A', accent:'#006847', tagline:'Co-hosts with a curse to break', hook:'Mexico have never gone past the Round of 16. On home soil in front of their own fans, with Ochoa in his 6th World Cup — this could finally be the year. The passion in the stands will be unlike anything else at this tournament.', player:'Guillermo Ochoa', playerFlag:'🇲🇽' },
  'south-africa': { name:'South Africa',   flag:'🇿🇦', group:'A', accent:'#007A4D', tagline:'The Rainbow Nation returns', hook:'Back at the World Cup for the first time since hosting in 2010. South Africa qualifying is already a story worth following. Every match is a bonus. Every point is history.', player:'Percy Tau', playerFlag:'🇿🇦' },
  'south-korea':  { name:'South Korea',    flag:'🇰🇷', group:'A', accent:'#C60C30', tagline:'Can they recreate the 2002 magic?', hook:'Semi-finalists on home soil in 2002 — one of the greatest World Cup stories ever told. A new generation led by Son Heung-min wants to write their own chapter. Asia\'s most technically gifted side.', player:'Son Heung-min', playerFlag:'🇰🇷' },
  czechia:        { name:'Czechia',         flag:'🇨🇿', group:'A', accent:'#D7141A', tagline:'Runners-up as Czechoslovakia — back with unfinished business', hook:'A proud footballing nation that reached two World Cup finals as Czechoslovakia. The modern Czech Republic has quality throughout — technically sound, hard to break down, and genuinely dangerous on the counter.', player:'Tomáš Souček', playerFlag:'🇨🇿' },
  canada:         { name:'Canada',          flag:'🇨🇦', group:'B', accent:'#FF0000', tagline:'A golden generation playing at home', hook:'Co-hosts at only their second ever World Cup. Alphonso Davies leads a generation that has turned Canadian football from a punchline to a genuine force. An entire country falling in love with football for the first time.', player:'Alphonso Davies', playerFlag:'🇨🇦' },
  bosnia:         { name:'Bosnia & Herz.',  flag:'🇧🇦', group:'B', accent:'#002395', tagline:'Džeko\'s farewell tour', hook:'Edin Džeko — Bosnia\'s all-time top scorer at 39 — leads his nation one final time. A country that bleeds football. Every win means more here than almost anywhere.', player:'Edin Džeko', playerFlag:'🇧🇦' },
  qatar:          { name:'Qatar',           flag:'🇶🇦', group:'B', accent:'#8D1B3D', tagline:'Redemption on foreign soil', hook:'The 2022 hosts struggled on home ground. Now they face the world without the pressure of hosting. A young squad with a point to prove — Qatar want to show they belong on merit.', player:'Akram Afif', playerFlag:'🇶🇦' },
  switzerland:    { name:'Switzerland',    flag:'🇨🇭', group:'B', accent:'#FF0000', tagline:'The perennial overachievers', hook:'Switzerland consistently punch above their weight. Xhaka, Embolo, Akanji — quality throughout a squad that has knocked out France and Portugal. Never underestimate them.', player:'Granit Xhaka', playerFlag:'🇨🇭' },
  brazil:         { name:'Brazil',          flag:'🇧🇷', group:'C', accent:'#009C3B', tagline:'Football as it was meant to be played', hook:'Five World Cups. The most successful nation in tournament history. Vinicius Jr, Raphinha, Endrick — the Seleção play with joy, creativity, and electricity. Watching Brazil at their best is why football was invented.', player:'Vinicius Jr', playerFlag:'🇧🇷' },
  morocco:        { name:'Morocco',         flag:'🇲🇦', group:'C', accent:'#C1272D', tagline:'2022 semi-finalists — back for more', hook:'Morocco made history in 2022 — first African nation in a World Cup semi-final. Now they return as genuine contenders. Hakimi, Ounahi, Bounou — defensive steel and lethal counter-attacks.', player:'Achraf Hakimi', playerFlag:'🇲🇦' },
  haiti:          { name:'Haiti',           flag:'🇭🇹', group:'C', accent:'#00209F', tagline:'The ultimate underdog story', hook:'Just being here is the miracle. Haiti\'s qualification despite everything their nation has endured is one of football\'s great stories. Every minute on the world stage is a moment of joy.', player:'Frantzdy Pierrot', playerFlag:'🇭🇹' },
  scotland:       { name:'Scotland',        flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', group:'C', accent:'#0065BF', tagline:'The most passionate fans in football', hook:'McTominay — Serie A MVP — leads Scotland back onto the world stage. The Tartan Army travels in thousands. Pure passion, relentless spirit, and a belief that this time, it\'s different.', player:'Scott McTominay', playerFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  usa:            { name:'USA',             flag:'🇺🇸', group:'D', accent:'#B22234', tagline:'A nation waking up to football', hook:'Co-hosts with Pulisic, Adams, Reyna — America\'s golden generation plays at home. The crowd, the noise, the expectation — this is the USA\'s World Cup moment.', player:'Christian Pulisic', playerFlag:'🇺🇸' },
  paraguay:       { name:'Paraguay',        flag:'🇵🇾', group:'D', accent:'#D52B1E', tagline:'South Americans who never give up', hook:'Paraguay have reached the quarter-finals twice. Underrated and underestimated — exactly how they like it. Built on a defensive spine that makes them uncomfortable for anyone.', player:'Miguel Almirón', playerFlag:'🇵🇾' },
  australia:      { name:'Australia',       flag:'🇦🇺', group:'D', accent:'#00843D', tagline:'The Socceroos always find a way', hook:'Quarter-finalists in 2022. They fight until the final whistle and then some. The most lovable battlers in the tournament — always find a way when everyone has written them off.', player:'Mathew Leckie', playerFlag:'🇦🇺' },
  turkiye:        { name:'Türkiye',         flag:'🇹🇷', group:'D', accent:'#E30A17', tagline:'Third place in 2002 — the dark horse is back', hook:'Türkiye finished third in 2002 and have been rebuilding. Güler, Calhanoglu — serious quality throughout. Passionate fans, attacking intent, and a squad ready to surprise.', player:'Arda Güler', playerFlag:'🇹🇷' },
  germany:        { name:'Germany',         flag:'🇩🇪', group:'E', accent:'#000000', tagline:'The machine is rebuilt', hook:'Four-time champions rebuilt under a new generation. Wirtz and Musiala are the most exciting midfield duo in the tournament. Germany play with intensity and purpose unmistakably their own.', player:'Florian Wirtz', playerFlag:'🇩🇪' },
  ecuador:        { name:'Ecuador',         flag:'🇪🇨', group:'E', accent:'#FFD100', tagline:'South American pride in the toughest group', hook:'Ecuador carry serious quality and South American heart. They\'ve opened two World Cups with wins. Caicedo, Plata — pace, energy, and the ambition of a nation demanding to be noticed.', player:'Moisés Caicedo', playerFlag:'🇪🇨' },
  'ivory-coast':  { name:'Ivory Coast',    flag:'🇨🇮', group:'E', accent:'#FF6600', tagline:'AFCON champions with stars everywhere', hook:'AFCON champions with pace and flair throughout. Africa\'s dark horse in the most competitive group. A nation that has always produced world-class players and now has a team to match.', player:'Sébastien Haller', playerFlag:'🇨🇮' },
  curacao:        { name:'Curaçao',         flag:'🇨🇼', group:'E', accent:'#002B7F', tagline:'The Caribbean\'s greatest ever achievement', hook:'A tiny Caribbean island defying all odds just to be here. Every single moment they\'re on that pitch is historic. The most extraordinary qualification story at this tournament.', player:'Cuco Martina', playerFlag:'🇨🇼' },
  netherlands:    { name:'Netherlands',    flag:'🇳🇱', group:'F', accent:'#FF6600', tagline:'Three-time finalists — never champions', hook:'The Dutch have been to three World Cup finals and never lifted the trophy. Van Dijk, Gakpo, Dumfries — this generation has unfinished business. Total Football invented here. Not won here. Not yet.', player:'Virgil van Dijk', playerFlag:'🇳🇱' },
  sweden:         { name:'Sweden',          flag:'🇸🇪', group:'F', accent:'#006AA7', tagline:'Gyökeres scored 46 goals — fear him', hook:'Viktor Gyökeres scored 46 goals this season. Sweden have the most in-form striker at the entire tournament. If he fires — and he will — Sweden can beat absolutely anyone.', player:'Viktor Gyökeres', playerFlag:'🇸🇪' },
  japan:          { name:'Japan',           flag:'🇯🇵', group:'F', accent:'#BC002D', tagline:'Nobody wants to draw Japan', hook:'Japan knocked out Germany and Spain in 2022. They pressed, attacked, went for the throat. Disciplined, brave, technically brilliant. The team every nation dreads finding in their group.', player:'Takefusa Kubo', playerFlag:'🇯🇵' },
  tunisia:        { name:'Tunisia',         flag:'🇹🇳', group:'F', accent:'#E70013', tagline:'Six World Cups, never past the group', hook:'Tunisia have qualified for 6 World Cups without ever making the knockouts. This squad has the quality to change that. Built to frustrate favourites and nick results when it matters most.', player:'Aïssa Mandi', playerFlag:'🇹🇳' },
  belgium:        { name:'Belgium',         flag:'🇧🇪', group:'G', accent:'#EF3340', tagline:'The golden generation\'s last stand', hook:'De Bruyne, Courtois, Lukaku — Belgium\'s most talented generation ever is running out of time. That desperation is the most dangerous fuel in football. A team with nothing to lose.', player:'Kevin De Bruyne', playerFlag:'🇧🇪' },
  egypt:          { name:'Egypt',           flag:'🇪🇬', group:'G', accent:'#EF2B2D', tagline:'Salah\'s last chance at the ultimate stage', hook:'Mohamed Salah — the Premier League\'s all-time top scorer — has never had a real World Cup moment. This is his last realistic chance. Egypt are entirely built around their greatest ever player.', player:'Mohamed Salah', playerFlag:'🇪🇬' },
  iran:           { name:'Iran',            flag:'🇮🇷', group:'G', accent:'#239F40', tagline:'Asia\'s disciplined dark horse', hook:'Iran are always more dangerous than their ranking suggests. Organised, hard to beat. Taremi, Jahanbakhsh — quality in the final third that can hurt anyone on their day.', player:'Mehdi Taremi', playerFlag:'🇮🇷' },
  'new-zealand':  { name:'New Zealand',    flag:'🇳🇿', group:'G', accent:'#00247D', tagline:'Football at the bottom of the world', hook:'The All Whites at a World Cup is always a story. New Zealand play with spirit and pride. Qualifying itself was the miracle — what happens next is a bonus.', player:'Chris Wood', playerFlag:'🇳🇿' },
  spain:          { name:'Spain',           flag:'🇪🇸', group:'H', accent:'#C60B1E', tagline:'Reigning Euro champions', hook:'Yamal, Pedri, Rodri, Gavi — Spain have the most technically gifted squad in the tournament. Euro champions playing with freedom and confidence. The most beautiful football at this World Cup.', player:'Lamine Yamal', playerFlag:'🇪🇸' },
  'cape-verde':   { name:'Cape Verde',     flag:'🇨🇻', group:'H', accent:'#003893', tagline:'600,000 people. One World Cup dream.', hook:'A tiny island nation of 600,000 people at the World Cup. Cape Verde qualifying is one of the most extraordinary stories in African football. Every moment they play is a miracle.', player:'Ryan Mendes', playerFlag:'🇨🇻' },
  'saudi-arabia': { name:'Saudi Arabia',   flag:'🇸🇦', group:'H', accent:'#006C35', tagline:'They beat Argentina in 2022. Never forget.', hook:'Saudi Arabia produced one of the greatest upsets in World Cup history — beating Argentina 2-1 in 2022. They are not here to make up the numbers. Al-Dawsari can hurt anyone.', player:'Salem Al-Dawsari', playerFlag:'🇸🇦' },
  uruguay:        { name:'Uruguay',         flag:'🇺🇾', group:'H', accent:'#5EB6E4', tagline:'Cold, clinical, never underestimate them', hook:'Two-time World Cup champions. Valverde, Núñez, Araújo play without sentiment. They defend deep, hit on the counter, and never know when they\'re beaten. Most dangerous team to face as a favourite.', player:'Federico Valverde', playerFlag:'🇺🇾' },
  france:         { name:'France',          flag:'🇫🇷', group:'I', accent:'#003189', tagline:'The most terrifying attack in the tournament', hook:'Mbappé, Dembélé, Doué, Olise — France have the most frightening attack in tournament history. Ballon d\'Or 2025 winner Dembélé leads a squad so deep it\'s almost unfair.', player:'Kylian Mbappé', playerFlag:'🇫🇷' },
  senegal:        { name:'Senegal',         flag:'🇸🇳', group:'I', accent:'#00853F', tagline:'AFCON champions — Africa\'s finest', hook:'Mané, Dia, Sarr — Senegal are AFCON champions and the pride of a continent. Every match carries the hopes of millions across Africa. Athletic, passionate, capable of beating anyone.', player:'Sadio Mané', playerFlag:'🇸🇳' },
  norway:         { name:'Norway',          flag:'🇳🇴', group:'I', accent:'#EF2B2D', tagline:'Haaland at a World Cup. Finally.', hook:'Erling Haaland — 91 goals in 97 games for Man City — finally gets his World Cup. Norway are a dark horse built around the world\'s most clinical striker. One man capable of winning a tournament alone.', player:'Erling Haaland', playerFlag:'🇳🇴' },
  iraq:           { name:'Iraq',            flag:'🇮🇶', group:'I', accent:'#007A3D', tagline:'Making history with every match', hook:'Iraq\'s qualification was itself a miracle. Every minute they play at a World Cup is historic. A nation finding joy through football — that story alone is worth following to the end.', player:'Aymen Hussein', playerFlag:'🇮🇶' },
  argentina:      { name:'Argentina',       flag:'🇦🇷', group:'J', accent:'#43AFEC', tagline:'Defending champions', hook:'Messi lifted the trophy in 2022. Now Argentina defend it with Nico Paz, Álvarez, and Lautaro. Defending champions with the swagger of a nation that knows exactly what winning feels like.', player:'Lionel Messi', playerFlag:'🇦🇷' },
  algeria:        { name:'Algeria',         flag:'🇩🇿', group:'J', accent:'#006233', tagline:'AFCON champions who play without fear', hook:'Algeria became the first African team to score 4 goals in a World Cup match in 2014. AFCON champions with Mahrez, Benrahma — quality that can trouble any opponent.', player:'Riyad Mahrez', playerFlag:'🇩🇿' },
  austria:        { name:'Austria',         flag:'🇦🇹', group:'J', accent:'#EF3340', tagline:'Quietly becoming dangerous', hook:'Austria under Rangnick play the most intense pressing football in Europe. Sabitzer, Alaba — Champions League quality with a tactical system that suffocates opponents. The dark horse nobody mentions.', player:'Marcel Sabitzer', playerFlag:'🇦🇹' },
  jordan:         { name:'Jordan',          flag:'🇯🇴', group:'J', accent:'#007A3D', tagline:'Asia\'s surprise qualifiers', hook:'Jordan\'s World Cup qualification is one of Asian football\'s great stories. Playing with freedom and pride. History is being made every time they step on that pitch.', player:'Yazan Al-Naimat', playerFlag:'🇯🇴' },
  portugal:       { name:'Portugal',        flag:'🇵🇹', group:'K', accent:'#006600', tagline:'Ronaldo\'s last World Cup', hook:'Ronaldo at 41, Bruno Fernandes leading, Vitinha pulling strings — Portugal have the squad to finally win it. The nation has waited long enough. And Ronaldo desperately wants one more moment.', player:'Cristiano Ronaldo', playerFlag:'🇵🇹' },
  'dr-congo':     { name:'DR Congo',       flag:'🇨🇩', group:'K', accent:'#007FFF', tagline:'Africa\'s most populous nation on the world stage', hook:'100 million people — DR Congo back at the World Cup. Batshuayi, Masuaku — Belgian league quality with the raw athleticism of African football at its best.', player:'Michy Batshuayi', playerFlag:'🇨🇩' },
  uzbekistan:     { name:'Uzbekistan',      flag:'🇺🇿', group:'K', accent:'#1EB53A', tagline:'Central Asia\'s first ever World Cup', hook:'Uzbekistan at a World Cup. Central Asia has never been here before. A country of 36 million qualifying is extraordinary. Every second they play is a first in history.', player:'Eldor Shomurodov', playerFlag:'🇺🇿' },
  colombia:       { name:'Colombia',        flag:'🇨🇴', group:'K', accent:'#FCD116', tagline:'Copa América finalists with flair to burn', hook:'Luís Díaz, James Rodríguez — Colombia play with colour, creativity, and the joyful attacking instinct of South American football. Copa América finalists with genuine quality throughout.', player:'Luís Díaz', playerFlag:'🇨🇴' },
  england:        { name:'England',         flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', group:'L', accent:'#CF081F', tagline:'60 years of hurt — this could be the year', hook:'Bellingham, Saka, Rice — England\'s most talented generation in decades carries 60 years of hurt onto that pitch. Every tournament feels like destiny. This time feels genuinely different.', player:'Jude Bellingham', playerFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  croatia:        { name:'Croatia',         flag:'🇭🇷', group:'L', accent:'#FF0000', tagline:'2018 finalists, 2022 third place — always there', hook:'Croatia reached the 2018 final and finished third in 2022. Modrić\'s farewell. A nation of 4 million that consistently defies logic and goes further than anyone expects.', player:'Luka Modrić', playerFlag:'🇭🇷' },
  ghana:          { name:'Ghana',           flag:'🇬🇭', group:'L', accent:'#FCD116', tagline:'The Black Stars with unfinished business', hook:'Ghana came within a penalty of a 2010 semi-final. That wound still hurts. Semenyo, Kudus, Partey — the most talented Black Stars squad in years. Unfinished business demands to be settled.', player:'Antoine Semenyo', playerFlag:'🇬🇭' },
  panama:         { name:'Panama',          flag:'🇵🇦', group:'L', accent:'#DA121A', tagline:'CONCACAF\'s battling representatives', hook:'Panama play every World Cup match like it\'s a cup final. Physical, organised, passionate — they make life extremely difficult for technically superior opponents.', player:'Rolando Blackburn', playerFlag:'🇵🇦' },
};

const QUIZ_QUESTIONS = [
  { id:'style', question:'How do you want your team to play?', emoji:'⚽',
    options:[
      { id:'attack',    label:'All out attack',      sub:'Goals, goals, goals',            emoji:'🔥' },
      { id:'defense',   label:'Solid as a rock',     sub:'Clean sheets win trophies',      emoji:'🧱' },
      { id:'technical', label:'Beautiful football',  sub:'Pass, move, create',             emoji:'🎨' },
      { id:'chaos',     label:'Unpredictable chaos', sub:'Nobody knows what happens next', emoji:'🎭' },
    ]},
  { id:'story', question:'Which story pulls you in?', emoji:'📖',
    options:[
      { id:'champion',  label:'Win or go home',      sub:'The only goal is the trophy',   emoji:'🏆' },
      { id:'underdog',  label:'The great upset',     sub:'Nobody believed in us',          emoji:'😤' },
      { id:'legend',    label:'A legend\'s farewell',sub:'One last shot at glory',         emoji:'👴' },
      { id:'firsttime', label:'Making history',      sub:'Never been this far before',     emoji:'✨' },
    ]},
  { id:'region', question:'Which part of the world do you want to represent?', emoji:'🌍',
    options:[
      { id:'europe',    label:'Europe',              sub:'UEFA nations',                   emoji:'🏰' },
      { id:'americas',  label:'The Americas',        sub:'CONMEBOL + CONCACAF',            emoji:'🌎' },
      { id:'africa',    label:'Africa',              sub:'CAF nations',                    emoji:'🦁' },
      { id:'asia',      label:'Asia & Oceania',      sub:'AFC + OFC nations',              emoji:'🌏' },
    ]},
  { id:'vibe', question:'Pick your matchday atmosphere', emoji:'🎉',
    options:[
      { id:'party',      label:'Street carnival',       sub:'Drums, colour, pure joy',       emoji:'🥁' },
      { id:'intense',    label:'White-knuckle tension', sub:'Can barely watch',              emoji:'😬' },
      { id:'passionate', label:'Pure passion',          sub:'Every tackle like a final',     emoji:'❤️' },
      { id:'elegant',    label:'Football as art',       sub:'Beautiful, refined, precise',   emoji:'💫' },
    ]},
  { id:'outcome', question:'What would feel like success?', emoji:'🎯',
    options:[
      { id:'trophy',  label:'Lift the trophy',       sub:'Nothing else counts',            emoji:'🥇' },
      { id:'upset',   label:'One glorious upset',    sub:'Knock out a giant',              emoji:'💥' },
      { id:'record',  label:'Further than ever',     sub:'Break our own history',          emoji:'📈' },
      { id:'proud',   label:'Make the nation proud', sub:'Whole country on their feet',    emoji:'🫶' },
    ]},
];

const HOME_COMBOS = {
  "france":       ["attack","champion","europe","party","trophy"],
  "spain":        ["technical","champion","europe","elegant","record"],
  "england":      ["attack","champion","europe","intense","trophy"],
  "germany":      ["technical","champion","europe","intense","record"],
  "portugal":     ["attack","legend","europe","intense","trophy"],
  "netherlands":  ["technical","champion","europe","elegant","proud"],
  "belgium":      ["attack","legend","europe","intense","proud"],
  "norway":       ["attack","underdog","europe","party","trophy"],
  "croatia":      ["defense","legend","europe","passionate","proud"],
  "scotland":     ["chaos","underdog","europe","passionate","upset"],
  "switzerland":  ["defense","underdog","europe","elegant","proud"],
  "austria":      ["technical","underdog","europe","passionate","record"],
  "czechia":      ["defense","underdog","europe","intense","proud"],
  "turkiye":      ["chaos","underdog","europe","passionate","record"],
  "bosnia":       ["attack","legend","europe","passionate","proud"],
  "argentina":    ["attack","champion","americas","intense","trophy"],
  "brazil":       ["attack","champion","americas","party","proud"],
  "colombia":     ["attack","champion","americas","party","trophy"],
  "usa":          ["attack","underdog","americas","intense","record"],
  "mexico":       ["attack","legend","americas","passionate","proud"],
  "uruguay":      ["defense","champion","americas","intense","proud"],
  "canada":       ["attack","firsttime","americas","passionate","record"],
  "ecuador":      ["attack","underdog","americas","passionate","upset"],
  "paraguay":     ["defense","underdog","americas","intense","proud"],
  "curacao":      ["chaos","firsttime","americas","passionate","proud"],
  "panama":       ["defense","firsttime","americas","intense","proud"],
  "haiti":        ["chaos","firsttime","americas","party","proud"],
  "morocco":      ["defense","underdog","africa","intense","proud"],
  "senegal":      ["chaos","underdog","africa","passionate","trophy"],
  "ghana":        ["chaos","underdog","africa","passionate","upset"],
  "egypt":        ["defense","legend","africa","party","trophy"],
  "algeria":      ["technical","underdog","africa","passionate","proud"],
  "ivory-coast":  ["attack","underdog","africa","party","upset"],
  "south-africa": ["chaos","firsttime","africa","passionate","proud"],
  "dr-congo":     ["attack","firsttime","africa","passionate","record"],
  "cape-verde":   ["chaos","firsttime","africa","party","proud"],
  "tunisia":      ["defense","underdog","africa","intense","upset"],
  "japan":        ["technical","underdog","asia","elegant","proud"],
  "south-korea":  ["defense","underdog","asia","intense","upset"],
  "iran":         ["defense","underdog","asia","intense","proud"],
  "australia":    ["chaos","underdog","asia","intense","upset"],
  "saudi-arabia": ["chaos","underdog","asia","passionate","upset"],
  "uzbekistan":   ["technical","firsttime","asia","elegant","proud"],
  "iraq":         ["attack","firsttime","asia","passionate","proud"],
  "jordan":       ["defense","firsttime","asia","intense","proud"],
  "qatar":        ["defense","firsttime","asia","passionate","proud"],
  "new-zealand":  ["chaos","firsttime","asia","passionate","proud"],
};

// Maps quiz team IDs to TEAMS country names where they differ
const QUIZ_ID_TO_COUNTRY = {
  usa:    'United States',
  bosnia: 'Bosnia and Herzegovina',
};

const SCHEDULE = [
  {
    group: 'A', teams: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
    matches: [
      { md: 1, home: 'Mexico',       away: 'South Africa', date: 'Jun 11', time: '15:00', venue: 'Estadio Azteca, Mexico City' },
      { md: 1, home: 'South Korea',  away: 'Czechia',       date: 'Jun 11', time: '22:00', venue: 'Estadio Akron, Guadalajara' },
      { md: 2, home: 'Mexico',       away: 'South Korea',   date: 'Jun 18', time: '21:00', venue: 'Estadio Akron, Guadalajara' },
      { md: 2, home: 'Czechia',      away: 'South Africa',  date: 'Jun 18', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
      { md: 3, home: 'Czechia',      away: 'Mexico',        date: 'Jun 24', time: '21:00', venue: 'Estadio Azteca, Mexico City' },
      { md: 3, home: 'South Africa', away: 'South Korea',   date: 'Jun 24', time: '21:00', venue: 'Estadio BBVA, Monterrey' },
    ],
  },
  {
    group: 'B', teams: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
    matches: [
      { md: 1, home: 'Canada',                 away: 'Bosnia and Herzegovina', date: 'Jun 12', time: '15:00', venue: 'BMO Field, Toronto' },
      { md: 1, home: 'Qatar',                  away: 'Switzerland',            date: 'Jun 13', time: '15:00', venue: "Levi's Stadium, San Francisco" },
      { md: 2, home: 'Switzerland',            away: 'Bosnia and Herzegovina', date: 'Jun 18', time: '15:00', venue: 'SoFi Stadium, Los Angeles' },
      { md: 2, home: 'Canada',                 away: 'Qatar',                  date: 'Jun 18', time: '18:00', venue: 'BC Place, Vancouver' },
      { md: 3, home: 'Switzerland',            away: 'Canada',                 date: 'Jun 24', time: '15:00', venue: 'BC Place, Vancouver' },
      { md: 3, home: 'Bosnia and Herzegovina', away: 'Qatar',                  date: 'Jun 24', time: '15:00', venue: 'Lumen Field, Seattle' },
    ],
  },
  {
    group: 'C', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
    matches: [
      { md: 1, home: 'Haiti',    away: 'Scotland', date: 'Jun 13', time: '21:00', venue: 'Gillette Stadium, Boston' },
      { md: 1, home: 'Brazil',   away: 'Morocco',  date: 'Jun 13', time: '18:00', venue: 'MetLife Stadium, New York' },
      { md: 2, home: 'Brazil',   away: 'Haiti',    date: 'Jun 19', time: '21:00', venue: 'Lincoln Financial Field, Philadelphia' },
      { md: 2, home: 'Scotland', away: 'Morocco',  date: 'Jun 19', time: '18:00', venue: 'Gillette Stadium, Boston' },
      { md: 3, home: 'Scotland', away: 'Brazil',   date: 'Jun 24', time: '18:00', venue: 'Hard Rock Stadium, Miami' },
      { md: 3, home: 'Morocco',  away: 'Haiti',    date: 'Jun 24', time: '18:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    ],
  },
  {
    group: 'D', teams: ['United States', 'Paraguay', 'Australia', 'Türkiye'],
    matches: [
      { md: 1, home: 'United States', away: 'Paraguay',      date: 'Jun 12', time: '21:00', venue: 'SoFi Stadium, Los Angeles' },
      { md: 1, home: 'Australia',     away: 'Türkiye',       date: 'Jun 13', time: '00:00', venue: 'BC Place, Vancouver' },
      { md: 2, home: 'Türkiye',       away: 'Paraguay',      date: 'Jun 19', time: '00:00', venue: "Levi's Stadium, San Francisco" },
      { md: 2, home: 'United States', away: 'Australia',     date: 'Jun 19', time: '15:00', venue: 'Lumen Field, Seattle' },
      { md: 3, home: 'Türkiye',       away: 'United States', date: 'Jun 25', time: '22:00', venue: 'SoFi Stadium, Los Angeles' },
      { md: 3, home: 'Paraguay',      away: 'Australia',     date: 'Jun 25', time: '22:00', venue: "Levi's Stadium, San Francisco" },
    ],
  },
  {
    group: 'E', teams: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
    matches: [
      { md: 1, home: 'Ivory Coast', away: 'Ecuador',     date: 'Jun 14', time: '19:00', venue: 'Lincoln Financial Field, Philadelphia' },
      { md: 1, home: 'Germany',     away: 'Curaçao',     date: 'Jun 14', time: '13:00', venue: 'NRG Stadium, Houston' },
      { md: 2, home: 'Germany',     away: 'Ivory Coast', date: 'Jun 20', time: '16:00', venue: 'BMO Field, Toronto' },
      { md: 2, home: 'Ecuador',     away: 'Curaçao',     date: 'Jun 20', time: '20:00', venue: 'Arrowhead Stadium, Kansas City' },
      { md: 3, home: 'Curaçao',     away: 'Ivory Coast', date: 'Jun 25', time: '16:00', venue: 'Lincoln Financial Field, Philadelphia' },
      { md: 3, home: 'Ecuador',     away: 'Germany',     date: 'Jun 25', time: '16:00', venue: 'MetLife Stadium, New York' },
    ],
  },
  {
    group: 'F', teams: ['Netherlands', 'Sweden', 'Japan', 'Tunisia'],
    matches: [
      { md: 1, home: 'Netherlands', away: 'Japan',       date: 'Jun 14', time: '16:00', venue: 'AT&T Stadium, Dallas' },
      { md: 1, home: 'Sweden',      away: 'Tunisia',     date: 'Jun 14', time: '22:00', venue: 'Estadio BBVA, Monterrey' },
      { md: 2, home: 'Netherlands', away: 'Sweden',      date: 'Jun 20', time: '13:00', venue: 'NRG Stadium, Houston' },
      { md: 2, home: 'Tunisia',     away: 'Japan',       date: 'Jun 20', time: '00:00', venue: 'Estadio BBVA, Monterrey' },
      { md: 3, home: 'Japan',       away: 'Sweden',      date: 'Jun 25', time: '19:00', venue: 'AT&T Stadium, Dallas' },
      { md: 3, home: 'Tunisia',     away: 'Netherlands', date: 'Jun 25', time: '19:00', venue: 'Arrowhead Stadium, Kansas City' },
    ],
  },
  {
    group: 'G', teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
    matches: [
      { md: 1, home: 'Iran',        away: 'New Zealand', date: 'Jun 15', time: '21:00', venue: 'SoFi Stadium, Los Angeles' },
      { md: 1, home: 'Belgium',     away: 'Egypt',       date: 'Jun 15', time: '15:00', venue: 'Lumen Field, Seattle' },
      { md: 2, home: 'Belgium',     away: 'Iran',        date: 'Jun 21', time: '15:00', venue: 'SoFi Stadium, Los Angeles' },
      { md: 2, home: 'New Zealand', away: 'Egypt',       date: 'Jun 21', time: '21:00', venue: 'BC Place, Vancouver' },
      { md: 3, home: 'Egypt',       away: 'Iran',        date: 'Jun 26', time: '23:00', venue: 'Lumen Field, Seattle' },
      { md: 3, home: 'New Zealand', away: 'Belgium',     date: 'Jun 26', time: '23:00', venue: 'BC Place, Vancouver' },
    ],
  },
  {
    group: 'H', teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
    matches: [
      { md: 1, home: 'Saudi Arabia', away: 'Uruguay',      date: 'Jun 15', time: '18:00', venue: 'Hard Rock Stadium, Miami' },
      { md: 1, home: 'Spain',        away: 'Cape Verde',   date: 'Jun 15', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
      { md: 2, home: 'Uruguay',      away: 'Cape Verde',   date: 'Jun 21', time: '18:00', venue: 'Hard Rock Stadium, Miami' },
      { md: 2, home: 'Spain',        away: 'Saudi Arabia', date: 'Jun 21', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
      { md: 3, home: 'Cape Verde',   away: 'Saudi Arabia', date: 'Jun 26', time: '20:00', venue: 'NRG Stadium, Houston' },
      { md: 3, home: 'Uruguay',      away: 'Spain',        date: 'Jun 26', time: '20:00', venue: 'Estadio Akron, Guadalajara' },
    ],
  },
  {
    group: 'I', teams: ['France', 'Senegal', 'Norway', 'Iraq'],
    matches: [
      { md: 1, home: 'France',  away: 'Senegal', date: 'Jun 16', time: '15:00', venue: 'MetLife Stadium, New York' },
      { md: 1, home: 'Iraq',    away: 'Norway',  date: 'Jun 16', time: '18:00', venue: 'Gillette Stadium, Boston' },
      { md: 2, home: 'Norway',  away: 'Senegal', date: 'Jun 22', time: '20:00', venue: 'MetLife Stadium, New York' },
      { md: 2, home: 'France',  away: 'Iraq',    date: 'Jun 22', time: '17:00', venue: 'Lincoln Financial Field, Philadelphia' },
      { md: 3, home: 'Norway',  away: 'France',  date: 'Jun 26', time: '15:00', venue: 'Gillette Stadium, Boston' },
      { md: 3, home: 'Senegal', away: 'Iraq',    date: 'Jun 26', time: '15:00', venue: 'BMO Field, Toronto' },
    ],
  },
  {
    group: 'J', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
    matches: [
      { md: 1, home: 'Argentina', away: 'Algeria',   date: 'Jun 16', time: '21:00', venue: 'Arrowhead Stadium, Kansas City' },
      { md: 1, home: 'Austria',   away: 'Jordan',    date: 'Jun 16', time: '00:00', venue: "Levi's Stadium, San Francisco" },
      { md: 2, home: 'Argentina', away: 'Austria',   date: 'Jun 22', time: '13:00', venue: 'AT&T Stadium, Dallas' },
      { md: 2, home: 'Jordan',    away: 'Algeria',   date: 'Jun 22', time: '23:00', venue: "Levi's Stadium, San Francisco" },
      { md: 3, home: 'Algeria',   away: 'Austria',   date: 'Jun 27', time: '22:00', venue: 'Arrowhead Stadium, Kansas City' },
      { md: 3, home: 'Jordan',    away: 'Argentina', date: 'Jun 27', time: '22:00', venue: 'AT&T Stadium, Dallas' },
    ],
  },
  {
    group: 'K', teams: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
    matches: [
      { md: 1, home: 'Portugal',   away: 'DR Congo',   date: 'Jun 17', time: '13:00', venue: 'NRG Stadium, Houston' },
      { md: 1, home: 'Uzbekistan', away: 'Colombia',   date: 'Jun 17', time: '22:00', venue: 'Estadio Azteca, Mexico City' },
      { md: 2, home: 'Portugal',   away: 'Uzbekistan', date: 'Jun 23', time: '13:00', venue: 'NRG Stadium, Houston' },
      { md: 2, home: 'Colombia',   away: 'DR Congo',   date: 'Jun 23', time: '22:00', venue: 'Estadio Akron, Guadalajara' },
      { md: 3, home: 'Colombia',   away: 'Portugal',   date: 'Jun 27', time: '19:30', venue: 'Hard Rock Stadium, Miami' },
      { md: 3, home: 'DR Congo',   away: 'Uzbekistan', date: 'Jun 27', time: '19:30', venue: 'Mercedes-Benz Stadium, Atlanta' },
    ],
  },
  {
    group: 'L', teams: ['England', 'Croatia', 'Ghana', 'Panama'],
    matches: [
      { md: 1, home: 'Ghana',   away: 'Panama',  date: 'Jun 17', time: '19:00', venue: 'BMO Field, Toronto' },
      { md: 1, home: 'England', away: 'Croatia', date: 'Jun 17', time: '16:00', venue: 'AT&T Stadium, Dallas' },
      { md: 2, home: 'England', away: 'Ghana',   date: 'Jun 23', time: '16:00', venue: 'Gillette Stadium, Boston' },
      { md: 2, home: 'Panama',  away: 'Croatia', date: 'Jun 23', time: '19:00', venue: 'BMO Field, Toronto' },
      { md: 3, home: 'Panama',  away: 'England', date: 'Jun 27', time: '17:00', venue: 'MetLife Stadium, New York' },
      { md: 3, home: 'Croatia', away: 'Ghana',   date: 'Jun 27', time: '17:00', venue: 'Lincoln Financial Field, Philadelphia' },
    ],
  },
];

// ─── Knockout Schedule ────────────────────────────────────────────────────────
// ── KNOCKOUT FIXTURES ──────────────────────────────────────────
// Update home/away team names manually as teams qualify:
// Round of 32: update after June 28 group stage completes
// Round of 16: update after July 3-4
// Quarter-finals: update after July 7
// Semi-finals: update after July 11
// Final: update after July 15
// ────────────────────────────────────────────────────────────────

const KNOCKOUT = [
  {
    round: 'Round of 32', dateRange: 'Jun 28 – Jul 3',
    matches: [
      { id: 73,  date: 'Jun 28', dateISO: '2026-06-28', time: '15:00', home: 'Runner-up Group A', away: 'Runner-up Group B',    venue: 'SoFi Stadium, Los Angeles' },
      { id: 74,  date: 'Jun 29', dateISO: '2026-06-29', time: '16:30', home: 'Winner Group E',    away: 'Best 3rd (A/B/C/D/F)', venue: 'Gillette Stadium, Boston' },
      { id: 75,  date: 'Jun 29', dateISO: '2026-06-29', time: '21:00', home: 'Winner Group F',    away: 'Runner-up Group C',    venue: 'Estadio BBVA, Monterrey' },
      { id: 76,  date: 'Jun 29', dateISO: '2026-06-29', time: '13:00', home: 'Winner Group C',    away: 'Runner-up Group F',    venue: 'NRG Stadium, Houston' },
      { id: 77,  date: 'Jun 30', dateISO: '2026-06-30', time: '17:00', home: 'Winner Group I',    away: 'Best 3rd (C/D/F/G/H)', venue: 'MetLife Stadium, New York' },
      { id: 78,  date: 'Jun 30', dateISO: '2026-06-30', time: '13:00', home: 'Runner-up Group E', away: 'Runner-up Group I',    venue: 'AT&T Stadium, Dallas' },
      { id: 79,  date: 'Jun 30', dateISO: '2026-06-30', time: '21:00', home: 'Winner Group A',    away: 'Best 3rd (C/E/F/H/I)', venue: 'Estadio Azteca, Mexico City' },
      { id: 80,  date: 'Jul 1',  dateISO: '2026-07-01', time: '12:00', home: 'Winner Group L',    away: 'Best 3rd (E/H/I/J/K)', venue: 'Mercedes-Benz Stadium, Atlanta' },
      { id: 81,  date: 'Jul 1',  dateISO: '2026-07-01', time: '20:00', home: 'Winner Group D',    away: 'Best 3rd (B/E/F/I/J)', venue: "Levi's Stadium, San Francisco" },
      { id: 82,  date: 'Jul 1',  dateISO: '2026-07-01', time: '16:00', home: 'Winner Group G',    away: 'Best 3rd (A/E/H/I/J)', venue: 'Lumen Field, Seattle' },
      { id: 83,  date: 'Jul 2',  dateISO: '2026-07-02', time: '19:00', home: 'Runner-up Group K', away: 'Runner-up Group L',    venue: 'BMO Field, Toronto' },
      { id: 84,  date: 'Jul 2',  dateISO: '2026-07-02', time: '15:00', home: 'Winner Group H',    away: 'Runner-up Group J',    venue: 'SoFi Stadium, Los Angeles' },
      { id: 85,  date: 'Jul 2',  dateISO: '2026-07-02', time: '23:00', home: 'Winner Group B',    away: 'Best 3rd (E/F/G/I/J)', venue: 'BC Place, Vancouver' },
      { id: 86,  date: 'Jul 3',  dateISO: '2026-07-03', time: '18:00', home: 'Winner Group J',    away: 'Runner-up Group H',    venue: 'Hard Rock Stadium, Miami' },
      { id: 87,  date: 'Jul 3',  dateISO: '2026-07-03', time: '21:30', home: 'Winner Group K',    away: 'Best 3rd (D/E/I/J/L)', venue: 'Arrowhead Stadium, Kansas City' },
      { id: 88,  date: 'Jul 3',  dateISO: '2026-07-03', time: '14:00', home: 'Runner-up Group D', away: 'Runner-up Group G',    venue: 'AT&T Stadium, Dallas' },
    ],
  },
  {
    round: 'Round of 16', dateRange: 'Jul 4 – 7',
    matches: [
      { id: 89,  date: 'Jul 4', dateISO: '2026-07-04', time: '17:00', home: 'Winner Match 74', away: 'Winner Match 77', venue: 'Lincoln Financial Field, Philadelphia' },
      { id: 90,  date: 'Jul 4', dateISO: '2026-07-04', time: '13:00', home: 'Winner Match 73', away: 'Winner Match 75', venue: 'NRG Stadium, Houston' },
      { id: 91,  date: 'Jul 5', dateISO: '2026-07-05', time: '16:00', home: 'Winner Match 76', away: 'Winner Match 78', venue: 'MetLife Stadium, New York' },
      { id: 92,  date: 'Jul 5', dateISO: '2026-07-05', time: '20:00', home: 'Winner Match 79', away: 'Winner Match 80', venue: 'Estadio Azteca, Mexico City' },
      { id: 93,  date: 'Jul 6', dateISO: '2026-07-06', time: '15:00', home: 'Winner Match 83', away: 'Winner Match 84', venue: 'AT&T Stadium, Dallas' },
      { id: 94,  date: 'Jul 6', dateISO: '2026-07-06', time: '20:00', home: 'Winner Match 81', away: 'Winner Match 82', venue: 'Lumen Field, Seattle' },
      { id: 95,  date: 'Jul 7', dateISO: '2026-07-07', time: '12:00', home: 'Winner Match 86', away: 'Winner Match 88', venue: 'Mercedes-Benz Stadium, Atlanta' },
      { id: 96,  date: 'Jul 7', dateISO: '2026-07-07', time: '16:00', home: 'Winner Match 85', away: 'Winner Match 87', venue: 'BC Place, Vancouver' },
    ],
  },
  {
    round: 'Quarterfinals', dateRange: 'Jul 9 – 11',
    matches: [
      { id: 97,  date: 'Jul 9',  dateISO: '2026-07-09', time: '16:00', home: 'Winner Match 89', away: 'Winner Match 90', venue: 'Gillette Stadium, Boston' },
      { id: 98,  date: 'Jul 10', dateISO: '2026-07-10', time: '15:00', home: 'Winner Match 93', away: 'Winner Match 94', venue: 'SoFi Stadium, Los Angeles' },
      { id: 99,  date: 'Jul 11', dateISO: '2026-07-11', time: '17:00', home: 'Winner Match 91', away: 'Winner Match 92', venue: 'Hard Rock Stadium, Miami' },
      { id: 100, date: 'Jul 11', dateISO: '2026-07-11', time: '21:00', home: 'Winner Match 95', away: 'Winner Match 96', venue: 'Arrowhead Stadium, Kansas City' },
    ],
  },
  {
    round: 'Semifinals', dateRange: 'Jul 14 – 15',
    matches: [
      { id: 101, date: 'Jul 14', dateISO: '2026-07-14', time: '15:00', home: 'Winner Match 97',  away: 'Winner Match 98',  venue: 'AT&T Stadium, Dallas' },
      { id: 102, date: 'Jul 15', dateISO: '2026-07-15', time: '15:00', home: 'Winner Match 99',  away: 'Winner Match 100', venue: 'Mercedes-Benz Stadium, Atlanta' },
    ],
  },
  {
    round: 'Third-Place Play-off', dateRange: 'Jul 18',
    matches: [
      { id: 103, date: 'Jul 18', dateISO: '2026-07-18', time: '17:00', home: 'Loser Match 101', away: 'Loser Match 102', venue: 'Hard Rock Stadium, Miami' },
    ],
  },
  {
    round: '⭐ Final', dateRange: 'Jul 19',
    matches: [
      { id: 104, date: 'Jul 19', dateISO: '2026-07-19', time: '15:00', home: 'Winner Match 101', away: 'Winner Match 102', venue: 'MetLife Stadium, New York' },
    ],
  },
];

// ─── Flat fixture list ────────────────────────────────────────────────────────

const MONTH_NUM = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
                    Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };

function fixtureToISODate(s) {
  const [mon, day] = s.split(' ');
  return `2026-${MONTH_NUM[mon]}-${String(day).padStart(2, '0')}`;
}

// 00:00 ET = midnight starting the next calendar day — shift display date forward
function getDisplayDateISO(m) {
  if (m.time === '00:00') {
    const d = new Date(m.dateISO + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  return m.dateISO;
}

const ALL_FIXTURES = (() => {
  const list = [];
  let n = 0;
  SCHEDULE.forEach(g => {
    g.matches.forEach(m => {
      list.push({
        id: ++n, group: g.group, round: `Group ${g.group}`, md: m.md,
        home: m.home, away: m.away, date: m.date, dateISO: fixtureToISODate(m.date),
        time: m.time, venue: m.venue, isKnockout: false,
      });
    });
  });
  KNOCKOUT.forEach(r => {
    r.matches.forEach(m => {
      list.push({
        id: m.id, group: null, round: r.round, md: null,
        home: m.home, away: m.away, date: m.date, dateISO: fixtureToISODate(m.date),
        time: m.time, venue: m.venue, isKnockout: true,
      });
    });
  });
  return list;
})();

// Per-country jersey-number → position lookup (source of truth for lineup display)
const SQUAD_POSITIONS = (() => {
  const map = {};
  TEAMS.forEach(t => {
    const byJersey = {};
    (t.squad || []).forEach(p => {
      if (p.squad_number != null) byJersey[String(p.squad_number)] = p.position;
    });
    map[t.country] = byJersey;
  });
  return map;
})();

let currentScheduleFilter = 'all';
let scheduleOpen = false;
let openGroupPanel = {};

// ─── ELO / Road to Glory data ─────────────────────────────────────────────────

const TEAM_ELO = {
  "argentina":2100,"france":2080,"brazil":2050,"spain":2020,"england":1990,
  "germany":1970,"portugal":1960,"netherlands":1930,"belgium":1880,
  "morocco":1810,"colombia":1800,"uruguay":1790,"usa":1760,"croatia":1760,
  "mexico":1750,"japan":1750,"senegal":1740,"norway":1730,"switzerland":1720,
  "turkiye":1700,"austria":1700,"canada":1680,"sweden":1680,"australia":1630,
  "south-korea":1620,"ecuador":1620,"ivory-coast":1600,"czechia":1600,
  "algeria":1590,"egypt":1580,"ghana":1580,"scotland":1580,"iran":1560,
  "bosnia":1560,"paraguay":1550,"dr-congo":1530,"saudi-arabia":1540,
  "tunisia":1520,"south-africa":1480,"uzbekistan":1460,"cape-verde":1430,
  "iraq":1420,"qatar":1400,"panama":1410,"jordan":1390,"new-zealand":1380,
  "haiti":1350,"curacao":1300,
};

const TEAM_TIER = {
  "argentina":1,"france":1,"brazil":1,"spain":1,"england":1,"germany":1,
  "portugal":1,"netherlands":1,"belgium":1,
  "morocco":2,"colombia":2,"uruguay":2,"usa":2,"croatia":2,"mexico":2,
  "japan":2,"senegal":2,"norway":2,"switzerland":2,"turkiye":2,"austria":2,
  "canada":2,"sweden":2,"australia":2,
  "south-korea":3,"ecuador":3,"ivory-coast":3,"czechia":3,"algeria":3,
  "egypt":3,"ghana":3,"scotland":3,"iran":3,"bosnia":3,"paraguay":3,
  "dr-congo":3,"saudi-arabia":3,"tunisia":3,
  "south-africa":4,"uzbekistan":4,"cape-verde":4,"iraq":4,"qatar":4,
  "panama":4,"jordan":4,"new-zealand":4,"haiti":4,"curacao":4,
};

const ROAD_BRACKET_WINNER = {
  A: { // Mexico — Lane 3
    r32: { opponent:"Best 3rd from C/E/F/H/I", elo:1540,
      reason:"Group A winner plays one of the 8 best 3rd place teams from Groups C, E, F, H or I. Scotland or Haiti from Group C, Tunisia from Group F, Saudi Arabia from Group H. Beatable but never comfortable." },
    r16: { opponent:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 England or whoever wins Group L", elo:1990,
      reason:"Group L winner crosses here. England are heavy favourites to top Group L. A potential R16 on Mexican home soil — one of the most hostile atmospheres any visiting team has ever faced." },
    qf:  { opponent:"🇧🇷 Brazil or 🇯🇵 Japan", elo:1900,
      reason:"The QF opponent is the 1C vs 2F winner. Brazil are favourites to top Group C. Japan as Group F runner-up could also be here after beating Brazil — they knocked out Germany and Spain in 2022." },
    sf:  { opponent:"🇦🇷 Argentina or 🇵🇹 Portugal or 🇨🇦 Canada", elo:1960,
      reason:"Lane 4 sends its winner here. Argentina are the defending champions. Portugal are Ronaldo's farewell mission. Canada are co-hosts on home soil. Any of the three makes for an extraordinary semi-final." },
  },
  B: { // Switzerland — Lane 1 via 2A/2B
    r32: { opponent:"🇰🇷 South Korea or 🇲🇽 Mexico or best 3rd from E/F/G/I/J", elo:1615,
      reason:"Group B winner plays runner-up or 3rd from Group A, or best 3rd from E/F/G/I/J. Mexico are co-hosts. South Korea were 2002 semi-finalists. Manageable but none are walkovers." },
    r16: { opponent:"🇳🇱 Netherlands or whoever wins Group F", elo:1930,
      reason:"Group F winner crosses here. Netherlands are tournament favourites — three-time finalists with Van Dijk and Gakpo. A tough R16 against a team desperate to finally win it." },
    qf:  { opponent:"🇩🇪 Germany or 🇫🇷 France", elo:2025,
      reason:"The QF brings either the 1E or 1I winner. Germany are 4-time champions rebuilt under a new generation. France are the world's top-ranked team. Either QF opponent is elite." },
    sf:  { opponent:"🇪🇸 Spain or 🇺🇸 USA or 🇧🇪 Belgium", elo:1895,
      reason:"Lane 2 sends its winner here. Spain are Euro champions. USA are the host nation on home soil. Belgium are making their last stand. A semi-final at this stage would already be historic." },
  },
  C: { // Brazil — Lane 3
    r32: { opponent:"🇯🇵 Japan or 🇸🇪 Sweden", elo:1715,
      reason:"Group C winner plays runner-up of Group F. Netherlands are favourites to top Group F, making Japan or Sweden the likely opponent. Japan knocked out Germany and Spain in 2022. Sweden have Gyökeres — 46 goals this season. Neither is easy." },
    r16: { opponent:"🇪🇨 Ecuador or 🇸🇳 Senegal", elo:1680,
      reason:"The R16 is the 2E vs 2I winner. Ecuador are likely Group E runners-up behind Germany. Senegal or Norway are likely Group I runners-up behind France. Winnable but both carry real quality." },
    qf:  { opponent:"🇲🇽 Mexico or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", elo:1870,
      reason:"The QF brings either the Group A winner (Mexico on home soil) or the Group L winner (England). Brazil vs Mexico would be a Latin American classic. Brazil vs England is always a spectacle." },
    sf:  { opponent:"🇦🇷 Argentina or 🇵🇹 Portugal or 🇨🇦 Canada", elo:1960,
      reason:"Lane 4 sends its winner here. Argentina vs Brazil semi-final is the South American Clásico on the world stage — the biggest game in football. Portugal or Canada would also be extraordinary." },
  },
  D: { // USA — Lane 2
    r32: { opponent:"Best 3rd from B/E/F/I/J", elo:1560,
      reason:"Group D winner plays the best available 3rd from Groups B, E, F, I or J. Bosnia, Ecuador, Senegal — all beatable but none comfortable. The host nation needs a clean start." },
    r16: { opponent:"🇧🇪 Belgium or whoever wins Group G", elo:1880,
      reason:"Group G winner crosses here. Belgium are favourites to top Group G. USA vs Belgium on American home soil — De Bruyne and Courtois against Pulisic's generation. An electric atmosphere." },
    qf:  { opponent:"🇪🇸 Spain or 🇦🇹 Austria or 🇩🇿 Algeria", elo:1830,
      reason:"The QF brings the 1H or 2J winner. Spain are Euro champions and the clear Group H favourite. Austria under Rangnick press intensely. Either makes for a compelling quarter-final." },
    sf:  { opponent:"🇩🇪 Germany or 🇫🇷 France or 🇳🇱 Netherlands", elo:1993,
      reason:"Lane 1 sends its winner here. Germany, France or Netherlands — three of the finest football nations in the world. A semi-final against any of them on this stage would be the biggest game in US soccer history." },
  },
  E: { // Germany — Lane 1
    r32: { opponent:"Best 3rd from A/B/C/D/F", elo:1430,
      reason:"Group E winner plays the best available 3rd from Groups A, B, C, D or F. South Africa, Qatar, Haiti, Bosnia — all very beatable. The most favourable R32 draw possible for a tier-1 side." },
    r16: { opponent:"🇫🇷 France or whoever wins Group I", elo:2080,
      reason:"Group I winner crosses here. France are the world's top-ranked team and heavy favourites to top Group I. Germany vs France in the Round of 16 — one of football's greatest European rivalries on the world's biggest stage." },
    qf:  { opponent:"🇳🇱 Netherlands or 🇲🇦 Morocco", elo:1870,
      reason:"The QF brings the 1F or 2C winner. Netherlands are favourites to top Group F. Morocco are 2022 semi-finalists as Group C runner-up. Germany vs Netherlands would be one of the great European rivalry renewals." },
    sf:  { opponent:"🇪🇸 Spain or 🇺🇸 USA or 🇧🇪 Belgium", elo:1895,
      reason:"Lane 2 sends its winner here. Spain are Euro champions. USA are the hosts. Belgium are desperate to win before this golden generation fades. Germany reaching this stage means facing elite opposition." },
  },
  F: { // Netherlands — Lane 1
    r32: { opponent:"🇲🇦 Morocco or 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland", elo:1695,
      reason:"Group F winner plays runner-up of Group C. Brazil are favourites to top Group C, making Morocco or Scotland the likely opponent. Morocco are 2022 semi-finalists — organised and dangerous. Scotland have McTominay and a passionate following." },
    r16: { opponent:"🇰🇷 South Korea or 🇨🇦 Canada", elo:1650,
      reason:"The R16 is the 2A vs 2B winner. South Korea are likely Group A runners-up. Canada or Bosnia from Group B. One of the more manageable R16 draws for a tournament favourite." },
    qf:  { opponent:"🇩🇪 Germany or 🇫🇷 France", elo:2025,
      reason:"The QF brings either Germany (1E) or France (1I). Germany vs Netherlands — one of football's most iconic rivalries. France vs Netherlands — two of Europe's finest generations. Either QF would be spectacular." },
    sf:  { opponent:"🇪🇸 Spain or 🇺🇸 USA or 🇧🇪 Belgium", elo:1895,
      reason:"Lane 2 sends its winner here. Spain, USA or Belgium — all capable of beating anyone on their day. A semi-final at this stage would confirm Netherlands as genuine contenders to finally win it." },
  },
  G: { // Belgium — Lane 2
    r32: { opponent:"Best 3rd from A/E/H/I/J", elo:1545,
      reason:"Group G winner plays the best available 3rd from Groups A, E, H, I or J. Algeria, Saudi Arabia, South Korea 3rd — all beatable for Belgium's quality. A manageable opening round." },
    r16: { opponent:"🇺🇸 USA or whoever wins Group D", elo:1760,
      reason:"Group D winner crosses here. USA are the host nation and favourites to top Group D. Belgium vs USA on American home soil — De Bruyne, Courtois against Pulisic's generation. An electric atmosphere." },
    qf:  { opponent:"🇪🇸 Spain or 🇦🇹 Austria or 🇩🇿 Algeria", elo:1830,
      reason:"The QF brings the 1H or 2J winner. Spain are the Euro champions. Austria under Rangnick press with intensity. Belgium vs Spain would be a clash of two of Europe's finest technical sides." },
    sf:  { opponent:"🇩🇪 Germany or 🇫🇷 France or 🇳🇱 Netherlands", elo:1993,
      reason:"Lane 1 sends its winner here. Germany, France or Netherlands — the three other European giants. Belgium's last chance, and the semi-final opponent will be world class whoever it is." },
  },
  H: { // Spain — Lane 2
    r32: { opponent:"🇦🇹 Austria or 🇩🇿 Algeria", elo:1645,
      reason:"Group H winner plays runner-up of Group J. Argentina are favourites to top Group J, making Austria or Algeria the likely opponent. Austria under Rangnick are organised and press-heavy. Algeria have Mahrez and AFCON quality." },
    r16: { opponent:"🇨🇴 Colombia or 🇭🇷 Croatia", elo:1780,
      reason:"The R16 is the 2K vs 2L winner. Colombia are Copa América finalists with Díaz and James. Croatia are 2018 finalists with Modrić's experience. Neither is comfortable but Spain are strong favourites." },
    qf:  { opponent:"🇺🇸 USA or 🇧🇪 Belgium", elo:1820,
      reason:"The QF brings the 1D or 1G winner. USA on home soil with the entire country watching. Belgium's golden generation on their last chance. Spain vs either would be a blockbuster quarter-final." },
    sf:  { opponent:"🇩🇪 Germany or 🇫🇷 France or 🇳🇱 Netherlands", elo:1993,
      reason:"Lane 1 sends its winner here. Germany, France or Netherlands — the three best European sides outside Spain. A semi-final between any two of the four would be one of the great games of the tournament." },
  },
  I: { // France — Lane 1
    r32: { opponent:"Best 3rd from C/D/F/G/H", elo:1540,
      reason:"Group I winner plays the best available 3rd from Groups C, D, F, G or H. Haiti, Saudi Arabia, Tunisia — all beatable for France's quality. The most comfortable R32 draw a top side could hope for." },
    r16: { opponent:"🇩🇪 Germany or whoever wins Group E", elo:1970,
      reason:"Group E winner crosses here. Germany are strong favourites to top Group E. France vs Germany in the Round of 16 — one of football's greatest European rivalries on the world's biggest stage." },
    qf:  { opponent:"🇳🇱 Netherlands or 🇲🇦 Morocco", elo:1870,
      reason:"The QF brings the 1F or 2C winner. Netherlands are three-time finalists desperate to finally win it. Morocco are 2022 semi-finalists as Group C runner-up. Either makes for a compelling quarter-final." },
    sf:  { opponent:"🇪🇸 Spain or 🇺🇸 USA or 🇧🇪 Belgium", elo:1895,
      reason:"Lane 2 sends its winner here. Spain are Euro champions. USA are the host nation. Belgium are making their last stand. France reaching a semi-final is the expectation — winning it is the only acceptable outcome." },
  },
  J: { // Argentina — Lane 4
    r32: { opponent:"🇺🇾 Uruguay or 🇸🇦 Saudi Arabia", elo:1665,
      reason:"Group J winner plays runner-up of Group H. Spain are favourites to top Group H, making Uruguay or Saudi Arabia the likely opponent. Uruguay are two-time World Cup champions — cold and clinical. Saudi Arabia beat Argentina in 2022." },
    r16: { opponent:"🇹🇷 Türkiye or 🇦🇺 Australia or 🇮🇷 Iran or 🇪🇬 Egypt", elo:1630,
      reason:"The R16 is the 2D vs 2G winner. Türkiye or Australia from Group D. Iran or Egypt from Group G. A very favourable Round of 16 draw — no tier-1 opponent stands in the way of the quarter-finals." },
    qf:  { opponent:"🇨🇦 Canada or 🇵🇹 Portugal", elo:1820,
      reason:"The QF brings the 1B or 1K winner. Canada are co-hosts on home soil — the crowd would be extraordinary. Portugal are motivated by Ronaldo's farewell with Bruno Fernandes leading. Either makes for a compelling quarter-final." },
    sf:  { opponent:"🇧🇷 Brazil or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England or 🇲🇽 Mexico", elo:1910,
      reason:"Lane 3 sends its winner here. Brazil vs Argentina semi-final is the South American Clásico — the biggest game in football. England vs Argentina? The ghost of 1986 haunts every meeting. Mexico on home soil would be extraordinary." },
  },
  K: { // Portugal — Lane 4
    r32: { opponent:"Best 3rd from D/E/I/J/L", elo:1560,
      reason:"Group K winner plays the best available 3rd from Groups D, E, I, J or L. Paraguay, Algeria, Ghana, Panama — all beatable but South American and African 3rd place sides are never predictable." },
    r16: { opponent:"🇨🇦 Canada or whoever wins Group B", elo:1680,
      reason:"Group B winner crosses here. Canada are co-host favourites to top Group B. Portugal vs Canada — Ronaldo vs Alphonso Davies — would be a fascinating clash of generations. BMO Field in Toronto would be deafening." },
    qf:  { opponent:"🇦🇷 Argentina or 🇺🇾 Uruguay", elo:1945,
      reason:"The QF is the 1J vs 2H winner. Argentina are defending champions and favourites to top Group J. Uruguay are two-time World Cup winners as Group H runner-up. Either way — a South American giant at the quarter-finals." },
    sf:  { opponent:"🇧🇷 Brazil or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England or 🇲🇽 Mexico", elo:1910,
      reason:"Lane 3 sends its winner here. Brazil are the 5-time champions. England carry 60 years of hurt. Mexico are the co-hosts on home soil. Any of the three makes for a historic semi-final for Portugal." },
  },
  L: { // England — Lane 3
    r32: { opponent:"Best 3rd from E/H/I/J/K", elo:1545,
      reason:"Group L winner plays the best available 3rd from Groups E, H, I, J or K. Saudi Arabia, Algeria, Uzbekistan — all beatable. England need a clean start before the knockout stage gets harder." },
    r16: { opponent:"🇲🇽 Mexico or whoever wins Group A", elo:1750,
      reason:"Group A winner crosses here. Mexico are the host nation and favourites to top Group A. England vs Mexico in the Round of 16 — in front of a Mexican crowd — would be one of the most hostile atmospheres any England team has ever faced." },
    qf:  { opponent:"🇧🇷 Brazil or 🇯🇵 Japan", elo:1900,
      reason:"The QF brings the 1C or 2F winner. Brazil are 5-time champions and favourites to top Group C. Japan as Group F runner-up could be here — they knocked out Germany and Spain in 2022. England vs Brazil would be one of the great World Cup quarter-finals." },
    sf:  { opponent:"🇦🇷 Argentina or 🇵🇹 Portugal or 🇨🇦 Canada", elo:1960,
      reason:"Lane 4 sends its winner here. Argentina vs England — the ghost of 1986 Maradona. Portugal vs England — Ronaldo's farewell against Bellingham's generation. Canada on home soil. Any of the three would be unforgettable." },
  },
};

const ROAD_BRACKET_RUNNERUP = {
  A: { // South Korea — Lane 1 via 2A
    r32: { opponent:"🇨🇦 Canada or 🇧🇦 Bosnia", elo:1620,
      reason:"Group A runner-up plays runner-up of Group B in the 2A vs 2B match. Canada are co-hosts driven by national pride. Bosnia have Džeko leading their attack. A competitive but winnable R32 opener." },
    r16: { opponent:"🇳🇱 Netherlands or whoever wins Group F", elo:1930,
      reason:"Group F winner crosses here. Netherlands are tournament favourites — three-time finalists. Facing a top side immediately in the Round of 16 is the price of finishing runner-up rather than group winner." },
    qf:  { opponent:"🇩🇪 Germany or 🇫🇷 France", elo:2025,
      reason:"The QF brings either Germany or France — the 1E or 1I winner. Both are among the tournament favourites. Reaching this stage as Group A runner-up would already be a major achievement." },
    sf:  { opponent:"🇪🇸 Spain or 🇺🇸 USA or 🇧🇪 Belgium", elo:1895,
      reason:"Lane 2 sends its winner to the semi. Spain, USA or Belgium — all elite. A semi-final at this tournament would be one of the greatest moments in South Korean football history." },
  },
  B: { // Canada — Lane 1 via 2B
    r32: { opponent:"🇰🇷 South Korea or 🇲🇽 Mexico", elo:1685,
      reason:"Group B runner-up plays runner-up of Group A in the 2A vs 2B match. South Korea were 2002 semi-finalists. Mexico are the co-hosts driven by national pride. A tough R32 for a team expected to go further." },
    r16: { opponent:"🇳🇱 Netherlands or whoever wins Group F", elo:1930,
      reason:"Group F winner crosses here. Netherlands are one of the tournament favourites. Facing a top side in the Round of 16 is the cost of finishing runner-up — but Canada beating them would be one of the great upsets." },
    qf:  { opponent:"🇩🇪 Germany or 🇫🇷 France", elo:2025,
      reason:"The QF brings Germany or France. Two of the world's finest teams. Reaching a quarter-final at only Canada's second ever World Cup would already be historic — beating one of these would be legendary." },
    sf:  { opponent:"🇪🇸 Spain or 🇺🇸 USA or 🇧🇪 Belgium", elo:1895,
      reason:"Lane 2 sends its winner here. Spain, USA or Belgium. A semi-final for Canada on home soil would stop the entire country. Alphonso Davies vs the world — that's the dream." },
  },
  C: { // Morocco — Lane 1 via 2C
    r32: { opponent:"🇳🇱 Netherlands or whoever wins Group F", elo:1930,
      reason:"Group C runner-up immediately faces the Group F winner in R32. Netherlands are heavy favourites to top Group F — three-time finalists with Van Dijk and Gakpo. Facing a tournament favourite in the very first knockout game is the toughest possible R32 draw." },
    r16: { opponent:"🇰🇷 South Korea or 🇨🇦 Canada", elo:1650,
      reason:"After surviving Netherlands, the R16 is the 2A vs 2B winner. South Korea or Canada — both quality sides but not tier-1 opponents. If Morocco beat Netherlands, this becomes genuinely winnable." },
    qf:  { opponent:"🇩🇪 Germany or 🇫🇷 France", elo:2025,
      reason:"The QF brings Germany or France — the giants of European football. Morocco reaching this stage would already be a repeat of their 2022 heroics. Beating one of them would be the greatest upset in modern World Cup history." },
    sf:  { opponent:"🇪🇸 Spain or 🇺🇸 USA or 🇧🇪 Belgium", elo:1895,
      reason:"Lane 2 sends its winner to the semi. Morocco in a World Cup semi-final for the second time in succession — Africa would stop. Spain, USA or Belgium stand in the way of the final." },
  },
  D: { // Türkiye — Lane 4 via 2D
    r32: { opponent:"🇮🇷 Iran or 🇪🇬 Egypt", elo:1570,
      reason:"Group D runner-up plays runner-up of Group G. Iran are organised and always more dangerous than their ranking suggests. Egypt have Salah — a match-winner on any given day. A competitive but very winnable R32." },
    r16: { opponent:"🇦🇷 Argentina or whoever wins Group J", elo:2100,
      reason:"Group J winner crosses here. Argentina are defending champions and overwhelming favourites to top Group J. Facing the world champions in the Round of 16 is the hardest possible draw — but also the most glorious stage for an upset." },
    qf:  { opponent:"🇨🇦 Canada or 🇵🇹 Portugal", elo:1820,
      reason:"The QF brings the 1B or 1K winner. Canada on home soil or Portugal motivated by Ronaldo's farewell. Either makes for a compelling and emotionally charged quarter-final." },
    sf:  { opponent:"🇧🇷 Brazil or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England or 🇲🇽 Mexico", elo:1910,
      reason:"Lane 3 sends its winner here. Brazil, England or Mexico — all giants of the game. Türkiye in a World Cup semi-final would be one of the great stories of modern football." },
  },
  E: { // Ecuador — Lane 3 via 2E
    r32: { opponent:"🇸🇳 Senegal or 🇳🇴 Norway", elo:1735,
      reason:"Group E runner-up plays runner-up of Group I in the 2E vs 2I match. Senegal are AFCON champions with Mané leading. Norway have Haaland — the most clinical striker alive. A genuine contest." },
    r16: { opponent:"🇧🇷 Brazil or whoever wins Group C", elo:2050,
      reason:"Group C winner crosses here. Brazil are 5-time champions and favourites to top Group C. A potential Round of 16 against the Seleção — one of the most iconic fixtures in world football." },
    qf:  { opponent:"🇲🇽 Mexico or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", elo:1870,
      reason:"The QF brings the 1A or 1L winner. Mexico on home soil is one of the most hostile environments in football. England carry 60 years of hurt. Either makes for an emotionally charged quarter-final." },
    sf:  { opponent:"🇦🇷 Argentina or 🇵🇹 Portugal or 🇨🇦 Canada", elo:1960,
      reason:"Lane 4 sends its winner here. Argentina are the defending champions. Portugal are motivated by Ronaldo's farewell. Ecuador reaching a semi-final would be the greatest moment in their football history." },
  },
  F: { // Japan — Lane 3 via 2F
    r32: { opponent:"🇧🇷 Brazil or whoever wins Group C", elo:2050,
      reason:"Group F runner-up immediately faces the Group C winner in R32. Brazil are 5-time champions and heavy favourites to top Group C — Vinicius, Raphinha, Endrick. Facing the Seleção in the very first knockout game is the ultimate test." },
    r16: { opponent:"🇪🇨 Ecuador or 🇸🇳 Senegal", elo:1680,
      reason:"After surviving Brazil, the R16 is the 2E vs 2I winner — Ecuador or Senegal. If Japan beat Brazil, this becomes suddenly very winnable. They knocked out Germany and Spain in 2022. Nothing is impossible." },
    qf:  { opponent:"🇲🇽 Mexico or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", elo:1870,
      reason:"The QF brings the 1A or 1L winner. Mexico on home soil is extraordinary. England desperate to end 60 years of hurt. Japan in a World Cup quarter-final would be historic — they've been there before." },
    sf:  { opponent:"🇦🇷 Argentina or 🇵🇹 Portugal or 🇨🇦 Canada", elo:1960,
      reason:"Lane 4 sends its winner here. Argentina, Portugal or Canada — all enormous occasions. Japan reaching a semi-final would be the greatest achievement in Asian football history." },
  },
  G: { // Egypt — Lane 4 via 2G
    r32: { opponent:"🇹🇷 Türkiye or 🇦🇺 Australia", elo:1665,
      reason:"Group G runner-up plays runner-up of Group D. Türkiye finished third in 2002 and carry serious quality. Australia reached the 2022 quarter-finals. A competitive R32 with no easy outcome." },
    r16: { opponent:"🇦🇷 Argentina or whoever wins Group J", elo:2100,
      reason:"Group J winner crosses here. Argentina are the defending champions. Facing the world champions in the Round of 16 is the hardest possible draw — but Salah has beaten them before on his day." },
    qf:  { opponent:"🇨🇦 Canada or 🇵🇹 Portugal", elo:1820,
      reason:"The QF brings the 1B or 1K winner. Canada or Portugal — both emotionally charged opponents. Egypt reaching a World Cup quarter-final would be the greatest moment in their modern football history." },
    sf:  { opponent:"🇧🇷 Brazil or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England or 🇲🇽 Mexico", elo:1910,
      reason:"Lane 3 sends its winner here. Brazil, England or Mexico. Egypt in a World Cup semi-final — with Salah finally having his tournament moment. The stuff of dreams." },
  },
  H: { // Uruguay — Lane 4 via 2H
    r32: { opponent:"🇦🇷 Argentina or whoever wins Group J", elo:2100,
      reason:"Group H runner-up immediately faces the Group J winner in R32. Argentina are the defending champions and overwhelming favourites to top Group J. Facing the world champions in the very first knockout game is as tough as it gets — but Uruguay are two-time World Cup winners who have beaten Argentina before." },
    r16: { opponent:"🇹🇷 Türkiye or 🇦🇺 Australia or 🇮🇷 Iran or 🇪🇬 Egypt", elo:1630,
      reason:"After surviving Argentina, the R16 is the 2D vs 2G winner. Türkiye or Australia from Group D. Iran or Egypt from Group G. If Uruguay beat Argentina, this becomes very winnable — a real chance to reach the quarter-finals." },
    qf:  { opponent:"🇨🇦 Canada or 🇵🇹 Portugal", elo:1820,
      reason:"The QF brings the 1B or 1K winner. Canada are co-hosts on home soil. Portugal are motivated by Ronaldo's farewell. Uruguay reaching a quarter-final through Argentina would already be a major story." },
    sf:  { opponent:"🇧🇷 Brazil or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England or 🇲🇽 Mexico", elo:1910,
      reason:"Lane 3 sends its winner here. Brazil vs Uruguay — the Clásico del Río de la Plata on the world stage. England carry 60 years of hurt. Mexico on home soil. Any of the three makes for an historic semi-final." },
  },
  I: { // Senegal — Lane 3 via 2I
    r32: { opponent:"🇪🇨 Ecuador or 🇨🇮 Ivory Coast", elo:1610,
      reason:"Group I runner-up plays runner-up of Group E in the 2E vs 2I match. Ecuador carry South American quality with Caicedo pulling strings. Ivory Coast are AFCON champions. A competitive but winnable opener." },
    r16: { opponent:"🇧🇷 Brazil or whoever wins Group C", elo:2050,
      reason:"Group C winner crosses here. Brazil are 5-time champions and favourites to top Group C. A potential Round of 16 against the Seleção — Mané vs Vinicius, Africa vs South America. An iconic fixture." },
    qf:  { opponent:"🇲🇽 Mexico or 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", elo:1870,
      reason:"The QF brings the 1A or 1L winner. Mexico on home soil. England desperate to end 60 years of hurt. Senegal reaching a quarter-final would make the whole African continent stop." },
    sf:  { opponent:"🇦🇷 Argentina or 🇵🇹 Portugal or 🇨🇦 Canada", elo:1960,
      reason:"Lane 4 sends its winner here. Argentina, Portugal or Canada — each an enormous occasion. Senegal in a World Cup semi-final would surpass even Morocco's 2022 heroics as the greatest African achievement." },
  },
  J: { // Austria — Lane 2 via 2J
    r32: { opponent:"🇪🇸 Spain or whoever wins Group H", elo:2020,
      reason:"Group J runner-up immediately faces the Group H winner in R32. Spain are Euro champions and tournament favourites — Yamal, Pedri, Rodri in their prime. Facing Spain in the very first knockout game is one of the hardest possible draws." },
    r16: { opponent:"🇨🇴 Colombia or 🇭🇷 Croatia", elo:1780,
      reason:"After surviving Spain, the R16 is the 2K vs 2L winner. Colombia with Díaz and James or Croatia with Modrić's experience. A very winnable match if the R32 is navigated." },
    qf:  { opponent:"🇺🇸 USA or 🇧🇪 Belgium", elo:1820,
      reason:"The QF brings the 1D or 1G winner. USA on American home soil or Belgium's golden generation. Austria in a World Cup quarter-final under Rangnick would be a remarkable achievement." },
    sf:  { opponent:"🇩🇪 Germany or 🇫🇷 France or 🇳🇱 Netherlands", elo:1993,
      reason:"Lane 1 sends its winner here. Germany, France or Netherlands — the giants of European football. Austria vs any of them would be one of the most dramatic semi-finals in World Cup history." },
  },
  K: { // Colombia — Lane 2 via 2K
    r32: { opponent:"🇭🇷 Croatia or 🇬🇭 Ghana", elo:1670,
      reason:"Group K runner-up plays runner-up of Group L in the 2K vs 2L match. Croatia are 2018 finalists with Modrić's unmatched tournament experience. Ghana have Semenyo and Kudus — Africa's dark horses. A competitive but very winnable R32." },
    r16: { opponent:"🇪🇸 Spain or whoever wins Group H", elo:2020,
      reason:"Group H winner crosses here. Spain are the Euro champions and tournament favourites. A potential Round of 16 against the best team in the world — the ultimate test of Colombia's quality and ambition." },
    qf:  { opponent:"🇺🇸 USA or 🇧🇪 Belgium", elo:1820,
      reason:"The QF brings the 1D or 1G winner. USA on home soil would be an extraordinary atmosphere. Belgium's golden generation desperate to win before this window closes. Either makes for a compelling quarter-final." },
    sf:  { opponent:"🇩🇪 Germany or 🇫🇷 France or 🇳🇱 Netherlands", elo:1993,
      reason:"Lane 1 sends its winner here. Germany, France or Netherlands — three of the world's finest. Colombia reaching a semi-final would be the greatest achievement in their football history." },
  },
  L: { // Croatia — Lane 2 via 2L
    r32: { opponent:"🇨🇴 Colombia or 🇨🇩 DR Congo", elo:1665,
      reason:"Group L runner-up plays runner-up of Group K in the 2K vs 2L match. Colombia are Copa América finalists with Díaz and James — a serious, dangerous opponent. DR Congo carry Africa's passion and potential. Either way a competitive R32." },
    r16: { opponent:"🇪🇸 Spain or 🇦🇹 Austria", elo:1860,
      reason:"The R16 brings the 1H or 2J winner. Spain are the Euro champions and tournament favourites. Austria under Rangnick are organised and intense. After Colombia, facing Spain would be the ultimate test." },
    qf:  { opponent:"🇺🇸 USA or 🇧🇪 Belgium", elo:1820,
      reason:"The QF brings the 1D or 1G winner. USA on American home soil with the entire country watching. Belgium's golden generation on their last mission. Croatia vs either would be a compelling quarter-final." },
    sf:  { opponent:"🇩🇪 Germany or 🇫🇷 France or 🇳🇱 Netherlands", elo:1993,
      reason:"Lane 1 sends its winner here. Modrić's farewell in a World Cup semi-final for the third time. Germany, France or Netherlands standing in the way. Croatia defying all logic one final time." },
  },
};

const COUNTRY_TO_TEAM_ID = {
  'United States':          'usa',
  'Bosnia and Herzegovina': 'bosnia',
  'DR Congo':               'dr-congo',
  'Saudi Arabia':           'saudi-arabia',
  'South Korea':            'south-korea',
  'Ivory Coast':            'ivory-coast',
  'South Africa':           'south-africa',
  'Cape Verde':             'cape-verde',
  'New Zealand':            'new-zealand',
  'Türkiye':                'turkiye',
  'Curaçao':                'curacao',
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

function playerSlug(name) {
  return name.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function posLabel(pos) {
  return { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' }[pos] || pos;
}

function spiceEmoji(level) {
  const filled = Math.min(5, Math.round((level / 10) * 5));
  return '🔥'.repeat(filled) + '·'.repeat(5 - filled);
}

function countryToId(country) {
  return COUNTRY_TO_TEAM_ID[country] || country.toLowerCase().replace(/\s+/g, '-');
}

function eloWinProb(teamId, opponentElo) {
  const eloA = TEAM_ELO[teamId] || 1500;
  return Math.round(100 / (1 + Math.pow(10, (opponentElo - eloA) / 400)));
}

function tournamentWinProb(teamId) {
  const tier = TEAM_TIER[teamId] || 3;
  const elo  = TEAM_ELO[teamId]  || 1500;
  const ranges = { 1:[10,22], 2:[3,10], 3:[0.5,3], 4:[0.05,0.5] };
  const [lo, hi] = ranges[tier];
  const peers = Object.entries(TEAM_ELO).filter(([id]) => TEAM_TIER[id] === tier);
  const elos  = peers.map(([,e]) => e);
  const minE  = Math.min(...elos), maxE = Math.max(...elos);
  const frac  = maxE === minE ? 0.5 : (elo - minE) / (maxE - minE);
  const val   = lo + frac * (hi - lo);
  return val < 1 ? parseFloat(val.toFixed(1)) : Math.round(val);
}

function probStyle(p) {
  if (p >= 65) return { color:'#4ade80', emoji:'🟢', word:'Favourite'   };
  if (p >= 50) return { color:'#86efac', emoji:'🟢', word:'Slight edge'  };
  if (p >= 38) return { color:'#facc15', emoji:'🟡', word:'Winnable'     };
  if (p >= 25) return { color:'#fb923c', emoji:'🟠', word:'Tough'        };
  if (p >= 15) return { color:'#f87171', emoji:'🔴', word:'Very Hard'    };
  return               { color:'#c084fc', emoji:'⚫', word:'Miracle'      };
}

function getRoadBracket(team) {
  const teamId = countryToId(team.country);
  const group  = team.group;
  const tier   = TEAM_TIER[teamId] || 3;

  const groupTeams = TEAMS
    .filter(t => t.group === group)
    .sort((a, b) =>
      (TEAM_ELO[countryToId(b.country)] || 1500) -
      (TEAM_ELO[countryToId(a.country)] || 1500)
    );

  const rank = groupTeams.findIndex(t => t.country === team.country);

  if (tier === 4) {
    return { type: 'fairytale', bracket: ROAD_BRACKET_WINNER[group] || {} };
  }

  if (rank === 0) return { type: 'winner',    bracket: ROAD_BRACKET_WINNER[group]   || {} };
  if (rank === 1) return { type: 'runnerup',  bracket: ROAD_BRACKET_RUNNERUP[group] || {} };
  return                 { type: 'thirdplace', bracket: ROAD_BRACKET_WINNER[group]  || {} };
}

function renderRoadToGlory(team) {
  const teamId  = countryToId(team.country);
  const group   = team.group;
  const elo     = TEAM_ELO[teamId] || 1500;
  const tier    = TEAM_TIER[teamId] || 3;
  const { type: pathType, bracket } = getRoadBracket(team);
  const winP    = tournamentWinProb(teamId);
  const teamIso = COUNTRY_ISO[team.country] || '';

  const groupOpponents = TEAMS.filter(t => t.group === group && t.country !== team.country);

  const groupRows = groupOpponents.map(opp => {
    const oppId  = countryToId(opp.country);
    const oppElo = TEAM_ELO[oppId] || 1500;
    const prob   = eloWinProb(teamId, oppElo);
    const { emoji, word, color } = probStyle(prob);
    const oppIso = COUNTRY_ISO[opp.country] || '';
    return `
      <div class="rtg-match-row">
        <div class="rtg-match-teams">
          ${teamIso ? `<span class="fi fi-${teamIso}"></span>` : ''}
          <span class="rtg-vs">vs</span>
          ${oppIso ? `<span class="fi fi-${oppIso}"></span>` : ''}
          <span class="rtg-opp-name">${esc(opp.country)}</span>
        </div>
        <div class="rtg-prob" style="color:${color}">
          Win ${prob}% ${emoji} <span class="rtg-word">${word}</span>
        </div>
      </div>`;
  }).join('');

  const wins     = groupOpponents.filter(o => eloWinProb(teamId, TEAM_ELO[countryToId(o.country)] || 1500) >= 50).length;
  const bySorted = [...groupOpponents].sort((a, b) => (TEAM_ELO[countryToId(a.country)]||1500) - (TEAM_ELO[countryToId(b.country)]||1500));
  const easiest  = bySorted[0];
  const toughest = bySorted[bySorted.length - 1];

  const assessmentText = {
    1: wins === 3
      ? `${esc(team.country)} should win this group comfortably. The real tournament starts in the knockouts.`
      : `${esc(team.country)} are expected to qualify. A slow start is the only real danger.`,
    2: wins >= 2
      ? `${esc(team.country)} should qualify from the group. One upset win could send them into the knockouts with real momentum.`
      : `${esc(team.country)} can qualify but need a strong opening match. Stumble early and the pressure becomes immense.`,
    3: `${esc(team.country)}'s most realistic path is as one of the 8 best 3rd place teams. They need to beat ${esc(easiest?.country || 'the weaker opponents')} and hold ${esc(toughest?.country || 'the bigger sides')} to earn a point.`,
    4: `Just qualifying was the achievement. Every point ${esc(team.country)} earn will be celebrated like a final. One famous result would write them into history.`,
  }[tier];

  function knockoutRound(label, data, isFinal = false) {
    if (!data) return '';
    const prob = eloWinProb(teamId, data.elo);
    const { emoji, word, color } = probStyle(prob);
    return `
      <div class="rtg-knockout-round${isFinal ? ' rtg-final' : ''}">
        <div class="rtg-round-label">${isFinal ? '🏆 THE FINAL' : `IF THEY ADVANCE → ${label}`}</div>
        <div class="rtg-round-opponent">Likely opponent: <strong>${data.opponent}</strong></div>
        <div class="rtg-round-reason">${esc(data.reason)}</div>
        <div class="rtg-prob-row">
          <div class="rtg-prob-bar-track">
            <div class="rtg-prob-bar-fill" style="width:${prob}%;background:${color}"></div>
          </div>
          <span class="rtg-prob-pct" style="color:${color}">Win ${prob}%</span>
          <span class="rtg-prob-emoji">${emoji}</span>
          <span class="rtg-prob-word" style="color:${color}">${word}</span>
        </div>
      </div>`;
  }

  const tierLabels = { 1:'🏆 Tournament favourite', 2:'⭐ Dark horse contender', 3:'🌟 Underdog story', 4:'✨ Fairytale run' };
  const closingLines = {
    1:`Overall win probability: ${winP}%\nThe expectation is the trophy. Anything less is failure.`,
    2:`Overall win probability: ${winP}%\nA quarter-final is realistic. A semi-final would be historic. A final? The stuff of legends.`,
    3:`Overall win probability: ${winP}%\nBut that's what makes it beautiful.`,
    4:`Overall win probability: ${winP}%\nEvery single point feels like a victory.`,
  };
  const historicNote = tier === 3
    ? `<div class="rtg-historic">🪄 <strong>Pure magic territory</strong> — No team at this level has won the World Cup. But Morocco reached the 2022 semi-final. Japan knocked out Germany and Spain. The upsets are real.</div>`
    : tier === 4
    ? `<div class="rtg-historic">🪄 <strong>Pure magic territory</strong> — Reaching the Round of 32 alone would be one of the greatest stories this tournament has ever seen.</div>`
    : '';

  return `
    <div class="rtg-container">
      <div class="rtg-header">
        <div class="rtg-header-left">
          <div class="rtg-eyebrow">Road to Glory · 2026 FIFA World Cup</div>
          <div class="rtg-team-name">${esc(team.country.toUpperCase())}</div>
          <div class="rtg-tier-label">${tierLabels[tier]}</div>
        </div>
        <div class="rtg-header-right">
          <div class="rtg-win-label">Win probability</div>
          <div class="rtg-win-pct">${winP}%</div>
        </div>
      </div>

      <div class="rtg-section-divider">
        <div class="rtg-divider-line"></div>
        <div class="rtg-divider-label">Group ${group} — Group Stage</div>
      </div>
      <div class="rtg-group-matches">${groupRows}</div>
      <div class="rtg-assessment">
        <span class="rtg-assessment-label">⚠️ Honest assessment: </span>${assessmentText}
      </div>

      <div class="rtg-section-divider">
        <div class="rtg-divider-line"></div>
        <div class="rtg-divider-label">Knockout Path</div>
      </div>
      ${pathType === 'thirdplace' ? `<div class="rtg-underdog-banner">🎯 Most realistic route: finish as one of the 8 best 3rd place teams. Path below assumes they advance.</div>` : ''}
      ${pathType === 'fairytale'
        ? `${knockoutRound('Round of 32', bracket.r32)}
           <div class="rtg-fairytale-callout">✨ <strong>Beyond the Round of 32?</strong> Pure magic territory. If ${esc(team.country)} make the knockouts, the whole world will be watching. What happens next would be written into history.</div>`
        : `${knockoutRound('Round of 32', pathType === 'thirdplace'
            ? { opponent:'TBD after group stage', elo:1750, reason:'As one of the 8 best 3rd place teams, the R32 opponent is assigned from a pre-drawn pool after all 12 groups complete — June 28. The specific slot depends on which groups produce the 8 qualifiers. Historically 3rd place teams face group winners — expect a tough but winnable match.' }
            : bracket.r32)}
           ${knockoutRound('Round of 16',   bracket.r16)}
           ${knockoutRound('Quarter-Final', bracket.qf)}
           ${knockoutRound('Semi-Final',    bracket.sf)}
           ${knockoutRound('The Final', { opponent:'The best team left standing', elo: elo + 300,
             reason:'MetLife Stadium, New York · July 19 2026. 80,000 in the stands, 5 billion watching worldwide. One game to decide everything.' }, true)}`
      }

      <div class="rtg-closing">${(closingLines[tier] || '').replace('\n', '<br>')}</div>
      ${historicNote}
    </div>`;
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

function getTournamentPhase() {
  const now = new Date();
  const phases = [
    { start: new Date("2026-06-11T19:00:00Z"), end: new Date("2026-06-28T00:00:00Z"), icon: "🔴", label: "GROUP STAGE",     sub: "Matchday in progress · June 11–28",           color: "#ef4444" },
    { start: new Date("2026-06-28T00:00:00Z"), end: new Date("2026-07-04T00:00:00Z"), icon: "⚡", label: "ROUND OF 32",     sub: "Knockout stage · every match decides all",    color: "#fcae00" },
    { start: new Date("2026-07-04T00:00:00Z"), end: new Date("2026-07-09T00:00:00Z"), icon: "⚡", label: "ROUND OF 16",     sub: "Last 16 · the tournament takes shape",        color: "#fcae00" },
    { start: new Date("2026-07-09T00:00:00Z"), end: new Date("2026-07-11T00:00:00Z"), icon: "🔥", label: "QUARTER-FINALS",  sub: "Last 8 teams remaining",                      color: "#f97316" },
    { start: new Date("2026-07-11T00:00:00Z"), end: new Date("2026-07-14T00:00:00Z"), icon: "🔥", label: "SEMI-FINALS",     sub: "Four teams left standing",                    color: "#f97316" },
    { start: new Date("2026-07-14T00:00:00Z"), end: new Date("2026-07-19T00:00:00Z"), icon: "🏆", label: "THIRD PLACE",     sub: "Third place play-off",                        color: "#fcae00" },
    { start: new Date("2026-07-19T00:00:00Z"), end: new Date("2026-07-20T00:00:00Z"), icon: "🏆", label: "THE FINAL",       sub: "MetLife Stadium · New York · July 19",        color: "#fcae00" },
    { start: new Date("2026-07-20T00:00:00Z"), end: null,                             icon: "⚽", label: "TOURNAMENT OVER", sub: "See you at France 2030",                      color: "#6b7280" },
  ];
  for (const phase of phases) {
    if (now >= phase.start && (!phase.end || now < phase.end)) return phase;
  }
  return null;
}

function initCountdown() {
  const el = document.getElementById('countdown');
  const days  = document.getElementById('cd-days');
  const hours = document.getElementById('cd-hours');
  const mins  = document.getElementById('cd-mins');
  const secs  = document.getElementById('cd-secs');

  function pad(n) { return String(n).padStart(2, '0'); }

  let timerId;
  function tick() {
    const phase = getTournamentPhase();
    if (phase) {
      el.innerHTML = `<div class="live-phase-badge"><span class="phase-icon">${phase.icon}</span><span class="phase-label" style="color:${phase.color}">${phase.label}</span><span class="phase-sub">${phase.sub}</span></div>`;
      if (timerId) clearInterval(timerId);
      return;
    }
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
  timerId = setInterval(tick, 1000);
}

// ─── Helpers for flags/fixtures ───────────────────────────────────────────────

function getTeamCode(iso) {
  if (!iso) return '';
  if (iso === 'gb-eng') return 'ENG';
  if (iso === 'gb-sct') return 'SCT';
  return iso.toUpperCase();
}

function fixtureMatchHtml(matchStr) {
  if (!matchStr) return '';
  const parts = matchStr.split(/\svs\.?\s/i);
  if (parts.length !== 2) return `<div class="fixture-match">${esc(matchStr)}</div>`;
  const [a, b] = parts.map(s => s.trim());
  const mkTeam = (name, isHome) => {
    const iso  = COUNTRY_ISO[name];
    const flag = iso ? `<span class="fi fi-${iso}"></span>` : '';
    const side = isHome ? 'match-team-home' : 'match-team-away';
    const team = TEAMS.find(t => t.country === name);
    return team
      ? `<span class="match-team ${side} team-link" data-country="${esc(name)}">${flag ? `${flag} ` : ''}${esc(name)}</span>`
      : `<span class="match-team ${side}">${flag ? `${flag} ` : ''}${esc(name)}</span>`;
  };
  return `<div class="match-row">${mkTeam(a, true)}<span class="match-vs">vs</span>${mkTeam(b, false)}</div>`;
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
      const teamCode = iso ? getTeamCode(iso) : '';
      const confColor = CONF_COLORS[t.confederation] || '#444';
      return `
        <button class="team-card${t.spotlight ? ' spotlight' : ''}"
                data-country="${esc(t.country)}"
                style="--conf-color:${confColor}"
                aria-label="View ${esc(t.country)}">
          ${flagHtml}
          ${teamCode ? `<span class="team-code">${teamCode}</span>` : ''}
          <span class="team-name">${esc(t.country)}</span>
          <span class="team-conf" style="background:${confColor}">${esc(t.confederation)}</span>
          ${t.spotlight ? '<span class="team-spotlight-badge">★ Spotlight</span>' : ''}
        </button>
      `;
    }).join('');

    return `
      <div class="group-block" data-group="${letter}">
        <div class="group-header-row">
          <h3 class="group-label">Group ${letter}</h3>
          <div class="group-panel-btns">
            <button class="group-panel-btn" data-group="${letter}" data-panel="preview">Preview</button>
            <button class="group-panel-btn" data-group="${letter}" data-panel="fixtures">Fixtures</button>
          </div>
        </div>
        <div class="group-cards">${cards}</div>
        <div class="group-inline-panel" id="group-panel-${letter}"></div>
      </div>
    `;
  }).join('');
}

// ─── Group Inline Panels ──────────────────────────────────────────────────────

function renderGroupPreviewPanel(letter) {
  const g = GROUPS.find(grp => grp.group === `Group ${letter}`);
  if (!g) return '<p style="color:rgba(255,255,255,0.4);font-size:13px">No preview available.</p>';

  const gpFlag = country => {
    const iso = COUNTRY_ISO[country];
    return iso ? `<span class="fi fi-${iso}" style="font-size:0.85rem;border-radius:2px;vertical-align:middle;margin-right:3px"></span>` : '';
  };

  const topFixture = (g.fixture_spice || []).reduce(
    (best, f) => (f.spice_level > (best?.spice_level ?? 0) ? f : best), null
  );

  const callouts = `
    <div class="gp-callouts">
      ${g.favorite ? `<div class="callout"><span class="callout-icon">⭐</span><div><strong>Favourite</strong><span>${gpFlag(g.favorite.country)}${esc(g.favorite.country)}</span><p>${esc(g.favorite.reason)}</p></div></div>` : ''}
      ${g.dark_horse ? `<div class="callout"><span class="callout-icon">🐴</span><div><strong>Dark Horse</strong><span>${gpFlag(g.dark_horse.country)}${esc(g.dark_horse.country)}</span><p>${esc(g.dark_horse.reason)}</p></div></div>` : ''}
    </div>`;

  const fixtureHtml = topFixture ? `
    <p class="gp-section-title">Top Fixture</p>
    <div class="top-fixture">
      ${fixtureMatchHtml(topFixture.match)}
      <div class="fixture-story">${esc(topFixture.story)}</div>
      <div class="fixture-spice">${spiceEmoji(topFixture.spice_level)} ${topFixture.spice_level}/10</div>
    </div>` : '';

  const tableRows = (g.projected_table || []).map(row => {
    const cls = row.status.toLowerCase().includes('likely') ? 'qualified'
      : row.status.toLowerCase().includes('third') ? 'third' : 'underdog';
    return `<tr><td class="pt-pos">${row.position}</td><td class="pt-country">${gpFlag(row.country)}${esc(row.country)}</td><td><span class="pt-status ${cls}">${esc(row.status)}</span></td></tr>`;
  }).join('');

  const tableHtml = tableRows ? `
    <p class="gp-section-title">Projected Standings</p>
    <table class="projected-table"><thead><tr><th>#</th><th>Team</th><th>Outlook</th></tr></thead><tbody>${tableRows}</tbody></table>` : '';

  const heartbreak = g.heartbreak_watch ? `
    <div class="heartbreak">💔 <strong>Heartbreak watch:</strong> ${esc(g.heartbreak_watch.country)} — ${esc(g.heartbreak_watch.reason)}</div>` : '';

  return `<div class="group-panel group-preview-panel">
    <p class="gpp-intro">${esc(g.group_intro)}</p>
    ${callouts}
    ${fixtureHtml}
    ${tableHtml}
    ${heartbreak}
  </div>`;
}

function renderGroupFixturesPanel(letter) {
  const fixtures = ALL_FIXTURES.filter(m => m.group === letter);
  const byMd = {};
  fixtures.forEach(m => { (byMd[m.md] = byMd[m.md] || []).push(m); });
  const mds = Object.keys(byMd).map(Number).sort((a, b) => a - b);

  const mdHtml = mds.map((md, idx) => {
    const matches = byMd[md].slice().sort((a, b) => a.time.localeCompare(b.time));

    const rowsHtml = matches.map(m => {
      const result = matchResults[m.id];
      const status = result?.status || 'upcoming';
      const homeIso = COUNTRY_ISO[m.home] || '';
      const awayIso = COUNTRY_ISO[m.away] || '';
      const homeFlag = homeIso ? `<span class="fi fi-${homeIso}"></span> ` : '';
      const awayFlag = awayIso ? ` <span class="fi fi-${awayIso}"></span>` : '';

      const displayISO = getDisplayDateISO(m);
      const displayDate = new Date(displayISO + 'T12:00:00Z')
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const venueShort = m.venue.split(',')[0];

      let mainLine;
      if (status === 'FT') {
        mainLine = `${homeFlag}${esc(m.home)} <span class="gfp-ft">${result.homeScore}–${result.awayScore}</span> ${esc(m.away)}${awayFlag}`;
      } else if (status === 'LIVE') {
        mainLine = `<span>🔴</span> ${homeFlag}${esc(m.home)} <span class="gfp-live">${result.homeScore}–${result.awayScore}${result.minute ? ` <span class="gfp-min">${result.minute}</span>` : ''}</span> ${esc(m.away)}${awayFlag}`;
      } else {
        mainLine = `<span>⏳</span> ${homeFlag}${esc(m.home)} <span class="gfp-vs-txt">vs</span> ${esc(m.away)}${awayFlag}`;
      }

      return `<div class="gfp-row">
        <div class="gfp-main">${mainLine}</div>
        <div class="gfp-info">${displayDate} · <span class="gfp-time">${esc(m.time)} ET</span> · ${esc(venueShort)}</div>
        ${renderGfpLineupHtml(m.id)}
      </div>`;
    }).join('');

    return `<div class="gfp-matchday${idx > 0 ? ' gfp-matchday-mt' : ''}">
      <div class="gfp-md-label">MATCHDAY ${md}</div>
      ${rowsHtml}
    </div>`;
  }).join('');

  return `<div class="group-panel group-fixtures-panel">${mdHtml}</div>`;
}

function toggleGroupPanel(letter, panel) {
  const current = openGroupPanel[letter];
  const newState = current === panel ? null : panel;
  openGroupPanel[letter] = newState;

  const panelEl = document.getElementById(`group-panel-${letter}`);
  document.querySelectorAll(`.group-panel-btn[data-group="${letter}"]`)
    .forEach(btn => btn.classList.toggle('group-panel-btn-active', newState === btn.dataset.panel));

  if (!newState) {
    panelEl.style.maxHeight = '0';
    panelEl.style.overflow = 'hidden';
  } else {
    panelEl.innerHTML = newState === 'preview'
      ? renderGroupPreviewPanel(letter)
      : renderGroupFixturesPanel(letter);
    panelEl.style.overflow = 'visible';
    panelEl.style.maxHeight = '9999px';
  }
}

// ─── Standings ────────────────────────────────────────────────────────────────

let espnStandingsGroups = {};  // { 'A': [{pos,name,pld,w,d,l,gf,ga,gd,pts},...], ... }
let standingsLastFetched = 0;

async function fetchEspnStandings() {
  try {
    const res = await fetch('https://kickoff26-proxy.kondepatikeerthi.workers.dev/standings');
    const data = await res.json();
    const result = {};
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
      result[letter] = rows;
    }
    espnStandingsGroups = result;
    standingsLastFetched = Date.now();
  } catch(e) { /* silent */ }

  renderHeroStandings();
  // Patch standings tables inside any open group preview panels
  const letters = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  for (const letter of letters) {
    const body = document.querySelector(`.group-preview-body[data-group="${letter}"]`);
    if (!body) continue;
    const existing = body.querySelector('.standings-section');
    if (existing) {
      const tmp = document.createElement('div');
      tmp.innerHTML = renderStandingsTable(letter);
      existing.replaceWith(tmp.firstElementChild);
    }
  }
}

function renderStandingsTable(groupLetter) {
  const rows = espnStandingsGroups[groupLetter] || [];
  const hasData = rows.length > 0 && rows.some(r => r.pld > 0);

  const headerRight = standingsLastFetched
    ? `<span class="st-updated">Updated ${new Date(standingsLastFetched).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET</span>`
    : '';

  const body = !hasData
    ? `<div class="st-placeholder">Standings update automatically once matches begin</div>`
    : `<table class="standings-table">
        <thead><tr>
          <th class="st-col-pos">#</th>
          <th class="st-col-team">Team</th>
          <th>P</th><th>W</th><th>D</th><th>L</th>
          <th>GF</th><th>GA</th><th>GD</th><th class="st-col-pts">Pts</th>
        </tr></thead>
        <tbody>
          ${rows.map((row, i) => {
            const iso = COUNTRY_ISO[row.name];
            const flag = iso ? `<span class="fi fi-${iso}" style="font-size:0.8rem;border-radius:2px;vertical-align:middle;margin-right:3px"></span>` : '';
            const gdStr = row.gd > 0 ? `+${row.gd}` : String(row.gd);
            const gdClass = row.gd > 0 ? 'st-gd-pos' : row.gd < 0 ? 'st-gd-neg' : '';
            return `<tr class="st-row${i < 2 ? ' st-qualifying' : ''}">
              <td class="st-col-pos">${row.pos}</td>
              <td class="st-col-team">${flag}${esc(row.name)}</td>
              <td>${row.pld}</td><td>${row.w}</td><td>${row.d}</td><td>${row.l}</td>
              <td>${row.gf}</td><td>${row.ga}</td>
              <td class="st-gd ${gdClass}">${gdStr}</td>
              <td class="st-pts-val">${row.pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

  return `<div class="standings-section">
    <div class="st-header">
      <span class="st-title">Group ${groupLetter} Standings</span>
      ${headerRight}
    </div>
    ${body}
  </div>`;
}

function renderHeroStandings() {
  const container = document.getElementById('standings-grid');
  if (!container) return;
  const letters = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const hasAnyData = letters.some(l => (espnStandingsGroups[l] || []).some(r => r.pld > 0));
  if (!hasAnyData) {
    container.innerHTML = '<p class="standings-no-data">Standings will appear once the first match kicks off.</p>';
    return;
  }
  container.innerHTML = `<div class="standings-all-grid">${letters.map(l => renderStandingsTable(l)).join('')}</div>`;
}

// ─── Group Previews ───────────────────────────────────────────────────────────

// ─── Match Cards ──────────────────────────────────────────────────────────────

function renderMatchEventsHtml(fixtureId, status, idPrefix = 'mc') {
  const evs = matchEvents[fixtureId];
  if (!evs || (!evs.home.length && !evs.away.length)) return '';
  const icon = t => {
    if (t === 'goal' || t === 'goal---header' || t === 'own-goal') return '⚽';
    if (t === 'penalty-goal') return '⚽<sup class="mc-ev-pen">P</sup>';
    if (t === 'missed-penalty') return '❌';
    if (t === 'yellow-card') return '🟨';
    if (t === 'red-card') return '🟥';
    return '';
  };
  const col = events => events.map(ev => {
    if (ev.type === 'substitution') {
      return `<div class="mc-ev-row">
        <span class="mc-ev-icon"><span class="mc-ev-sub-in">↑</span></span>
        <span class="mc-ev-min">${esc(ev.minute)}</span>
        <span class="mc-ev-name">${esc(ev.player)}</span>
      </div><div class="mc-ev-row mc-ev-indent">
        <span class="mc-ev-icon"><span class="mc-ev-sub-out">↓</span></span>
        <span class="mc-ev-min"></span>
        <span class="mc-ev-name mc-ev-sub-off">${esc(ev.playerOff)}</span>
      </div>`;
    }
    return `<div class="mc-ev-row">
      <span class="mc-ev-icon">${icon(ev.type)}</span>
      <span class="mc-ev-min">${esc(ev.minute)}</span>
      <span class="mc-ev-name">${esc(ev.player)}${ev.assist ? ` (${esc(ev.assist)})` : ''}</span>
    </div>`;
  }).join('');
  const eventsContent = `<div class="mc-events">
    <div class="mc-ev-col mc-ev-home">${col(evs.home)}</div>
    <div class="mc-ev-col mc-ev-away">${col(evs.away)}</div>
  </div>`;
  if (status === 'FT') {
    const panelId = `ev-${idPrefix}-${fixtureId}`;
    return `<div class="mc-events-section">
      <button class="mc-events-btn" data-events-panel="${panelId}">Match Events ▾</button>
      <div class="mc-events-panel" id="${panelId}">${eventsContent}</div>
    </div>`;
  }
  return eventsContent;
}

function renderMatchCard(m, compact = false, idPrefix = 'mc', hideLineup = false, hideEvents = false) {
  const result = matchResults[m.id];
  const status = result?.status || 'upcoming';

  let hd, ad;
  if (m.isKnockout) {
    hd = `<span class="mc-bracket">${esc(m.home)}</span>`;
    ad = `<span class="mc-bracket">${esc(m.away)}</span>`;
  } else {
    const homeIso = COUNTRY_ISO[m.home];
    const awayIso = COUNTRY_ISO[m.away];
    const homeFlag = homeIso ? `<span class="fi fi-${homeIso}"></span> ` : '';
    const awayFlag = awayIso ? `<span class="fi fi-${awayIso}"></span> ` : '';
    hd = `${homeFlag}<span class="mc-team-name mc-team-clickable" data-country="${esc(m.home)}">${esc(m.home)}</span>`;
    ad = `${awayFlag}<span class="mc-team-name mc-team-clickable" data-country="${esc(m.away)}">${esc(m.away)}</span>`;
  }

  const matchNumHtml = m.isKnockout ? `<span class="mc-match-num">M${m.id}</span>` : '';
  const roundLabel = !m.isKnockout ? `Group ${m.group} · MD${m.md}` : m.round;

  let statusStr, teamsHtml, minuteHtml = '';

  if (status === 'LIVE') {
    statusStr = `${matchNumHtml}<span class="mc-status mc-live">🔴 LIVE</span>`;
    teamsHtml = `<span class="mc-team mc-team-home">${hd}</span><span class="mc-score">${result.homeScore} — ${result.awayScore}</span><span class="mc-team mc-team-away">${ad}</span>`;
    if (result.minute) minuteHtml = `<div class="mc-minute">${esc(result.minute)}</div>`;
  } else if (status === 'HT') {
    statusStr = `${matchNumHtml}<span class="mc-status mc-live">🔴 LIVE</span>`;
    teamsHtml = `<span class="mc-team mc-team-home">${hd}</span><span class="mc-score">${result.homeScore} — ${result.awayScore}</span><span class="mc-team mc-team-away">${ad}</span>`;
    minuteHtml = `<div class="mc-minute mc-minute-ht">HT</div>`;
  } else if (status === 'FT') {
    statusStr = `${matchNumHtml}<span class="mc-status mc-ft">FT</span>`;
    teamsHtml = `<span class="mc-team mc-team-home">${hd}</span><span class="mc-score">${result.homeScore} — ${result.awayScore}</span><span class="mc-team mc-team-away">${ad}</span>`;
  } else {
    statusStr = `${matchNumHtml}<span class="mc-status mc-upcoming">⏳ ${esc(m.time)} ET</span>`;
    teamsHtml = `<span class="mc-team mc-team-home">${hd}</span><span class="mc-vs">vs</span><span class="mc-team mc-team-away">${ad}</span>`;
  }

  const venueHtml = compact ? '' : `<div class="mc-venue">${esc(m.venue)}</div>`;
  const liveClass = (status === 'LIVE' || status === 'HT') ? ' mc-card-live' : '';
  const lineupHtml = (!hideLineup && !m.isKnockout) ? renderMatchLineupHtml(m.id, idPrefix) : '';
  const eventsHtml = (!hideEvents && (status === 'LIVE' || status === 'HT' || status === 'FT')) ? renderMatchEventsHtml(m.id, status, idPrefix) : '';

  return `<div class="mc-card${liveClass}" data-match-id="${m.id}">
    <div class="mc-header">${statusStr}<span class="mc-round">${esc(roundLabel)}</span></div>
    <div class="mc-teams">${teamsHtml}</div>
    ${minuteHtml}
    ${eventsHtml}
    ${lineupHtml}
    ${venueHtml}
  </div>`;
}

const byTime = (a, b) => (a.dateISO + a.time).localeCompare(b.dateISO + b.time);

function renderHeroCard(match, role) {
  const result = matchResults[match.id] || {};
  const status = result.status || 'upcoming';
  const homeScore = (result.homeScore !== undefined && result.homeScore !== null) ? result.homeScore : (status === 'FT' || status === 'LIVE' || status === 'HT' ? '?' : '');
  const awayScore = (result.awayScore !== undefined && result.awayScore !== null) ? result.awayScore : (status === 'FT' || status === 'LIVE' || status === 'HT' ? '?' : '');
  const minute = result.minute || '';
  const events = matchEvents[match.id] || { home: [], away: [] };

  // Header badge — branch on status not just role
  let headerHtml = '';
  if (role === 'prev') {
    headerHtml = `<span class="hc-badge hc-badge--ft">FT</span>
                  <span class="hc-meta">${match.round} · MD${match.md}</span>`;
  } else if (role === 'center') {
    if (status === 'LIVE') {
      headerHtml = `<span class="hc-badge hc-badge--live">🔴 LIVE</span>
                    <span class="hc-meta">${match.round} · ${minute ? `${minute}'` : ''}</span>`;
    } else if (status === 'HT') {
      headerHtml = `<span class="hc-badge hc-badge--live">🔴 HT</span>
                    <span class="hc-meta">${match.round}</span>`;
    } else if (status === 'FT') {
      headerHtml = `<span class="hc-badge hc-badge--ft">FT</span>
                    <span class="hc-meta">${match.round} · MD${match.md}</span>`;
    } else {
      headerHtml = `<span class="hc-badge hc-badge--upcoming">⏱ ${match.time} ET</span>
                    <span class="hc-meta">${match.round} · MD${match.md}</span>`;
    }
  } else {
    headerHtml = `<span class="hc-badge hc-badge--upcoming">⏱ ${match.time} ET</span>
                  <span class="hc-meta">${match.round} · MD${match.md}</span>`;
  }

  // Score or vs
  const scoreHtml = role === 'next'
    ? `<span class="hc-vs">vs</span>`
    : `<span class="hc-score">${homeScore} <span class="hc-dash">—</span> ${awayScore}</span>`;

  // Teams row
  const teamsHtml = `
    <div class="hc-teams">
      <div class="hc-team hc-team--home">
        <span class="fi fi-${COUNTRY_ISO[match.home] || ''}"></span>
        <span class="hc-team-name">${match.home}</span>
      </div>
      ${scoreHtml}
      <div class="hc-team hc-team--away">
        <span class="hc-team-name">${match.away}</span>
        <span class="fi fi-${COUNTRY_ISO[match.away] || ''}"></span>
      </div>
    </div>`;

  // Inline events for live/HT center card only
  let eventsHtml = '';
  if (role === 'center' && (status === 'LIVE' || status === 'HT')) {
    const allEvents = [
      ...events.home.map(e => ({ ...e, side: 'home' })),
      ...events.away.map(e => ({ ...e, side: 'away' }))
    ].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0));

    if (allEvents.length) {
      const homeEvts = allEvents.filter(e => e.side === 'home');
      const awayEvts = allEvents.filter(e => e.side === 'away');
      const colHtml = evts => evts.map(e =>
        `<div class="hc-event-row hc-event-row--${e.side}">${renderHcEventRowHtml(e)}</div>`
      ).join('');
      eventsHtml = `<div class="hc-events">
        <div class="hc-events-home">${colHtml(homeEvts)}</div>
        <div class="hc-events-away">${colHtml(awayEvts)}</div>
      </div>`;
    }
  }

  // Lineup button for live/HT center card only
  let lineupHtml = '';
  if (role === 'center' && (status === 'LIVE' || status === 'HT') && !match.isKnockout) {
    lineupHtml = `<div class="hc-lineup-wrap">
      ${renderMatchLineupHtml(match.id, `hc${match.id}`)}
    </div>`;
  }

  // Lineups & Events link for prev card, and for FT center (when no live match)
  const showLink = role === 'prev' && status === 'FT';
  const linkHtml = showLink ? `<a class="hc-events-link" href="#schedule">Lineups &amp; Events →</a>` : '';

  // Venue footer
  const venueHtml = match.venue
    ? `<div class="hc-venue">📍 ${match.venue}</div>`
    : '';

  return `
    <div class="hc-card hc-card--${role}" data-match-id="${match.id}" data-round="${match.round}">
      <div class="hc-header">${headerHtml}</div>
      ${teamsHtml}
      ${eventsHtml}
      ${lineupHtml}
      ${linkHtml}
      ${venueHtml}
    </div>`;
}

function renderHeroMatchCards() {
  const el = document.getElementById('hero-match-cards');
  if (!el) return;

  const allMatches = ALL_FIXTURES.slice().sort(byTime);

  const live = allMatches.find(m => {
    const r = matchResults[m.id];
    return r && (r.status === 'LIVE' || r.status === 'HT');
  });
  const finished = allMatches.filter(m => {
    const r = matchResults[m.id];
    return r && r.status === 'FT';
  });
  const upcoming = allMatches.filter(m => {
    const r = matchResults[m.id];
    return !r || r.status === 'upcoming';
  });

  let prev = null, center = null, next = null;

  if (live) {
    center = live;
    prev   = finished[finished.length - 1] || null;
    next   = upcoming[0] || null;
  } else if (finished.length) {
    center = finished[finished.length - 1];
    prev   = finished[finished.length - 2] || null;
    next   = upcoming[0] || null;
  } else {
    center = upcoming[0] || null;
    next   = upcoming[1] || null;
  }

  const slots = [
    prev   ? { match: prev,   role: 'prev'   } : null,
    center ? { match: center, role: 'center' } : null,
    next   ? { match: next,   role: 'next'   } : null,
  ].filter(Boolean);

  if (!slots.length) { el.innerHTML = ''; return; }

  el.innerHTML = `<div class="hero-match-cards">
    ${slots.map(({ match, role }) =>
      `<div class="hmc-slot hmc-slot--${role}">
        ${renderHeroCard(match, role)}
      </div>`
    ).join('')}
  </div>`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const anchor = el.querySelector('.hmc-slot--center');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
      }
    });
  });
}

// ─── Schedule Section ─────────────────────────────────────────────────────────

function renderScheduleSection(filter) {
  filter = filter || currentScheduleFilter;
  const container = document.getElementById('schedule-section-grid');
  if (!container) return;

  const now = new Date();
  const todayET = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  let fixtures = ALL_FIXTURES;
  if (filter === 'today') {
    fixtures = ALL_FIXTURES.filter(m => m.dateISO === todayET);
  } else if (filter === 'upcoming') {
    fixtures = ALL_FIXTURES.filter(m => {
      const r = matchResults[m.id];
      return (!r || r.status !== 'FT') && m.dateISO >= todayET;
    });
  } else if (filter === 'completed') {
    fixtures = ALL_FIXTURES.filter(m => matchResults[m.id]?.status === 'FT');
  }

  const byDate = {};
  fixtures.forEach(m => {
    const d = getDisplayDateISO(m);
    (byDate[d] = byDate[d] || []).push(m);
  });

  const sorted = Object.keys(byDate).sort();
  if (!sorted.length) {
    container.innerHTML = '<div class="sched-empty">No matches found</div>';
    return;
  }

  container.innerHTML = sorted.map(iso => {
    const header = new Date(iso + 'T12:00:00Z')
      .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      .toUpperCase();
    const dayMatches = byDate[iso].slice().sort((a, b) => a.time.localeCompare(b.time));
    return `<div class="sched-date-group">
      <div class="sched-date-header">${header}</div>
      ${dayMatches.map(m => renderMatchCard(m, false, 's')).join('')}
    </div>`;
  }).join('');
}

function openScheduleSection() {
  scheduleOpen = true;
  const btn = document.getElementById('sched-toggle-btn');
  const content = document.getElementById('schedule-collapsible');
  if (btn) btn.textContent = '▲ Hide';
  if (content) content.style.maxHeight = '9999px';
  renderScheduleSection();
}

function closeScheduleSection() {
  scheduleOpen = false;
  const btn = document.getElementById('sched-toggle-btn');
  const content = document.getElementById('schedule-collapsible');
  if (btn) btn.textContent = '▼ Show';
  if (content) content.style.maxHeight = '0';
}

function toggleScheduleSection() {
  if (scheduleOpen) closeScheduleSection();
  else openScheduleSection();
}

// ─── FIFA Data Fetch ──────────────────────────────────────────────────────────

async function buildFifaIdMap() {
  try {
    const res = await fetch('https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=500&language=en');
    const data = await res.json();
    (data.Results || []).forEach(fm => {
      const fh = getFifaTeamName(fm.Home).toLowerCase();
      const fa = getFifaTeamName(fm.Away).toLowerCase();
      if (!fh || !fa) return; // skip TBD knockout placeholders (empty name → matches everything)
      const fix = ALL_FIXTURES.find(f => {
        const mh = f.home.toLowerCase(), ma = f.away.toLowerCase();
        return (fh.includes(mh.slice(0, 4)) || mh.includes(fh.slice(0, 4))) &&
               (fa.includes(ma.slice(0, 4)) || ma.includes(fa.slice(0, 4)));
      });
      if (fix) {
        fifaMatchIds[fix.id] = {
          idMatch: fm.IdMatch, idStage: fm.IdStage,
          homeTeamId: fm.Home?.IdTeam, awayTeamId: fm.Away?.IdTeam,
        };
      }
    });
  } catch(e) { console.log('FIFA ID map failed:', e); }
}

async function buildEspnIdMap() {
  try {
    const etNow = new Date();
    const etDate = etNow.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
    const etTomorrow = new Date(etNow.getTime() + 86400000)
      .toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
    const base = 'https://kickoff26-proxy.kondepatikeerthi.workers.dev/scoreboard?dates=';
    const [d0, d1] = await Promise.all([
      fetch(`${base}${etDate}`).then(r => r.json()).catch(() => ({})),
      fetch(`${base}${etTomorrow}`).then(r => r.json()).catch(() => ({})),
    ]);
    const events = [...(d0?.events || []), ...(d1?.events || [])];
    events.forEach(event => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      const hn = (home?.team?.displayName || '').toLowerCase();
      const an = (away?.team?.displayName || '').toLowerCase();
      const fix = ALL_FIXTURES.find(f => {
        if (f.isKnockout) return false;
        const mh = f.home.toLowerCase(), ma = f.away.toLowerCase();
        return (hn.includes(mh.split(' ')[0]) || mh.includes(hn.split(' ')[0])) &&
               (an.includes(ma.split(' ')[0]) || ma.includes(an.split(' ')[0]));
      });
      if (fix && !espnMatchIds[fix.id]) espnMatchIds[fix.id] = event.id;
    });
  } catch(e) { /* silent */ }
}

function getEventIcon(type) {
  if (!type) return '⚽';
  const t = type.toLowerCase();
  if (t === 'yellow-card') return '🟨';
  if (t === 'red-card') return '🟥';
  if (t === 'substitution') return '🔄';
  if (t === 'goal---header') return '⚽';
  if (t === 'missed-penalty') return '❌';
  if (t === 'penalty-goal') return '⚽ (P)';
  if (t === 'own-goal') return '🔴';
  return '⚽';
}

function renderHcEventRowHtml(e) {
  const isSub = e.type === 'substitution';
  const playerText = isSub
    ? `${getEventIcon(e.type)} ${e.minute}' ${esc(e.player)}`
    : `${e.minute}' ${esc(e.player)}`;
  const assistText = isSub
    ? (e.playerOff ? `for ${esc(e.playerOff)}` : '')
    : (e.assist ? `Assist: ${esc(e.assist)}` : '');
  const iconHtml = isSub ? '' : `<span class="hc-event-icon">${getEventIcon(e.type)}</span>`;
  return `${iconHtml}<div class="hc-event-detail"><span class="hc-event-player">${playerText}</span>${assistText ? `<span class="hc-event-assist">${assistText}</span>` : ''}</div>`;
}

function parseEspnEvents(keyEvents, fixtureId) {
  if (!keyEvents?.length) return;
  const fixture = ALL_FIXTURES.find(m => m.id === fixtureId);
  if (!fixture) return;
  const homeFirst = fixture.home.toLowerCase().split(' ')[0];
  const homeEvs = [], awayEvs = [];
  for (const ev of keyEvents) {
    const evType = ev.type?.type || '';
    const shortText = ev.shortText || '';
    const fullText = ev.text || shortText;
    const textLower = fullText.toLowerCase();
    const teamName = (ev.team?.displayName || '').toLowerCase();
    const isHome = teamName.includes(homeFirst) || homeFirst.includes(teamName.split(' ')[0] || teamName);
    const minute = ev.clock?.displayValue || '';

    if (evType === 'substitution') {
      const player = ev.participants?.[0]?.athlete?.displayName ||
        shortText.replace(/^Substitution,\s*[^.]+\.\s*/i, '').replace(/\s+Substitution$/i, '').replace(/\s*[-–—]+\s*$/, '').trim();
      const playerOff = ev.participants?.[1]?.athlete?.displayName || '';
      (isHome ? homeEvs : awayEvs).push({ type: 'substitution', minute, player, playerOff });
      continue;
    }

    let type;
    if (evType === 'goal' || evType === 'goal---header' || evType === 'own-goal') {
      type = textLower.includes('penalty') ? 'penalty-goal' : evType;
    } else if (evType === 'penalty') {
      type = textLower.includes('miss') ? 'missed-penalty' : 'penalty-goal';
    } else if (evType === 'missed-penalty' || evType === 'penalty-miss') {
      type = 'missed-penalty';
    } else if (evType === 'yellow-card' || evType === 'red-card') {
      type = evType;
    } else {
      continue;
    }
    const player = shortText
      .replace(/\s+Goal$/i, '').replace(/\s+Header$/i, '').replace(/\s+Own Goal$/i, '')
      .replace(/\s+Yellow Card$/i, '').replace(/\s+Red Card$/i, '')
      .replace(/\s+Penalty$/i, '')
      .replace(/\s*[-–—]+\s*$/, '')
      .trim();
    const assist = (type === 'goal' || type === 'goal---header' || type === 'penalty-goal')
      ? (ev.participants?.[1]?.athlete?.displayName || null)
      : null;
    (isHome ? homeEvs : awayEvs).push({ type, minute, player, assist });
  }
  const sortEvs = arr => arr.sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0));
  const isFinal = matchResults[fixtureId]?.status === 'FT';
  matchEvents[fixtureId] = { home: sortEvs(homeEvs), away: sortEvs(awayEvs), final: isFinal };
}

async function fetchEspnEvents(espnEventId, fixtureId) {
  if (!espnEventId) return;
  try {
    const res = await fetch(`https://kickoff26-proxy.kondepatikeerthi.workers.dev/summary?event=${espnEventId}`);
    const data = await res.json();
    parseEspnEvents(data?.keyEvents, fixtureId);
  } catch(e) { /* silent */ }
}

function saveResultsCache() {
  try { localStorage.setItem('k26_results', JSON.stringify({ ts: Date.now(), data: matchResults })); } catch(e) {}
}

function restoreResultsCache() {
  try {
    const raw = localStorage.getItem('k26_results');
    if (!raw) return;
    const { ts, data } = JSON.parse(raw);
    // Restore if cached within the last 30 minutes
    if (Date.now() - ts < 30 * 60 * 1000) Object.assign(matchResults, data);
  } catch(e) {}
}

function saveFtResultsCache() {
  try {
    // Read existing FT cache (flat structure only)
    let existing = {};
    const raw = localStorage.getItem('k26_ft_results');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Only use data if it's a clean flat object (not nested)
      if (parsed && parsed.data && typeof parsed.data === 'object') {
        Object.entries(parsed.data).forEach(([id, result]) => {
          // Skip any entry that isn't a real match result
          if (result && result.status && typeof result.homeScore === 'number') {
            existing[id] = result;
          }
        });
      }
    }
    // Merge in current FT entries from matchResults
    Object.entries(matchResults).forEach(([id, result]) => {
      if (result && result.status === 'FT') {
        existing[id] = result;
      }
    });
    // Write flat structure: { ts, data: { "1": {...}, "2": {...} } }
    localStorage.setItem('k26_ft_results', JSON.stringify({
      ts: Date.now(),
      data: existing
    }));
  } catch(e) {}
}

function restoreFtResultsCache() {
  // One-time cleanup of nested/corrupted cache structure
  try {
    const raw = localStorage.getItem('k26_ft_results');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && parsed.data.data) {
        // Nested structure detected — extract deepest valid flat layer
        let node = parsed;
        while (node.data && node.data.data && node.data.ts) {
          node = node.data;
        }
        // Rewrite with clean flat structure
        const clean = {};
        Object.entries(node.data || {}).forEach(([id, result]) => {
          if (result && result.status && typeof result.homeScore === 'number') {
            clean[id] = result;
          }
        });
        localStorage.setItem('k26_ft_results', JSON.stringify({
          ts: Date.now(),
          data: clean
        }));
      }
    }
  } catch(e) {}
  try {
    const raw = localStorage.getItem('k26_ft_results');
    if (!raw) return;
    const { ts, data } = JSON.parse(raw);
    // FT results are valid for 24 hours
    if (Date.now() - ts < 24 * 60 * 60 * 1000) {
      Object.entries(data).forEach(([id, result]) => {
        // Only restore FT entries — never overwrite a live/HT result
        if (!matchResults[id] || matchResults[id].status === 'FT') {
          matchResults[parseInt(id)] = result;
        }
      });
    }
  } catch(e) {}
}

function patchLiveScores() {
  Object.entries(matchResults).forEach(([id, result]) => {
    if (!result) return;

    // Patch hero card
    const heroCard = document.querySelector(`.hc-card[data-match-id="${id}"]`);
    if (heroCard) {
      const scoreEl = heroCard.querySelector('.hc-score');
      if (scoreEl) {
        scoreEl.textContent = `${result.homeScore} — ${result.awayScore}`;
      }
      const minuteEl = heroCard.querySelector('.hc-minute');
      if (minuteEl && result.minute) {
        minuteEl.textContent = `${result.minute}'`;
      }
      const metaEl = heroCard.querySelector('.hc-meta');
      if (metaEl && result.status === 'LIVE' && result.minute) {
        metaEl.textContent = `${heroCard.dataset.round || ''} · ${result.minute}'`;
      }
      if (result.status === 'LIVE' || result.status === 'HT') {
        heroCard.closest('.hmc-slot')?.classList.add('hmc-slot--live-pulse');
      }
    }

    // Patch schedule card
    const schedCard = document.querySelector(`.mc-card[data-match-id="${id}"]`);
    if (schedCard) {
      const scoreEl = schedCard.querySelector('.mc-score');
      if (scoreEl) {
        scoreEl.textContent = `${result.homeScore} — ${result.awayScore}`;
      }
      if (result.status === 'LIVE' || result.status === 'HT') {
        schedCard.classList.add('mc-card-live');
      } else {
        schedCard.classList.remove('mc-card-live');
      }
    }
  });

  // Keep center hero card events + lineup in sync without full re-render
  const _centerSlot = document.querySelector('.hmc-slot--center');
  const _centerId = parseInt(_centerSlot?.querySelector('.hc-card')?.dataset.matchId);
  if (_centerId) patchHeroCenter(_centerId);
}

function patchHeroCenter(fixtureId) {
  const slot = document.querySelector('.hmc-slot--center');
  const card = slot?.querySelector('.hc-card');
  if (!card || parseInt(card.dataset.matchId) !== fixtureId) return;
  const result = matchResults[fixtureId] || {};
  const isLiveOrHT = result.status === 'LIVE' || result.status === 'HT';

  if (!isLiveOrHT) {
    const events = matchEvents[fixtureId];
    if (events && !card.querySelector('.hc-events')) {
      const allEvents = [
        ...(events.home || []).map(e => ({ ...e, side: 'home' })),
        ...(events.away || []).map(e => ({ ...e, side: 'away' }))
      ].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0));
      if (allEvents.length) {
        const homeEvts = allEvents.filter(e => e.side === 'home');
        const awayEvts = allEvents.filter(e => e.side === 'away');
        const colHtml = evts => evts.map(e =>
          `<div class="hc-event-row hc-event-row--${e.side}">${renderHcEventRowHtml(e)}</div>`
        ).join('');
        const eventsDiv = document.createElement('div');
        eventsDiv.className = 'hc-events';
        eventsDiv.innerHTML = `<div class="hc-events-home">${colHtml(homeEvts)}</div><div class="hc-events-away">${colHtml(awayEvts)}</div>`;
        const teamsEl = card.querySelector('.hc-teams');
        if (teamsEl) teamsEl.insertAdjacentElement('afterend', eventsDiv);
      }
    }
    if (matchLineups[fixtureId] && !card.querySelector('.hc-lineup-wrap')) {
      const fix = ALL_FIXTURES.find(m => m.id === fixtureId);
      if (fix && !fix.isKnockout) {
        const lineupWrap = document.createElement('div');
        lineupWrap.className = 'hc-lineup-wrap';
        lineupWrap.innerHTML = renderMatchLineupHtml(fixtureId, `hc${fixtureId}`);
        const venueEl = card.querySelector('.hc-venue');
        if (venueEl) card.insertBefore(lineupWrap, venueEl);
        else card.appendChild(lineupWrap);
      }
    }
    return;
  }

  // Update score in-place
  const scoreEl = card.querySelector('.hc-score');
  if (scoreEl && result.homeScore !== undefined) {
    scoreEl.textContent = `${result.homeScore} — ${result.awayScore}`;
  }

  // Update minute in-place
  const metaEl = card.querySelector('.hc-meta');
  if (metaEl && result.status === 'LIVE' && result.minute) {
    metaEl.textContent = `${card.dataset.round || ''} · ${result.minute}'`;
  }

  // Append only new events — never removes existing rows
  const events = matchEvents[fixtureId] || { home: [], away: [] };
  const allEvents = [
    ...events.home.map(e => ({ ...e, side: 'home' })),
    ...events.away.map(e => ({ ...e, side: 'away' })),
  ].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0));
  let evDiv = card.querySelector('.hc-events');
  if (allEvents.length) {
    if (!evDiv) {
      evDiv = document.createElement('div');
      evDiv.className = 'hc-events';
      evDiv.innerHTML = '<div class="hc-events-home"></div><div class="hc-events-away"></div>';
      const teams = card.querySelector('.hc-teams');
      if (teams) teams.after(evDiv);
      else card.prepend(evDiv);
    }
    const homeCol = evDiv.querySelector('.hc-events-home');
    const awayCol = evDiv.querySelector('.hc-events-away');
    const homeEvents = allEvents.filter(e => e.side === 'home');
    const awayEvents = allEvents.filter(e => e.side === 'away');
    const alreadyHome = parseInt(homeCol?.dataset.rendered || '0');
    const alreadyAway = parseInt(awayCol?.dataset.rendered || '0');
    const appendRows = (col, evts, already) => {
      evts.slice(already).forEach(e => {
        const row = document.createElement('div');
        row.className = `hc-event-row hc-event-row--${e.side}`;
        row.innerHTML = renderHcEventRowHtml(e);
        col.appendChild(row);
      });
      if (col) col.dataset.rendered = String(evts.length);
    };
    if (homeCol) appendRows(homeCol, homeEvents, alreadyHome);
    if (awayCol) appendRows(awayCol, awayEvents, alreadyAway);
  }

  // Inject lineup section once — never replaces existing card content
  if (matchLineups[fixtureId] && !card.querySelector('.hc-lineup-wrap')) {
    const fix = ALL_FIXTURES.find(m => m.id === fixtureId);
    if (fix && !fix.isKnockout) {
      const wrap = document.createElement('div');
      wrap.className = 'hc-lineup-wrap';
      wrap.innerHTML = renderMatchLineupHtml(fixtureId, `hc${fixtureId}`);
      const venue = card.querySelector('.hc-venue');
      const link = card.querySelector('.hc-details-link');
      const anchor = link || venue;
      if (anchor) card.insertBefore(wrap, anchor);
      else card.appendChild(wrap);
    }
  }
}

let fetchInProgress = false;

async function fetchLiveScores() {
  if (fetchInProgress) return;
  fetchInProgress = true;
  try {
    // ESPN scoreboard uses UTC dates. Pass ET date explicitly so matches after
    // midnight UTC (e.g. 22:00 ET = 02:00 UTC next day) are still returned.
    // Also fetch tomorrow's ET date to catch matches ESPN lists under the next UTC day.
    const etNow = new Date();
    const etDate = etNow.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
    const etTomorrow = new Date(etNow.getTime() + 86400000)
      .toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
    const base = 'https://kickoff26-proxy.kondepatikeerthi.workers.dev/scoreboard?dates=';
    const etYesterday = new Date(etNow.getTime() - 86400000)
      .toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      .replace(/-/g, '');
    const [d0, d1, d2] = await Promise.all([
      fetch(`${base}${etYesterday}`).then(r => r.json()).catch(() => ({})),
      fetch(`${base}${etDate}`).then(r => r.json()).catch(() => ({})),
      fetch(`${base}${etTomorrow}`).then(r => r.json()).catch(() => ({})),
    ]);
    const events = [...(d0?.events || []), ...(d1?.events || []), ...(d2?.events || [])];
    const now = Date.now();
    for (const event of events) {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      const hn = (home?.team?.displayName || '').toLowerCase();
      const an = (away?.team?.displayName || '').toLowerCase();
      const fix = ALL_FIXTURES.find(f => {
        if (f.isKnockout) return false;
        const mh = f.home.toLowerCase(), ma = f.away.toLowerCase();
        return (hn.includes(mh.split(' ')[0]) || mh.includes(hn.split(' ')[0])) &&
               (an.includes(ma.split(' ')[0]) || ma.includes(an.split(' ')[0]));
      });
      if (!fix) continue;
      if (!espnMatchIds[fix.id]) espnMatchIds[fix.id] = event.id;

      const statusName = comp?.status?.type?.name || '';
      let status = null, homeScore = 0, awayScore = 0, minute = null;
      if (statusName === 'STATUS_FULL_TIME' || statusName === 'STATUS_FINAL') {
        status = 'FT';
        homeScore = parseInt(home?.score ?? 0);
        awayScore = parseInt(away?.score ?? 0);
      } else if (statusName === 'STATUS_HALFTIME') {
        status = 'HT';
        homeScore = parseInt(home?.score ?? 0);
        awayScore = parseInt(away?.score ?? 0);
      } else if ([
        'STATUS_IN_PROGRESS', 'STATUS_FIRST_HALF', 'STATUS_SECOND_HALF',
        'STATUS_EXTRA_TIME', 'STATUS_OVERTIME', 'STATUS_PENALTY',
      ].includes(statusName)) {
        status = 'LIVE';
        homeScore = parseInt(home?.score ?? 0);
        awayScore = parseInt(away?.score ?? 0);
        minute = comp?.status?.displayClock?.replace(/:\d+$/, "'") || null;
      } else if (statusName === 'STATUS_SCHEDULED' || statusName === 'STATUS_PRE' || !statusName) {
        status = 'upcoming';
      }
      // Unknown transitional status (e.g. STATUS_END_PERIOD between halves) — skip
      // updating matchResults so an existing live score is never reset to zero.
      if (status === null) { /* preserve existing */ } else {
        matchResults[fix.id] = { status, homeScore, awayScore, minute };
      }
      const effectiveStatus = status ?? matchResults[fix.id]?.status ?? 'upcoming';

      // Pull events for started/live matches via ESPN
      if (effectiveStatus !== 'upcoming') {
        if (espnMatchIds[fix.id] && (effectiveStatus === 'LIVE' || effectiveStatus === 'HT' || !matchEvents[fix.id]?.final)) {
          fetchEspnEvents(espnMatchIds[fix.id], fix.id);
        }
      }

      // Fetch lineups at T-50min before kickoff
      const kickoffMs = new Date(`${fix.dateISO}T${fix.time}:00-04:00`).getTime();
      if (!matchLineups[fix.id] && now >= kickoffMs - 50 * 60 * 1000) {
        await fetchLineupsForFixture(espnMatchIds[fix.id], fix.id);
        if (matchLineups[fix.id]) {
          patchHeroCenter(fix.id);
          renderScheduleSection();
          Object.keys(openGroupPanel).forEach(letter => {
            if (openGroupPanel[letter] === 'fixtures') {
              const panelEl = document.getElementById(`group-panel-${letter}`);
              if (panelEl) panelEl.innerHTML = renderGroupFixturesPanel(letter);
            }
          });
        }
      }
    }
  } catch(e) { /* silent */ } finally {
    fetchInProgress = false;
  }

  saveResultsCache();
  saveFtResultsCache();
  patchLiveScores();
}

// ─── Lineups ──────────────────────────────────────────────────────────────────

async function fetchLineupsForFixture(espnEventId, fixtureId) {
  try {
    const res = await fetch(`https://kickoff26-proxy.kondepatikeerthi.workers.dev/summary?event=${espnEventId}`);
    const data = await res.json();
    const rosters = data?.rosters;
    if (!rosters?.length) return;
    const homeRoster = rosters.find(r => r.homeAway === 'home');
    const awayRoster = rosters.find(r => r.homeAway === 'away');
    if (!homeRoster || !awayRoster) return;
    const toStarters = r => (r.roster || [])
      .filter(e => e.starter)
      .sort((a, b) => (a.formationPlace || 99) - (b.formationPlace || 99));
    const starters = toStarters(homeRoster);
    if (!starters.length) return;
    const fixture = ALL_FIXTURES.find(m => m.id === fixtureId);
    matchLineups[fixtureId] = {
      home: { name: homeRoster.team?.displayName || '', country: fixture?.home || '', formation: homeRoster.formation || '', players: starters },
      away: { name: awayRoster.team?.displayName || '', country: fixture?.away || '', formation: awayRoster.formation || '', players: toStarters(awayRoster) },
    };
    parseEspnEvents(data?.keyEvents, fixtureId);
  } catch(e) { /* silent */ }
}

function resolveLineupPos(country, jersey, espnAbbr) {
  const espnMap = { G: 'GK', D: 'DF', M: 'MF', F: 'FW' };
  return SQUAD_POSITIONS[country]?.[String(jersey)] || espnMap[espnAbbr] || espnAbbr || '';
}

function renderMatchLineupHtml(fixtureId, idPrefix = 'mc') {
  const lu = matchLineups[fixtureId];
  if (!lu) return '';
  const playerRows = (players, country) => players.map(e => {
    const pos = resolveLineupPos(country, e.jersey, e.position?.abbreviation);
    return `<div class="lu-row"><span class="lu-num">${esc(e.jersey || '')}</span><span class="lu-name">${esc(e.athlete?.shortName || '')}</span><span class="lu-pos">${pos}</span></div>`;
  }).join('');
  const panelId = `lu-${idPrefix}-${fixtureId}`;
  return `<div class="mc-lineup-section">
    <button class="mc-lineup-btn" data-lineup-panel="${panelId}">Starting XI ▾</button>
    <div class="mc-lineup-panel" id="${panelId}">
      <div class="mc-lineup-cols">
        <div class="mc-lineup-col">
          <div class="hc-lineup-header">
            <div class="hc-lineup-country">${esc(lu.home.name)}</div>
            <div class="hc-lineup-formation">${esc(lu.home.formation)}</div>
          </div>
          ${playerRows(lu.home.players, lu.home.country)}
        </div>
        <div class="mc-lineup-col">
          <div class="hc-lineup-header">
            <div class="hc-lineup-country">${esc(lu.away.name)}</div>
            <div class="hc-lineup-formation">${esc(lu.away.formation)}</div>
          </div>
          ${playerRows(lu.away.players, lu.away.country)}
        </div>
      </div>
    </div>
  </div>`;
}

function renderGfpLineupHtml(fixtureId) {
  const lu = matchLineups[fixtureId];
  if (!lu) return '';
  const names = (players, country) => players.map(e => {
    const pos = resolveLineupPos(country, e.jersey, e.position?.abbreviation);
    return `${esc(e.athlete?.shortName || '')}${pos ? ` <span class="glu-pos">${pos}</span>` : ''}`;
  }).join(', ');
  const panelId = `glu-${fixtureId}`;
  return `<div class="gfp-lineup-wrap">
    <button class="gfp-lineup-btn" data-lineup-panel="${panelId}">XI ▾</button>
    <div class="gfp-lineup-panel" id="${panelId}">
      <div class="glu-row"><span class="glu-team">${esc(lu.home.name)}</span> <span class="glu-form">${esc(lu.home.formation)}</span> — ${names(lu.home.players, lu.home.country)}</div>
      <div class="glu-row"><span class="glu-team">${esc(lu.away.name)}</span> <span class="glu-form">${esc(lu.away.formation)}</span> — ${names(lu.away.players, lu.away.country)}</div>
    </div>
  </div>`;
}

document.addEventListener('click', function(e) {
  const lineupBtn = e.target.closest('[data-lineup-panel]');
  if (lineupBtn) {
    const panelId = lineupBtn.dataset.lineupPanel;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const isOpen = panel.classList.contains('lu-open');
    if (isOpen) {
      panel.classList.remove('lu-open');
      panel.style.maxHeight = '0';
    } else {
      panel.classList.add('lu-open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
    const isGfp = lineupBtn.classList.contains('gfp-lineup-btn');
    lineupBtn.textContent = isOpen ? (isGfp ? 'XI ▾' : 'Starting XI ▾') : (isGfp ? 'XI ▴' : 'Starting XI ▴');
    return;
  }
  const evBtn = e.target.closest('[data-events-panel]');
  if (evBtn) {
    const panelId = evBtn.dataset.eventsPanel;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const isOpen = panel.classList.contains('ev-open');
    if (isOpen) {
      panel.classList.remove('ev-open');
      panel.style.maxHeight = '0';
    } else {
      panel.classList.add('ev-open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
    evBtn.textContent = isOpen ? 'Match Events ▾' : 'Match Events ▴';
    return;
  }
  const clickable = e.target.closest('.mc-team-clickable[data-country]');
  if (clickable) { openModal(clickable.dataset.country); return; }
});

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
        ${item.yt ? `<div class="glossary-video"><iframe src="${item.yt}" title="${esc(item.term)} explainer" allowfullscreen loading="lazy"></iframe></div>` : ''}
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
  modal.dataset.country = country;
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
  const popup = document.getElementById('squad-player-popup');
  if (popup) popup.remove();
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
      <div class="modal-flag"><span class="fi fi-${COUNTRY_ISO[team.country] || ''}" style="width:48px;height:36px;border-radius:4px;display:inline-block;"></span></div>
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

function squadHtml(players, topLeagueOnly = false, team = null) {
  const list = topLeagueOnly ? players.filter(p => p.in_top_league) : players;
  if (!list.length) return '';

  const ORDER = ['GK', 'DF', 'MF', 'FW'];
  const byPos = Object.fromEntries(ORDER.map(p => [p, []]));
  for (const p of list) {
    if (byPos[p.position]) byPos[p.position].push(p);
    else byPos['FW'].push(p);
  }

  const country = team ? team.country : '';
  const countryCode = team ? (COUNTRY_ISO[team.country] || '') : '';

  return ORDER.filter(pos => byPos[pos].length > 0).map(pos => `
    <div class="squad-position-group">
      <h4 class="squad-pos-label">${posLabel(pos)}s</h4>
      <div class="squad-players">
        ${byPos[pos].map(p => `
          <div class="squad-player squad-player-row"
               data-name="${esc(p.full_name)}"
               data-number="${p.squad_number ?? ''}"
               data-club="${esc(p.club || '')}"
               data-caps="${p.caps ?? ''}"
               data-market-value="${esc(p.market_value_fmt || '')}"
               data-position="${posLabel(p.position)}"
               data-country="${esc(country)}"
               data-country-code="${countryCode}"
               data-age="${p.age ?? ''}"
               data-league="${esc(p.sofa_league || p.league || '')}"
               data-is-top-league="${p.in_top_league ? 'true' : 'false'}">
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

  const squad = squadHtml(team.squad || [], false, team);

  return `
    ${modalHeader(team)}
    <div class="modal-tabs-bar">
      <button class="modal-tab active" data-tab="overview">📋 Overview</button>
      <button class="modal-tab" data-tab="road-to-glory">🏆 Road to Glory</button>
    </div>
    <div class="modal-tab-panel" data-tab-content="overview">
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
    </div>
    <div class="modal-tab-panel" data-tab-content="road-to-glory" hidden></div>
  `;
}

function buildCompactModal(team) {
  const squad = squadHtml(team.squad || [], false, team);

  const ptw = (team.players_to_watch || []).map(p => `
    <div class="key-player key-star">
      <div class="kp-header">
        <span class="kp-name">${esc(p.name)}</span>
        <span class="kp-type">📍 ${esc(p.position)}</span>
      </div>
      <p class="kp-why">${esc(p.why)}</p>
    </div>
  `).join('');

  return `
    ${modalHeader(team)}
    <div class="modal-tabs-bar">
      <button class="modal-tab active" data-tab="overview">📋 Overview</button>
      <button class="modal-tab" data-tab="road-to-glory">🏆 Road to Glory</button>
    </div>
    <div class="modal-tab-panel" data-tab-content="overview">
    <div class="modal-body">
      <div class="modal-section">
        <div class="compact-info">
          ${team.wc_debut_year  ? `<div class="ci-row"><span>WC Debut</span><strong>${team.wc_debut_year}</strong></div>` : ''}
          ${team.wc_best_finish ? `<div class="ci-row"><span>Best Finish</span><strong>${esc(team.wc_best_finish)}</strong></div>` : ''}
          ${team.manager        ? `<div class="ci-row"><span>Manager</span><strong>${esc(team.manager)}</strong></div>` : ''}
        </div>
      </div>

      ${team.story ? `
        <div class="modal-section">
          <p class="team-story">${esc(team.story)}</p>
        </div>` : ''}

      ${ptw ? `
        <div class="modal-section">
          <h3 class="msec-title">Players to Watch</h3>
          <div class="key-players">${ptw}</div>
        </div>` : ''}

      ${(team.playstyle || team.history || team.heartbreak_angle) ? `
        <div class="modal-section">
          <h3 class="msec-title">The Story</h3>
          ${team.playstyle       ? `<div class="tactic-block"><strong>⚙️ How They Play</strong><p>${esc(team.playstyle)}</p></div>` : ''}
          ${team.history         ? `<div class="tactic-block"><strong>📜 History</strong><p>${esc(team.history)}</p></div>` : ''}
          ${team.heartbreak_angle ? `<div class="tactic-block"><strong>💔 Danger Zone</strong><p>${esc(team.heartbreak_angle)}</p></div>` : ''}
        </div>` : ''}

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
    </div>
    <div class="modal-tab-panel" data-tab-content="road-to-glory" hidden></div>
  `;
}

// ─── Squad Player Popup ───────────────────────────────────────────────────────

function openSquadPlayerCard(data) {
  const existing = document.getElementById('squad-player-popup');
  if (existing) existing.remove();

  const iso = data.countryCode;
  const flagHtml = iso ? `<span class="fi fi-${esc(iso)}" style="border-radius:2px"></span>` : '';

  const popup = document.createElement('div');
  popup.id = 'squad-player-popup';
  popup.className = 'squad-player-popup';
  popup.innerHTML = `
    <button class="popup-close" aria-label="Close">×</button>
    <div class="popup-header">
      <div class="popup-number">${data.number || '—'}</div>
      <div class="popup-info">
        <h3>${esc(data.name)}</h3>
        <div class="popup-country">${flagHtml} ${esc(data.country)}</div>
      </div>
      <span class="popup-position-badge">${esc(data.position)}</span>
    </div>
    <div class="popup-stats-grid">
      <div class="popup-stat">
        <span class="popup-stat-label">Club</span>
        <span class="popup-stat-value">${esc(data.club) || '—'}</span>
      </div>
      <div class="popup-stat">
        <span class="popup-stat-label">League</span>
        <span class="popup-stat-value">${esc(data.league) || '—'}</span>
      </div>
      <div class="popup-stat">
        <span class="popup-stat-label">Caps</span>
        <span class="popup-stat-value">${data.caps || '—'}</span>
      </div>
      <div class="popup-stat">
        <span class="popup-stat-label">Value</span>
        <span class="popup-stat-value gold">${esc(data.marketValue) || '—'}</span>
      </div>
      <div class="popup-stat">
        <span class="popup-stat-label">Age</span>
        <span class="popup-stat-value">${data.age || '—'}</span>
      </div>
    </div>
    ${data.isTopLeague === 'true' ? `
      <div class="popup-league-badge">⭐ Top League Player</div>` : ''}
  `;

  document.getElementById('team-modal').appendChild(popup);

  popup.querySelector('.popup-close').addEventListener('click', (e) => {
    e.stopPropagation();
    popup.remove();
  });
}

// ─── Player Modal ─────────────────────────────────────────────────────────────

const playerModal = document.getElementById('player-modal');
const playerModalBody = document.getElementById('player-modal-content');

function openPlayerModal(slug) {
  const player = PLAYERS_WATCH.flatMap(t => t.players)
    .find(p => p.name.toLowerCase().replace(/\s+/g, '-') === slug);
  if (!player) return;
  playerModalBody.innerHTML = buildPlayerModal(player);
  playerModal.classList.add('open');
  playerModal.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  playerModal.querySelector('.modal-panel').scrollTop = 0;
}

function closePlayerModal() {
  playerModal.classList.remove('open');
  playerModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function buildPlayerModal(p) {
  const confColor = CONF_COLORS[p.conf] || '#444';
  const highlightsHtml = (p.highlights || []).map(h => `<li>${esc(h)}</li>`).join('');
  const league = CLUB_LEAGUE[p.club] || '';
  return `
    <div class="modal-header">
      <div class="player-modal-photo" style="background:${confColor}">
        <img src="images/players/${playerSlug(p.name)}.jpg"
             alt="${esc(p.name)}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="player-initials" style="display:none">${esc(p.init)}</div>
      </div>
      <div class="modal-title-block">
        <h2 class="modal-country">${esc(p.name)}</h2>
        <div class="modal-meta">
          <span class="fi fi-${p.iso}" style="font-size:1.3rem;border-radius:3px"></span>
          <span class="meta-group">${esc(p.country)}</span>
          <span class="meta-badge" style="background:${confColor}">${esc(p.pos)}</span>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <div class="compact-info">
          <div class="ci-row"><span>Age</span><strong>${p.age ?? '—'}</strong></div>
          <div class="ci-row"><span>Club</span><strong>${esc(p.club)}</strong></div>
          ${league ? `<div class="ci-row"><span>League</span><strong>${esc(league)}</strong></div>` : ''}
          <div class="ci-row"><span>International caps</span><strong>${esc(p.caps ?? '—')}</strong></div>
        </div>
      </div>
      ${highlightsHtml ? `
        <div class="modal-section">
          <h3 class="msec-title">Career Highlights</h3>
          <ul class="player-highlights">${highlightsHtml}</ul>
        </div>` : ''}
      <div class="modal-section">
        <button class="player-view-squad" data-country="${esc(p.country)}">
          View ${esc(p.country)} Squad →
        </button>
      </div>
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
            <img src="images/players/${playerSlug(p.name)}.jpg"
                 alt="${esc(p.name)}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="player-initials" style="display:none">${esc(p.init)}</div>
          </div>
          <span class="player-name">${esc(p.name)}</span>
          <div class="player-country">
            <span class="fi fi-${p.iso}"></span>
            <span>${esc(p.country)}</span>
          </div>
          <div class="player-club">Club: ${esc(p.club)}</div>
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
    const ytUrl = m.yt;
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

// ─── Quiz ─────────────────────────────────────────────────────────────────────

let quizCurrentQ = 0;
let quizAnswers  = {};
let quizSelected = null;

function calculateQuizResult(answers) {
  const userAnswers = [
    answers.style,
    answers.story,
    answers.region,
    answers.vibe,
    answers.outcome,
  ];
  const userRegion = answers.region;

  const scores = Object.entries(HOME_COMBOS)
    .map(([teamId, combo]) => {
      let score = 0;
      userAnswers.forEach((a, i) => { if (combo[i] === a) score++; });
      if (combo[2] === userRegion) score += 10;
      return { teamId, score };
    });

  scores.sort((a, b) => b.score - a.score);

  const topId      = scores[0].teamId;
  const secondId   = scores[1].teamId;
  const topScore   = scores[0].score;
  const secondScore = scores[1].score;
  const isClose = secondScore >= topScore - 1
    && secondId !== topId
    && HOME_COMBOS[secondId][2] === userRegion;

  return { topId, secondId, isClose };
}

function renderQuizQuestion() {
  const q     = QUIZ_QUESTIONS[quizCurrentQ];
  const total = QUIZ_QUESTIONS.length;
  const dots  = Array.from({ length: total }).map((_, i) =>
    `<div class="quiz-dot ${i < quizCurrentQ ? 'done' : i === quizCurrentQ ? 'active' : ''}"></div>`
  ).join('');
  const options = q.options.map(opt =>
    `<button class="quiz-option${quizSelected === opt.id ? ' selected' : ''}" data-option="${opt.id}">
      <span class="quiz-option-emoji">${opt.emoji}</span>
      <span class="quiz-option-label">${opt.label}</span>
      <span class="quiz-option-sub">${opt.sub}</span>
    </button>`
  ).join('');
  return `
    <div class="quiz-progress">${dots}</div>
    <div class="quiz-question-emoji">${q.emoji}</div>
    <h3 class="quiz-question-text">${q.question}</h3>
    <div class="quiz-options-grid">${options}</div>
    <button class="quiz-next-btn ${quizSelected ? 'active' : 'disabled'}" id="quiz-next">
      ${quizCurrentQ === total - 1 ? 'Find my team →' : 'Next →'}
    </button>
    <div class="quiz-counter">${quizCurrentQ + 1} of ${total}</div>
  `;
}

function quizFiFlag(teamId, size = '3rem') {
  const country = QUIZ_ID_TO_COUNTRY[teamId] || QUIZ_TEAMS[teamId]?.name;
  const iso = country ? COUNTRY_ISO[country] : null;
  return iso ? `<span class="fi fi-${iso}" style="font-size:${size};line-height:1;border-radius:3px"></span>` : QUIZ_TEAMS[teamId]?.flag || '';
}

function renderQuizResult(result) {
  const team   = QUIZ_TEAMS[result.topId];
  const second = QUIZ_TEAMS[result.secondId];
  if (!team) return '<p style="color:white">Error loading result.</p>';
  const secondFlag = result.secondId ? quizFiFlag(result.secondId, '1rem') : '';
  const closeNote = (result.isClose && second)
    ? `<div class="quiz-close-note">You were also close to <strong>${secondFlag} ${second.name}</strong> — both match your style.</div>`
    : '';
  return `
    <div class="quiz-result">
      <div class="quiz-result-eyebrow">Your team is</div>
      <div class="quiz-result-flag">${quizFiFlag(result.topId, '3rem')}</div>
      <div class="quiz-result-name">${team.name.toUpperCase()}</div>
      <div class="quiz-result-tagline" style="color:${team.accent}">${team.tagline}</div>
      <div class="quiz-result-hook" style="border-left:3px solid ${team.accent}">${team.hook}</div>
      <div class="quiz-result-meta">
        <div class="quiz-meta-item">
          <span class="quiz-meta-label">Group</span>
          <span class="quiz-meta-value">Group ${team.group}</span>
        </div>
        <div class="quiz-meta-item">
          <span class="quiz-meta-label">Watch</span>
          <span class="quiz-meta-value">${team.player}</span>
        </div>
      </div>
      <div class="quiz-player-row">
        <span>${team.playerFlag}</span>
        <div>
          <div class="quiz-player-label">Player to watch</div>
          <div class="quiz-player-name">${team.player}</div>
        </div>
      </div>
      ${closeNote}
      <button class="quiz-profile-btn" data-quiz-team="${result.topId}">View ${team.name}'s Full Profile →</button>
      <button class="quiz-retake-btn" id="quiz-retake">Try again</button>
      <div class="quiz-share-line">Share with friends → <span>kickoff-fifa2026.com</span></div>
    </div>
  `;
}

function wireQuizEvents() {
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      quizSelected = btn.dataset.option;
      document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const nextBtn = document.getElementById('quiz-next');
      if (nextBtn) { nextBtn.classList.remove('disabled'); nextBtn.classList.add('active'); }
    });
  });
  const nextBtn = document.getElementById('quiz-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!quizSelected) return;
      quizAnswers[QUIZ_QUESTIONS[quizCurrentQ].id] = quizSelected;
      quizCurrentQ++;
      quizSelected = null;
      renderQuiz();
    });
  }
  const retakeBtn = document.getElementById('quiz-retake');
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      quizCurrentQ = 0; quizAnswers = {}; quizSelected = null;
      renderQuiz();
    });
  }
  const profileBtn = document.querySelector('.quiz-profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      const teamId  = profileBtn.dataset.quizTeam;
      const country = QUIZ_ID_TO_COUNTRY[teamId] || QUIZ_TEAMS[teamId]?.name;
      if (country) openModal(country);
    });
  }
}

function renderQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container) return;
  container.innerHTML = quizCurrentQ < QUIZ_QUESTIONS.length
    ? renderQuizQuestion()
    : renderQuizResult(calculateQuizResult(quizAnswers));
  wireQuizEvents();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Module scripts are deferred — DOM is always ready when this runs.

renderQuiz();
renderTeamsGrid();
renderGlossary();
renderPlayersSection();
renderMomentsSection();
initCountdown();
restoreResultsCache();    // show last known scores instantly on reload
restoreFtResultsCache(); // overlay persistent FT results (24h TTL)
renderHeroMatchCards();
function isInMatchWindow() {
  const nowMs = Date.now();
  const WINDOW_BEFORE_MS = 50 * 60 * 1000;
  const WINDOW_AFTER_MS = 120 * 60 * 1000;
  return ALL_FIXTURES.some(m => {
    const kick = new Date(m.dateISO + 'T' + m.time + ':00-04:00').getTime();
    return nowMs >= kick - WINDOW_BEFORE_MS && nowMs <= kick + WINDOW_AFTER_MS;
  });
}

let _schedFirstRun = true;
function scheduleLiveScores() {
  if (_schedFirstRun || isInMatchWindow()) {
    fetchLiveScores();
    _schedFirstRun = false;
  }
  setTimeout(scheduleLiveScores, 60000);
}

scheduleLiveScores();
buildFifaIdMap();

// Fetch standings live from ESPN — refresh every 5 minutes
fetchEspnStandings();
setInterval(fetchEspnStandings, 5 * 60 * 1000);

// Schedule header row — collapse/expand toggle
document.getElementById('schedule-header-row').addEventListener('click', toggleScheduleSection);

// Nav Schedule link — expand section then scroll
document.querySelector('.nav-links a[href="#schedule"]').addEventListener('click', e => {
  e.preventDefault();
  openScheduleSection();
  setTimeout(() => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' }), 50);
});

// Hero Schedule button — expand section then scroll
document.getElementById('hero-schedule-btn').addEventListener('click', () => {
  openScheduleSection();
  setTimeout(() => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' }), 50);
});

// Schedule section filter tabs
document.querySelectorAll('.sched-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sched-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentScheduleFilter = btn.dataset.filter;
    renderScheduleSection(currentScheduleFilter);
  });
});

// Modal close — close button, click outside panel, or Escape
document.querySelector('.modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => {
  // squad player row click — open mini popup
  const row = e.target.closest('.squad-player-row');
  if (row) { openSquadPlayerCard(row.dataset); return; }
  // close popup on click outside it
  const popup = document.getElementById('squad-player-popup');
  if (popup && !popup.contains(e.target)) { popup.remove(); return; }
  // backdrop click — close modal
  if (!e.target.closest('.modal-panel')) closeModal();
});
// Modal tab switching (Overview / Road to Glory)
modal.addEventListener('click', e => {
  const tab = e.target.closest('.modal-tab');
  if (!tab) return;
  const panel = modal.querySelector('.modal-panel');
  panel.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t === tab));
  const tabName = tab.dataset.tab;
  panel.querySelectorAll('.modal-tab-panel').forEach(p => { p.hidden = p.dataset.tabContent !== tabName; });
  if (tabName === 'road-to-glory') {
    const rtgPanel = panel.querySelector('[data-tab-content="road-to-glory"]');
    if (rtgPanel && !rtgPanel.dataset.rendered) {
      const country = modal.dataset.country;
      const team = TEAMS.find(t => t.country === country);
      if (team) { rtgPanel.innerHTML = renderRoadToGlory(team); rtgPanel.dataset.rendered = '1'; }
    }
  }
});

// Team card + group panel button clicks — event delegation on the grid
document.getElementById('teams-grid').addEventListener('click', e => {
  const panelBtn = e.target.closest('.group-panel-btn');
  if (panelBtn) { toggleGroupPanel(panelBtn.dataset.group, panelBtn.dataset.panel); return; }
  const card = e.target.closest('.team-card[data-country]');
  if (card) openModal(card.dataset.country);
});

// Player card clicks — open player modal
document.getElementById('players-grid').addEventListener('click', e => {
  const card = e.target.closest('.player-watch-card[data-player]');
  if (card) openPlayerModal(card.dataset.player);
});

// Player modal: close button + backdrop click + "View Squad" button
document.querySelector('.player-modal-close').addEventListener('click', closePlayerModal);
playerModal.addEventListener('click', e => {
  const squadBtn = e.target.closest('.player-view-squad');
  if (squadBtn) {
    closePlayerModal();
    setTimeout(() => openModal(squadBtn.dataset.country), 180);
    return;
  }
  if (!e.target.closest('.modal-panel')) closePlayerModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePlayerModal(); closeModal(); } });

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
