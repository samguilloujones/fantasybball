import pandas as pd
from nba_api.stats.endpoints import PlayerCareerStats
from nba_api.stats.static import players
import sys 
import json # Import the standard json module for final wrapping

def get_player_stats_by_season_to_stdout(player_name, season_year):
    """
    Fetches a player's season stats, filters the result, and prints the 
    single-season DataFrame to standard output (stdout) as a JSON string.
    """
    
    # --- Helper function for consistent error output ---
    def print_error_json(message):
        error_result = {"status": "error", "message": message}
        # Use the standard Python json module to serialize the dictionary
        print(json.dumps(error_result))
        
    # 1. Find the Player ID
    player_info = players.find_players_by_full_name(player_name)
    
    if not player_info:
        print_error_json(f"Player '{player_name}' not found.")
        return
    
    player_id = player_info[0]['id']
    full_name = player_info[0]['full_name']

    try:
        # 2. Get the player's full career stats
        career_stats = PlayerCareerStats(player_id=player_id)
        career_df = career_stats.get_data_frames()[0]
        
        # 3. Filter the DataFrame using Pandas
        season_df = career_df[career_df['SEASON_ID'] == season_year].copy()
        
        if season_df.empty:
            # Print success with empty data
            empty_result = {"status": "success", "message": f"No stats found for {full_name} in season {season_year}.", "data": None}
            print(json.dumps(empty_result))
            return
            
        # 4. Clean up and format the output DataFrame
        season_df.insert(0, 'PLAYER_NAME', full_name)
        
        # Remove the 'player_id' field which isn't useful for the final result
        season_df = season_df.drop(columns=['PLAYER_ID'])

        # 5. CONVERT TO JSON AND PRINT TO STDOUT
        
        # Use the DataFrame's built-in to_json method.
        # orient='records' converts the DataFrame into a list of JSON objects (one per row).
        data_json_string = season_df.to_json(orient='records') 

        # Print the final result, wrapped in a status object
        final_result = {
            "status": "success",
            "message": f"Stats for {full_name} in {season_year} retrieved successfully.",
            # The data is the list of season stats records
            "data": json.loads(data_json_string) 
        }
        
        # Use the standard json module for the final print to stdout
        print(json.dumps(final_result))

    except Exception as e:
        print_error_json(f"Error fetching or processing data: {e}")

if __name__ == "__main__":
    # --- Read Inputs from Command Line Arguments ---
    
    # The command line arguments are expected at index 1 and 2
    if len(sys.argv) > 2:
        PLAYER = sys.argv[1]
        SEASON = sys.argv[2]
        get_player_stats_by_season_to_stdout(PLAYER, SEASON)