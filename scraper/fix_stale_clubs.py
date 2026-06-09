import json
import pathlib

# Revert Nematov who was incorrectly changed from Nasaf -> Pakhtakor
path = pathlib.Path('output/uzbekistan_stage2.json')
data = json.loads(path.read_text(encoding='utf-8'))
for player in data['squad']:
    name = player.get('full_name', '')
    if 'nematov' in name.lower() and player.get('club') == 'Pakhtakor':
        player['club'] = 'Nasaf'
        print(f'Reverted: {name}  club: Pakhtakor -> Nasaf')
path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print('Saved uzbekistan_stage2.json')
