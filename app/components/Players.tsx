"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerPopup from "./PlayerPopup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import PlayerPopupV2 from "./PlayerPopupV2";

export type Player = {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  team: string | null;
  fantasy_team?: string | null;
  fantasy_team_id?: string | null;
  active?: boolean;
};

interface PlayersProps {
  onNavigate: (path: string) => void;
  onAddPlayer?: (player: Player) => void;
}

export default function Players({ onNavigate, onAddPlayer }: PlayersProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Modal states
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // ---------------------------------------------------------
  // Load Players
  // ---------------------------------------------------------
  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("blahhh")

      const res = await fetch(
        `/api/supabase-proxy?path=players`
      );

      console.log(`Yo ${JSON.stringify(res)}`)

      if (!res.ok) throw new Error(`Failed to fetch players: ${res.statusText}`);

      const json = await res.json();
      const data = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.data)
        ? json.data.data
        : [];

      const mappedPlayers = data.map((p: any) => {
        const [first_name, ...rest] = (p.full_name || "").split(" ");
        return {
          id: p.id,
          full_name: p.full_name,
          first_name,
          last_name: rest.join(" "),
          team: p.team ?? null,
          fantasy_team_id: p.fantasy_team_id ?? null,
          active: p.active ?? false,
        };
      });

      setPlayers(mappedPlayers);
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

  // ---------------------------------------------------------
  // Load Teams
  // ---------------------------------------------------------
  const loadTeams = async () => {
    try {
      const res = await fetch(`/api/supabase-proxy?path=teams?select=id,name`);
      const json = await res.json();
      const data = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.data)
        ? json.data.data
        : [];
      setTeams(data);
    } catch (err) {
      console.error("Error loading teams:", err);
    }
  };

  useEffect(() => {
    loadPlayers();
    //loadTeams();
  }, []);

  // ---------------------------------------------------------
  // Assign player to team — now uses proxy SELECT
  // ---------------------------------------------------------
  const handleAssignPlayer = async () => {
    if (!assignTarget?.id || !selectedTeamId) return;
    setAssignSubmitting(true);

    try {
      const playerId = assignTarget.id;
      const season = "2025-2026";

      // 1️⃣ Check if player already exists in roster for this season
      const checkRes = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "rosters",
          action: "select",
          data: { player_id: playerId, season },
        }),
      });

      const checkJson = await checkRes.json();
      const existingRoster =
        Array.isArray(checkJson.data) && checkJson.data.length > 0
          ? checkJson.data[0]
          : null;

      let result;

      // 2️⃣ If roster exists → update team_id, else insert new row
      if (existingRoster) {
        result = await fetch("/api/supabase-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "rosters",
            action: "update",
            data: [{ id: existingRoster.id, team_id: selectedTeamId }],
          }),
        });
      } else {
        result = await fetch("/api/supabase-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "rosters",
            action: "insert",
            data: [
              {
                player_id: playerId,
                team_id: selectedTeamId,
                season,
              },
            ],
          }),
        });
      }

      const resultJson = await result.json();
      if (!result.ok)
        throw new Error(resultJson.error || "Roster insert/update failed");

      // 3️⃣ Update player's fantasy_team_id
      const upsertRes = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "players",
          action: "update",
          data: [{ id: playerId, fantasy_team_id: selectedTeamId }],
        }),
      });
      const upsertJson = await upsertRes.json();
      if (!upsertRes.ok)
        throw new Error(upsertJson.error || "Failed to update player");

      // ✅ Done
      setAssignOpen(false);
      setAssignTarget(null);
      setSelectedTeamId("");
      await loadPlayers();
    } catch (err) {
      console.error("Error assigning player:", err);
      alert(
        `Failed to assign player: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setAssignSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------
  const handleSearch = () => loadPlayers();
  const handleRefresh = () => {
    setSearchTerm("");
    loadPlayers();
  };
  const filteredPlayers = searchTerm
    ? players.filter((p) =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : players;
  const handlePlayerClick = (player: Player) => setSelectedPlayer(player);
  const handleClosePopup = () => setSelectedPlayer(null);
  const isRostered = (fullName: string) => false;

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
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
                    Assign
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.map((player) => {
                  const rostered = isRostered(player.full_name);
                  return (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <button
                          onClick={() => handlePlayerClick(player)}
                          className="text-left hover:text-blue-600 transition-colors"
                        >
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <span className="font-medium text-gray-900 text-xs sm:text-sm">
                              {player.full_name}
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
                        {!rostered && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-7 w-7 sm:h-8 sm:w-8 p-0"
                            title="Assign to team"
                            onClick={() => {
                              setAssignTarget(player);
                              setSelectedTeamId(player.fantasy_team_id ?? "");
                              setAssignOpen(true);
                            }}
                          >
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
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

      {selectedPlayer && (
        <PlayerPopupV2 player={selectedPlayer} onClose={handleClosePopup} />
      )}

      {/* ✅ Assign-to-team Modal */}
      <Dialog open={assignOpen} onOpenChange={(o) => setAssignOpen(o)}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              Assign Player to Team
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose a fantasy team to add{" "}
              <span className="font-semibold text-gray-900">
                {assignTarget?.full_name}
              </span>{" "}
              to the 2025–2026 roster.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="team" className="text-gray-700">
                Team
              </Label>
              <Select
                value={selectedTeamId}
                onValueChange={(v) => setSelectedTeamId(v)}
              >
                <SelectTrigger
                  id="team"
                  className="bg-white border border-gray-300 text-gray-800"
                >
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>

                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md text-gray-800 max-h-48 overflow-y-auto">
                  {teams.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      className="hover:bg-gray-50 text-gray-800 cursor-pointer"
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setAssignOpen(false);
                setAssignTarget(null);
                setSelectedTeamId("");
              }}
              disabled={assignSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignPlayer}
              disabled={!selectedTeamId || assignSubmitting}
            >
              {assignSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
