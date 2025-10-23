"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerPopup from "./PlayerPopup";

export type Player = {
  id: number;
  first_name: string;
  last_name: string;
  team: string;
  fantasy_team?: string | null;
  fantasy_team_id?: number | null;
  active?: boolean;
};

interface PlayersProps {
  onNavigate: (path: string) => void;
  onAddPlayer?: (player: Player) => void;
}

export default function Players({ onNavigate, onAddPlayer }: PlayersProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  console.log("✅ Players component rendered. Players:", players);

  // ✅ Load players through proxy route (avoids Supabase CORS)
  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Keep your same query, just include 'active' in the select
      const res = await fetch(
        `/api/supabase-proxy?path=players?select=id,first_name,last_name,team,fantasy_team_id,active&limit=100`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch players: ${res.statusText}`);
      }

      const data = await res.json();

      // Remove mock PPG, map real fields only
      const mappedPlayers = data.map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        team: p.team,
        fantasy_team_id: p.fantasy_team_id,
        active: p.active ?? false,
      }));

      setPlayers(mappedPlayers);
      console.log("✅ Players loaded:", mappedPlayers);
    } catch (err) {
      console.error("Error loading players:", err);
      setError(
        `Failed to fetch players: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleSearch = () => loadPlayers();
  const handleRefresh = () => {
    setSearchTerm("");
    loadPlayers();
  };

  const filteredPlayers = searchTerm
    ? players.filter((player) => {
        const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      })
    : players;

  const handlePlayerClick = (player: Player) => setSelectedPlayer(player);
  const handleClosePopup = () => setSelectedPlayer(null);

  const isRostered = (fullName: string) => false;

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          Available Players
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          <Input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 sm:pl-10 w-full text-sm sm:text-base"
          />
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="w-full sm:w-auto bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 text-sm">
          <p className="font-medium">Error loading players:</p>
          <p className="text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {loading && players.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fantasy Team
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Add
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.map((player) => {
                  const fullName = `${player.first_name} ${player.last_name}`;
                  const rostered = isRostered(fullName);

                  return (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <button
                          onClick={() => handlePlayerClick(player)}
                          className="text-left hover:text-blue-600 transition-colors"
                        >
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <span className="font-medium text-gray-900 text-xs sm:text-sm">
                              {fullName}
                            </span>
                            {rostered && (
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">
                        {player.team || "—"}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                        {player.active ? (
                          <span className="text-green-600 font-semibold">Active</span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        {player.fantasy_team ? (
                          <span className="text-xs sm:text-sm text-gray-900 font-medium">
                            {player.fantasy_team}
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">
                            Free Agent
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        {!rostered && onAddPlayer && (
                          <Button
                            size="sm"
                            onClick={() => onAddPlayer(player)}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-7 w-7 sm:h-8 sm:w-8 p-0"
                            title="Add to team"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedPlayer && <PlayerPopup player={selectedPlayer} onClose={handleClosePopup} />}
    </div>
  );
}
