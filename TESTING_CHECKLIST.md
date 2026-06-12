# kickoff26 Testing Checklist

## Before every merge to main — verify ALL of these:

### Hero Carousel
- [ ] Exactly 3 cards showing (prev, center, next)
- [ ] Center card has gold border glow
- [ ] Prev/next cards dimmed correctly
- [ ] Swipe works on mobile
- [ ] Auto-centers on live card on load

### Live Match — center card
- [ ] 🔴 LIVE badge + minute updating
- [ ] Score correct (home — away)
- [ ] ⚽ Goal on correct team side
- [ ] ⚽ (P) Penalty goal correct
- [ ] 🔴 Own goal correct
- [ ] 🟨 Yellow card correct team side
- [ ] 🟥 Red card correct team side
- [ ] 🔄 Substitution showing
- [ ] ❌ Missed penalty showing
- [ ] Assist name showing alongside goal
- [ ] Starting XI button present and expandable
- [ ] Venue at bottom
- [ ] No flash/glitch on score update
- [ ] No scroll jump during live updates

### Completed Match — prev card
- [ ] FT badge showing
- [ ] Score correct
- [ ] Lineups & Events → link redirects to Schedule > Completed
- [ ] Venue at bottom

### Upcoming Match — next card
- [ ] Kickoff time ET showing
- [ ] vs showing (no score)
- [ ] Venue at bottom

### Match Schedule Section
- [ ] Completed matches show Match Events ▾ button
- [ ] Completed matches show Starting XI ▾ button
- [ ] Venue at bottom of card
- [ ] Team names clickable → opens team modal
- [ ] All filter tabs work (All, Today, Upcoming, Completed)

### Team Modal
- [ ] Flag renders correctly on desktop (not emoji)
- [ ] Flag renders correctly on mobile
- [ ] Key players showing
- [ ] Tactical shape showing

### Mobile Specific
- [ ] Cards not clipped on edges
- [ ] CTA buttons full width
- [ ] Score visible on cards
- [ ] Events visible on center card
- [ ] No scroll jump during live updates
- [ ] Lineups visible when expanded

### Worker / API Health
- [ ] /health returns {"status":"ok"}
- [ ] /scoreboard?dates=TODAY returns match data
- [ ] /summary?event=ID returns data for live match
- [ ] /standings returns group table data

### Standings
- [ ] All 12 groups showing
- [ ] Points correct after match
- [ ] GitHub Actions standings job passes after FT

### Standings Update (GitHub Actions)
- [ ] Standings job runs at kickoff + 150 mins after each match
- [ ] Safety net run fires 15 mins after primary run
- [ ] standings.json updated in repo after job runs
- [ ] GitHub Actions workflow shows green ✅

### Lineups (Pre-match)
- [ ] Starting XI appears 50 mins before kickoff
- [ ] ESPN summary endpoint serves lineup data before match
- [ ] Worker caches lineup in KV successfully
- [ ] Starting XI button appears on hero center card

### Squad Auto-update (Daily)
- [ ] Daily GitHub Actions job fetches latest squads from ESPN
- [ ] squads.json updated if player changes detected
- [ ] Team modal shows current squad

## ✅ Merge to main ONLY when all boxes checked
## ❌ Never push directly to main during a live match
