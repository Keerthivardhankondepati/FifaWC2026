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

const SCHEDULE = [
  {
    group: 'A', teams: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
    matches: [
      { md: 1, home: 'Mexico',       away: 'South Africa',          date: 'Jun 11', venue: 'SoFi Stadium, LA' },
      { md: 1, home: 'South Korea',  away: 'Czechia',               date: 'Jun 12', venue: 'MetLife, NY' },
      { md: 2, home: 'Mexico',       away: 'South Korea',           date: 'Jun 15', venue: 'AT&T Stadium, Dallas' },
      { md: 2, home: 'South Africa', away: 'Czechia',               date: 'Jun 15', venue: "Levi's Stadium, SF" },
      { md: 3, home: 'Mexico',       away: 'Czechia',               date: 'Jun 19', venue: 'Rose Bowl, LA' },
      { md: 3, home: 'South Korea',  away: 'South Africa',          date: 'Jun 19', venue: 'Gillette Stadium, Boston' },
    ],
  },
  {
    group: 'B', teams: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
    matches: [
      { md: 1, home: 'Canada',                 away: 'Bosnia and Herzegovina', date: 'Jun 12', venue: 'BMO Field, Toronto' },
      { md: 1, home: 'Qatar',                  away: 'Switzerland',            date: 'Jun 12', venue: 'BC Place, Vancouver' },
      { md: 2, home: 'Canada',                 away: 'Qatar',                  date: 'Jun 16', venue: 'Estadio Azteca, Mexico City' },
      { md: 2, home: 'Bosnia and Herzegovina', away: 'Switzerland',            date: 'Jun 16', venue: 'BMO Field, Toronto' },
      { md: 3, home: 'Canada',                 away: 'Switzerland',            date: 'Jun 20', venue: 'BC Place, Vancouver' },
      { md: 3, home: 'Bosnia and Herzegovina', away: 'Qatar',                  date: 'Jun 20', venue: 'Estadio Akron, Guadalajara' },
    ],
  },
  {
    group: 'C', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
    matches: [
      { md: 1, home: 'Brazil',  away: 'Morocco',  date: 'Jun 13', venue: 'AT&T Stadium, Dallas' },
      { md: 1, home: 'Haiti',   away: 'Scotland', date: 'Jun 13', venue: "Levi's Stadium, SF" },
      { md: 2, home: 'Brazil',  away: 'Haiti',    date: 'Jun 17', venue: 'MetLife, NY' },
      { md: 2, home: 'Morocco', away: 'Scotland', date: 'Jun 17', venue: 'Rose Bowl, LA' },
      { md: 3, home: 'Brazil',  away: 'Scotland', date: 'Jun 21', venue: 'SoFi Stadium, LA' },
      { md: 3, home: 'Morocco', away: 'Haiti',    date: 'Jun 21', venue: 'AT&T Stadium, Dallas' },
    ],
  },
  {
    group: 'D', teams: ['United States', 'Paraguay', 'Australia', 'Türkiye'],
    matches: [
      { md: 1, home: 'United States', away: 'Paraguay',  date: 'Jun 12', venue: 'SoFi Stadium, LA' },
      { md: 1, home: 'Australia',     away: 'Türkiye',   date: 'Jun 13', venue: 'MetLife, NY' },
      { md: 2, home: 'United States', away: 'Australia', date: 'Jun 16', venue: "Levi's Stadium, SF" },
      { md: 2, home: 'Paraguay',      away: 'Türkiye',   date: 'Jun 17', venue: 'Rose Bowl, LA' },
      { md: 3, home: 'United States', away: 'Türkiye',   date: 'Jun 20', venue: 'AT&T Stadium, Dallas' },
      { md: 3, home: 'Paraguay',      away: 'Australia', date: 'Jun 20', venue: 'Gillette Stadium, Boston' },
    ],
  },
  {
    group: 'E', teams: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
    matches: [
      { md: 1, home: 'Germany',     away: 'Ecuador',     date: 'Jun 14', venue: 'MetLife, NY' },
      { md: 1, home: 'Ivory Coast', away: 'Curaçao',     date: 'Jun 14', venue: 'Rose Bowl, LA' },
      { md: 2, home: 'Germany',     away: 'Ivory Coast', date: 'Jun 18', venue: 'AT&T Stadium, Dallas' },
      { md: 2, home: 'Ecuador',     away: 'Curaçao',     date: 'Jun 18', venue: "Levi's Stadium, SF" },
      { md: 3, home: 'Germany',     away: 'Curaçao',     date: 'Jun 22', venue: 'SoFi Stadium, LA' },
      { md: 3, home: 'Ecuador',     away: 'Ivory Coast', date: 'Jun 22', venue: 'MetLife, NY' },
    ],
  },
  {
    group: 'F', teams: ['Netherlands', 'Sweden', 'Japan', 'Tunisia'],
    matches: [
      { md: 1, home: 'Netherlands', away: 'Sweden',      date: 'Jun 14', venue: 'Rose Bowl, LA' },
      { md: 1, home: 'Japan',       away: 'Tunisia',     date: 'Jun 15', venue: 'Gillette Stadium, Boston' },
      { md: 2, home: 'Netherlands', away: 'Japan',       date: 'Jun 18', venue: 'MetLife, NY' },
      { md: 2, home: 'Sweden',      away: 'Tunisia',     date: 'Jun 19', venue: 'AT&T Stadium, Dallas' },
      { md: 3, home: 'Netherlands', away: 'Tunisia',     date: 'Jun 22', venue: 'BC Place, Vancouver' },
      { md: 3, home: 'Sweden',      away: 'Japan',       date: 'Jun 22', venue: "Levi's Stadium, SF" },
    ],
  },
  {
    group: 'G', teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
    matches: [
      { md: 1, home: 'Belgium', away: 'Egypt',       date: 'Jun 15', venue: 'SoFi Stadium, LA' },
      { md: 1, home: 'Iran',    away: 'New Zealand', date: 'Jun 15', venue: 'Rose Bowl, LA' },
      { md: 2, home: 'Belgium', away: 'Iran',        date: 'Jun 19', venue: 'MetLife, NY' },
      { md: 2, home: 'Egypt',   away: 'New Zealand', date: 'Jun 19', venue: 'Gillette Stadium, Boston' },
      { md: 3, home: 'Belgium', away: 'New Zealand', date: 'Jun 23', venue: 'AT&T Stadium, Dallas' },
      { md: 3, home: 'Egypt',   away: 'Iran',        date: 'Jun 23', venue: "Levi's Stadium, SF" },
    ],
  },
  {
    group: 'H', teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
    matches: [
      { md: 1, home: 'Spain',        away: 'Cape Verde',   date: 'Jun 15', venue: 'MetLife, NY' },
      { md: 1, home: 'Saudi Arabia', away: 'Uruguay',      date: 'Jun 16', venue: 'Rose Bowl, LA' },
      { md: 2, home: 'Spain',        away: 'Saudi Arabia', date: 'Jun 19', venue: 'SoFi Stadium, LA' },
      { md: 2, home: 'Cape Verde',   away: 'Uruguay',      date: 'Jun 20', venue: 'Gillette Stadium, Boston' },
      { md: 3, home: 'Spain',        away: 'Uruguay',      date: 'Jun 23', venue: 'AT&T Stadium, Dallas' },
      { md: 3, home: 'Cape Verde',   away: 'Saudi Arabia', date: 'Jun 23', venue: 'MetLife, NY' },
    ],
  },
  {
    group: 'I', teams: ['France', 'Senegal', 'Norway', 'Iraq'],
    matches: [
      { md: 1, home: 'France',  away: 'Senegal', date: 'Jun 16', venue: 'AT&T Stadium, Dallas' },
      { md: 1, home: 'Norway',  away: 'Iraq',    date: 'Jun 16', venue: "Levi's Stadium, SF" },
      { md: 2, home: 'France',  away: 'Norway',  date: 'Jun 20', venue: 'Rose Bowl, LA' },
      { md: 2, home: 'Senegal', away: 'Iraq',    date: 'Jun 20', venue: 'SoFi Stadium, LA' },
      { md: 3, home: 'France',  away: 'Iraq',    date: 'Jun 24', venue: 'MetLife, NY' },
      { md: 3, home: 'Senegal', away: 'Norway',  date: 'Jun 24', venue: 'Gillette Stadium, Boston' },
    ],
  },
  {
    group: 'J', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
    matches: [
      { md: 1, home: 'Argentina', away: 'Algeria', date: 'Jun 17', venue: 'AT&T Stadium, Dallas' },
      { md: 1, home: 'Austria',   away: 'Jordan',  date: 'Jun 17', venue: 'Gillette Stadium, Boston' },
      { md: 2, home: 'Argentina', away: 'Austria', date: 'Jun 21', venue: 'MetLife, NY' },
      { md: 2, home: 'Algeria',   away: 'Jordan',  date: 'Jun 21', venue: 'Rose Bowl, LA' },
      { md: 3, home: 'Argentina', away: 'Jordan',  date: 'Jun 24', venue: 'SoFi Stadium, LA' },
      { md: 3, home: 'Algeria',   away: 'Austria', date: 'Jun 24', venue: "Levi's Stadium, SF" },
    ],
  },
  {
    group: 'K', teams: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
    matches: [
      { md: 1, home: 'Portugal',   away: 'DR Congo',   date: 'Jun 17', venue: 'Rose Bowl, LA' },
      { md: 1, home: 'Uzbekistan', away: 'Colombia',   date: 'Jun 18', venue: 'SoFi Stadium, LA' },
      { md: 2, home: 'Portugal',   away: 'Uzbekistan', date: 'Jun 21', venue: 'AT&T Stadium, Dallas' },
      { md: 2, home: 'DR Congo',   away: 'Colombia',   date: 'Jun 22', venue: 'Gillette Stadium, Boston' },
      { md: 3, home: 'Portugal',   away: 'Colombia',   date: 'Jun 25', venue: 'MetLife, NY' },
      { md: 3, home: 'DR Congo',   away: 'Uzbekistan', date: 'Jun 25', venue: 'BC Place, Vancouver' },
    ],
  },
  {
    group: 'L', teams: ['England', 'Croatia', 'Ghana', 'Panama'],
    matches: [
      { md: 1, home: 'England', away: 'Croatia', date: 'Jun 18', venue: 'Rose Bowl, LA' },
      { md: 1, home: 'Ghana',   away: 'Panama',  date: 'Jun 18', venue: 'AT&T Stadium, Dallas' },
      { md: 2, home: 'England', away: 'Ghana',   date: 'Jun 22', venue: 'SoFi Stadium, LA' },
      { md: 2, home: 'Croatia', away: 'Panama',  date: 'Jun 22', venue: 'MetLife, NY' },
      { md: 3, home: 'England', away: 'Panama',  date: 'Jun 25', venue: 'Gillette Stadium, Boston' },
      { md: 3, home: 'Croatia', away: 'Ghana',   date: 'Jun 25', venue: "Levi's Stadium, SF" },
    ],
  },
];

// ─── Knockout Schedule ────────────────────────────────────────────────────────

const KNOCKOUT = [
  {
    round: 'Round of 32', dateRange: 'Jun 28 – Jul 3',
    matches: [
      { id: 73,  date: 'Jun 28', home: 'Runner-up Group A', away: 'Runner-up Group B',    venue: 'SoFi Stadium, LA' },
      { id: 74,  date: 'Jun 29', home: 'Winner Group E',    away: 'Best 3rd (A/B/C/D/F)', venue: 'Gillette Stadium, Boston' },
      { id: 75,  date: 'Jun 29', home: 'Winner Group F',    away: 'Runner-up Group C',    venue: 'Estadio BBVA, Monterrey' },
      { id: 76,  date: 'Jun 29', home: 'Winner Group C',    away: 'Runner-up Group F',    venue: 'NRG Stadium, Houston' },
      { id: 77,  date: 'Jun 30', home: 'Winner Group I',    away: 'Best 3rd (C/D/F/G/H)', venue: 'MetLife Stadium, NY' },
      { id: 78,  date: 'Jun 30', home: 'Runner-up Group E', away: 'Runner-up Group I',    venue: 'AT&T Stadium, Dallas' },
      { id: 79,  date: 'Jun 30', home: 'Winner Group A',    away: 'Best 3rd (C/E/F/H/I)', venue: 'Estadio Azteca, Mexico City' },
      { id: 80,  date: 'Jul 1',  home: 'Winner Group L',    away: 'Best 3rd (E/H/I/J/K)', venue: 'Mercedes-Benz Stadium, Atlanta' },
      { id: 81,  date: 'Jul 1',  home: 'Winner Group D',    away: 'Best 3rd (B/E/F/I/J)', venue: "Levi's Stadium, SF" },
      { id: 82,  date: 'Jul 1',  home: 'Winner Group G',    away: 'Best 3rd (A/E/H/I/J)', venue: 'Lumen Field, Seattle' },
      { id: 83,  date: 'Jul 2',  home: 'Runner-up Group K', away: 'Runner-up Group L',    venue: 'BMO Field, Toronto' },
      { id: 84,  date: 'Jul 2',  home: 'Winner Group H',    away: 'Runner-up Group J',    venue: 'SoFi Stadium, LA' },
      { id: 85,  date: 'Jul 2',  home: 'Winner Group B',    away: 'Best 3rd (E/F/G/I/J)', venue: 'BC Place, Vancouver' },
      { id: 86,  date: 'Jul 3',  home: 'Winner Group J',    away: 'Runner-up Group H',    venue: 'Hard Rock Stadium, Miami' },
      { id: 87,  date: 'Jul 3',  home: 'Winner Group K',    away: 'Best 3rd (D/E/I/J/L)', venue: 'Arrowhead Stadium, Kansas City' },
      { id: 88,  date: 'Jul 3',  home: 'Runner-up Group D', away: 'Runner-up Group G',    venue: 'AT&T Stadium, Dallas' },
    ],
  },
  {
    round: 'Round of 16', dateRange: 'Jul 4 – 7',
    matches: [
      { id: 89,  date: 'Jul 4', home: 'Winner Match 74', away: 'Winner Match 77', venue: 'Lincoln Financial Field, Philadelphia' },
      { id: 90,  date: 'Jul 4', home: 'Winner Match 73', away: 'Winner Match 75', venue: 'NRG Stadium, Houston' },
      { id: 91,  date: 'Jul 5', home: 'Winner Match 76', away: 'Winner Match 78', venue: 'MetLife Stadium, NY' },
      { id: 92,  date: 'Jul 5', home: 'Winner Match 79', away: 'Winner Match 80', venue: 'Estadio Azteca, Mexico City' },
      { id: 93,  date: 'Jul 6', home: 'Winner Match 83', away: 'Winner Match 84', venue: 'AT&T Stadium, Dallas' },
      { id: 94,  date: 'Jul 6', home: 'Winner Match 81', away: 'Winner Match 82', venue: 'Lumen Field, Seattle' },
      { id: 95,  date: 'Jul 7', home: 'Winner Match 86', away: 'Winner Match 88', venue: 'Mercedes-Benz Stadium, Atlanta' },
      { id: 96,  date: 'Jul 7', home: 'Winner Match 85', away: 'Winner Match 87', venue: 'BC Place, Vancouver' },
    ],
  },
  {
    round: 'Quarterfinals', dateRange: 'Jul 9 – 11',
    matches: [
      { id: 97,  date: 'Jul 9',  home: 'Winner Match 89', away: 'Winner Match 90', venue: 'Gillette Stadium, Boston' },
      { id: 98,  date: 'Jul 10', home: 'Winner Match 93', away: 'Winner Match 94', venue: 'SoFi Stadium, LA' },
      { id: 99,  date: 'Jul 11', home: 'Winner Match 91', away: 'Winner Match 92', venue: 'Hard Rock Stadium, Miami' },
      { id: 100, date: 'Jul 11', home: 'Winner Match 95', away: 'Winner Match 96', venue: 'Arrowhead Stadium, Kansas City' },
    ],
  },
  {
    round: 'Semifinals', dateRange: 'Jul 14 – 15',
    matches: [
      { id: 101, date: 'Jul 14', home: 'Winner Match 97',  away: 'Winner Match 98',  venue: 'AT&T Stadium, Dallas' },
      { id: 102, date: 'Jul 15', home: 'Winner Match 99',  away: 'Winner Match 100', venue: 'Mercedes-Benz Stadium, Atlanta' },
    ],
  },
  {
    round: 'Third-Place Play-off', dateRange: 'Jul 18',
    matches: [
      { id: 103, date: 'Jul 18', home: 'Loser Match 101', away: 'Loser Match 102', venue: 'Hard Rock Stadium, Miami' },
    ],
  },
  {
    round: '⭐ Final', dateRange: 'Jul 19',
    matches: [
      { id: 104, date: 'Jul 19', home: 'Winner Match 101', away: 'Winner Match 102', venue: 'MetLife Stadium, NJ' },
    ],
  },
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
  const mkTeam = (name) => {
    const iso = COUNTRY_ISO[name];
    const flag = iso ? `<span class="fi fi-${iso}"></span>` : '';
    const team = TEAMS.find(t => t.country === name);
    return team
      ? `<span class="fixture-team team-link" data-country="${esc(name)}">${flag} ${esc(name)}</span>`
      : `<span class="fixture-team">${flag} ${esc(name)}</span>`;
  };
  return `<div class="fixture-row">${mkTeam(a)}<span class="fixture-vs">vs</span>${mkTeam(b)}</div>`;
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

    const gpFlag = (country) => {
      const iso = COUNTRY_ISO[country];
      return iso ? `<span class="fi fi-${iso}" style="font-size:0.85rem;border-radius:2px;vertical-align:middle;margin-right:3px"></span>` : '';
    };

    const callouts = `
      <div class="gp-callouts">
        ${g.favorite ? `
          <div class="callout">
            <span class="callout-icon">⭐</span>
            <div>
              <strong>Favourite</strong>
              <span>${gpFlag(g.favorite.country)}${esc(g.favorite.country)}</span>
              <p>${esc(g.favorite.reason)}</p>
            </div>
          </div>` : ''}
        ${g.dark_horse ? `
          <div class="callout">
            <span class="callout-icon">🐴</span>
            <div>
              <strong>Dark Horse</strong>
              <span>${gpFlag(g.dark_horse.country)}${esc(g.dark_horse.country)}</span>
              <p>${esc(g.dark_horse.reason)}</p>
            </div>
          </div>` : ''}
      </div>
    `;

    const fixtureHtml = topFixture ? `
      <p class="gp-section-title">Top Fixture</p>
      <div class="top-fixture">
        ${fixtureMatchHtml(topFixture.match)}
        <div class="fixture-story">${esc(topFixture.story)}</div>
        <div class="fixture-spice">${spiceEmoji(topFixture.spice_level)} ${topFixture.spice_level}/10</div>
      </div>
    ` : '';

    const tableRows = (g.projected_table || []).map(row => {
      const cls = row.status.toLowerCase().includes('likely') ? 'qualified'
        : row.status.toLowerCase().includes('third') ? 'third' : 'underdog';
      return `<tr>
        <td class="pt-pos">${row.position}</td>
        <td class="pt-country">${gpFlag(row.country)}${esc(row.country)}</td>
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

    const teamsWithFlags = (g.teams || []).map(t => {
      const iso = COUNTRY_ISO[t];
      return iso ? `<span class="fi fi-${iso}" style="font-size:0.85rem;border-radius:2px;vertical-align:middle"></span> ${esc(t)}` : esc(t);
    }).join(' <span class="gp-sep">·</span> ');

    return `
      <div class="group-preview-card">
        <button class="group-preview-header" aria-expanded="false">
          <span class="gp-label">${esc(g.group)}</span>
          <span class="gp-teams">${teamsWithFlags}</span>
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

// ─── Schedule View ────────────────────────────────────────────────────────────

function renderScheduleView() {
  const container = document.getElementById('schedule-grid');
  if (!container) return;

  // ── Group Stage ───────────────────────────────────────────────────────────────
  const groupStageHtml = SCHEDULE.map((g, idx) => {
    const byMd = { 1: [], 2: [], 3: [] };
    g.matches.forEach(m => byMd[m.md].push(m));

    const flagsHtml = g.teams.map(t => {
      const iso = COUNTRY_ISO[t];
      return iso ? `<span class="fi fi-${iso}" style="font-size:0.9rem;border-radius:2px"></span>` : '';
    }).join(' ');

    const matchdaysHtml = [1, 2, 3].map(md =>
      `<div class="matchday-block">
        <div class="matchday-label">Matchday ${md}</div>
        ${byMd[md].map(m => {
          const isoH = COUNTRY_ISO[m.home] || '';
          const isoA = COUNTRY_ISO[m.away] || '';
          return `
          <div class="match-row">
            <span class="match-team team-link" data-country="${esc(m.home)}">
              ${isoH ? `<span class="fi fi-${isoH}"></span>` : ''} ${esc(m.home)}
            </span>
            <span class="match-vs">vs</span>
            <span class="match-team team-link" data-country="${esc(m.away)}">
              ${isoA ? `<span class="fi fi-${isoA}"></span>` : ''} ${esc(m.away)}
            </span>
            <span class="match-info">${esc(m.date)} · ${esc(m.venue)}</span>
          </div>`;
        }).join('')}
      </div>`
    ).join('');

    const isFirst = idx === 0;
    return `
      <div class="group-preview-card">
        <button class="group-preview-header schedule-header" aria-expanded="${isFirst}">
          <span class="gp-label">Group ${esc(g.group)}</span>
          <span class="gp-teams">${flagsHtml}</span>
          <span class="gp-toggle" aria-hidden="true">${isFirst ? '▲' : '▼'}</span>
        </button>
        <div class="schedule-body"${isFirst ? '' : ' hidden'}>
          ${matchdaysHtml}
        </div>
      </div>`;
  }).join('');

  // ── Knockout Stage ────────────────────────────────────────────────────────────
  const knockoutStageHtml = KNOCKOUT.map(r => {
    const isFinal = r.round.includes('Final') && !r.round.includes('Third');
    const matchesHtml = r.matches.map(m =>
      `<div class="match-row${isFinal ? ' ko-final-row' : ''}">
        <span class="ko-match-num">M${m.id}</span>
        <span class="match-team ko-team">${esc(m.home)}</span>
        <span class="match-vs">vs</span>
        <span class="match-team ko-team">${esc(m.away)}</span>
        <span class="match-info">${esc(m.date)} · ${esc(m.venue)}</span>
      </div>`
    ).join('');

    return `
      <div class="group-preview-card${isFinal ? ' ko-final-card' : ''}">
        <button class="group-preview-header schedule-header" aria-expanded="false">
          <span class="gp-label">${esc(r.round)}</span>
          <span class="ko-date-range">${esc(r.dateRange)}</span>
          <span class="gp-toggle" aria-hidden="true">▼</span>
        </button>
        <div class="schedule-body" hidden>
          ${matchesHtml}
        </div>
      </div>`;
  }).join('');

  container.innerHTML =
    groupStageHtml +
    `<div class="schedule-stage-divider">Knockout Stage</div>` +
    knockoutStageHtml;

  container.querySelectorAll('.schedule-header').forEach(btn => {
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
renderScheduleView();
renderGlossary();
renderPlayersSection();
renderMomentsSection();
initCountdown();

// View toggle
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.getElementById('view-previews').style.display = view === 'previews' ? 'block' : 'none';
    document.getElementById('view-schedule').style.display = view === 'schedule'  ? 'block' : 'none';
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
// Team card clicks — event delegation on the grid
document.getElementById('teams-grid').addEventListener('click', e => {
  const card = e.target.closest('.team-card[data-country]');
  if (card) openModal(card.dataset.country);
});

// Team-link clicks in group previews (fixture rows + projected table)
document.getElementById('groups-grid').addEventListener('click', e => {
  const link = e.target.closest('.team-link[data-country]');
  if (link) openModal(link.dataset.country);
});

// Team-link clicks in schedule view
document.getElementById('schedule-grid').addEventListener('click', e => {
  const link = e.target.closest('.match-team.team-link[data-country]');
  if (link) openModal(link.dataset.country);
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
