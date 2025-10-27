# get_player_stats.py
import sys
import json
from nba_api.stats.endpoints import playercareerstats
from nba_api.stats.static import players

def main():
    args = json.loads(sys.argv[1])
    player_name = args.get("player_name")

    player_dict = players.find_players_by_full_name(player_name)
    if not player_dict:
        print(json.dumps({"error": "Player not found"}))
        return

    player_id = player_dict[0]["id"]
    career = playercareerstats.PlayerCareerStats(player_id=player_id)
    data = career.get_dict()

    print(json.dumps(data))  # Send JSON back to Node

if __name__ == "__main__":
    main()
