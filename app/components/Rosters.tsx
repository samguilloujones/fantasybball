"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  PlusCircle,
  Search,
  XCircle,
  Pencil,
  Save,
  X,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
}

interface RosterSlot {
  id: string;
  team_id: string;
  player_id: string | null;
  season: string;
  slot_number: number;
  added_at: string | null;
}

interface Player {
  id: string;
  full_name: string;
  team: string | null;
  position?: string | null;
  active?: boolean | null;
}

const SEASON = "2025-2026";
const TOTAL_SLOTS = 10; // 1..8 active, 9..10 IR

export default function Rosters() {
  const { toast } = useToast();

  // data
  const [teams, setTeams] = useState<Team[]>([]);
  const [rosters, setRosters] = useState<RosterSlot[]>([]);
  const [playersById, setPlayersById] = useState<Record<string, Player>>({});
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [rosteredPlayers, setRosteredPlayers] = useState<Set<string>>(new Set());
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // ---------- initial load ----------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // fetch teams, rosters, players
        const [teamsRes, rostersRes, playersRes] = await Promise.all([
          fetch(`/api/supabase-proxy?path=teams?select=id,name&order=name`),
          fetch(
            `/api/supabase-proxy?path=rosters?select=*&season=eq.${SEASON}&order=slot_number`
          ),
          // pull a larger set once; we’ll filter locally like Players page
          fetch(
            `/api/supabase-proxy?path=players?select=id,full_name,team,position,active&order=full_name.asc&limit=10000`
          ),
        ]);

        const [teamsJson, rostersJson, playersJson] = await Promise.all([
          teamsRes.json(),
          rostersRes.json(),
          playersRes.json(),
        ]);

        const teamData: Team[] = Array.isArray(teamsJson.data) ? teamsJson.data : [];
        const rosterData: RosterSlot[] = Array.isArray(rostersJson.data)
          ? rostersJson.data
          : [];
        const playerData: Player[] = Array.isArray(playersJson.data)
          ? playersJson.data
          : [];

        setTeams(teamData);
        setRosters(rosterData);

        const byId = playerData.reduce((acc: Record<string, Player>, p) => {
          if (p.id) acc[String(p.id)] = p;
          return acc;
        }, {});
        setPlayersById(byId);
        setAllPlayers(playerData);

        const rosteredIds = new Set(
          rosterData.filter((r) => r.player_id).map((r) => String(r.player_id))
        );
        setRosteredPlayers(rosteredIds);

        // ensure each team has 10 slots (1..10)
        await ensureAllTeamSlots(teamData, rosterData);
      } catch (err) {
        console.error("Error loading rosters:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ---------- ensure slots for all teams ----------
  const ensureAllTeamSlots = async (teamData: Team[], rosterData: RosterSlot[]) => {
    // determine missing for each team
    const inserts: Array<{ team_id: string; season: string; slot_number: number }> = [];

    for (const t of teamData) {
      const teamSlots = rosterData.filter((r) => r.team_id === t.id);
      const have = new Set(teamSlots.map((r) => r.slot_number));
      for (let slot = 1; slot <= TOTAL_SLOTS; slot++) {
        if (!have.has(slot)) {
          inserts.push({ team_id: t.id, season: SEASON, slot_number: slot });
        }
      }
    }

    if (!inserts.length) return;

    // bulk insert missing rows
    const res = await fetch("/api/supabase-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "rosters", action: "insert", data: inserts }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("Failed creating missing slots:", json.error || json);
      return;
    }

    // refetch rosters once to reflect inserts
    const refetch = await fetch(
      `/api/supabase-proxy?path=rosters?select=*&season=eq.${SEASON}&order=slot_number`
    );
    const refetchJson = await refetch.json();
    const refreshed: RosterSlot[] = Array.isArray(refetchJson.data) ? refetchJson.data : [];
    setRosters(refreshed);
  };

  // ---------- search (client-side match like Players page) ----------
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const q = query.trim().toLowerCase();

    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    // Same behavior as players page: simple substring anywhere in full_name.
    // Prefer active players; then sort by startsWith -> includes; then alphabetically.
    const base = allPlayers.filter((p) => (p.active ?? true) && p.full_name);

    const filtered = base.filter((p) => p.full_name!.toLowerCase().includes(q));

    const startsWithFirst = filtered.sort((a, b) => {
      const aName = a.full_name!.toLowerCase();
      const bName = b.full_name!.toLowerCase();
      const aStarts = aName.startsWith(q) ? 0 : 1;
      const bStarts = bName.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return aName.localeCompare(bName);
    });

    setSearchResults(startsWithFirst.slice(0, 25));
  };

  // ➕ Add player to a slot
  const handleAddPlayer = async (rosterId: string, player: Player) => {
    try {
      if (rosteredPlayers.has(String(player.id))) {
        toast({
          title: "Player already rostered",
          description: "That player is already on another team this season.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "rosters",
          action: "update",
          data: [
            {
              id: rosterId,
              player_id: player.id,
              added_at: new Date().toISOString(),
            },
          ],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update roster");

      setRosters((prev) =>
        prev.map((slot) =>
          slot.id === rosterId
            ? { ...slot, player_id: player.id, added_at: new Date().toISOString() }
            : slot
        )
      );
      setPlayersById((prev) => ({ ...prev, [player.id]: player }));
      setRosteredPlayers((prev) => new Set([...prev, String(player.id)]));

      // close modal
      setSelectedRosterId(null);
      setSearchQuery("");
      setSearchResults([]);

      toast({
        title: "Player Added",
        description: `${player.full_name} added to your roster.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        title: "Error",
        description: "Something went wrong while adding the player.",
        variant: "destructive",
      });
    }
  };

  // ❌ Remove player from a slot
  const handleRemovePlayer = async (rosterId: string) => {
    const slot = rosters.find((r) => r.id === rosterId);
    if (!slot || !slot.player_id) return;

    const res = await fetch("/api/supabase-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "rosters",
        action: "update",
        data: [{ id: rosterId, player_id: null }],
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast({
        title: "Error removing player",
        description: json.error || "Could not remove player from roster.",
        variant: "destructive",
      });
      return;
    }

    setRosters((prev) =>
      prev.map((r) => (r.id === rosterId ? { ...r, player_id: null } : r))
    );
    setRosteredPlayers((prev) => {
      const updated = new Set(prev);
      updated.delete(String(slot.player_id));
      return updated;
    });

    toast({ title: "Player Removed", description: "Removed from your roster." });
  };

  // 💾 Update team name
  const handleSaveTeamName = async (teamId: string) => {
    setSavingName(true);
    try {
      const res = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "teams",
          action: "update",
          data: [{ id: teamId, name: editedName }],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update team name");

      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, name: editedName } : t))
      );
      toast({ title: "Team name updated ✅", variant: "success" });
      setEditingTeamId(null);
      setEditedName("");
    } catch (err) {
      toast({ title: "Error updating team", variant: "destructive" });
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  // ---------- loading UI ----------
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(9)].map((_, j) => (
                  <Skeleton key={j} className="h-10" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Team Rosters – {SEASON} Season
          </CardTitle>
          <p className="text-sm text-gray-600">
            8 Active + 2 Injured Reserve roster spots per team.
          </p>
        </CardHeader>
      </Card>

      {teams.map((team) => {
        const teamSlots = rosters
          .filter((r) => r.team_id === team.id)
          .sort((a, b) => a.slot_number - b.slot_number);

        return (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {editingTeamId === team.id ? (
                  <>
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-48"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveTeamName(team.id)}
                      disabled={savingName || !editedName.trim()}
                    >
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTeamId(null)}
                    >
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-lg text-green-700">
                      {team.name}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTeamId(team.id);
                        setEditedName(team.name);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {teamSlots.map((slot) => {
                  const player = slot.player_id ? playersById[String(slot.player_id)] : null;
                  const isIR = slot.slot_number >= 9;
                  return (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-3 text-center transition ${
                        isIR ? "border-yellow-400 bg-yellow-50" : "border-gray-200"
                      }`}
                    >
                      {player ? (
                        <>
                          <p className="font-semibold text-gray-800">
                            {player.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {player.team ?? "—"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Added{" "}
                            {new Date(slot.added_at || "").toLocaleDateString()}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 mt-2"
                            onClick={() => handleRemovePlayer(slot.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-500 text-sm">
                            {isIR ? "Empty IR Slot" : "Empty Slot"}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={() => setSelectedRosterId(slot.id)}
                          >
                            <PlusCircle className="w-4 h-4 mr-1" /> Add Player
                          </Button>
                        </>
                      )}
                      {isIR && (
                        <p className="text-xs font-medium text-yellow-700 mt-2">
                          Injured Reserve
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Player Search Modal */}
      {selectedRosterId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Search className="w-4 h-4 mr-2 text-green-600" /> Search Active Players
            </h3>
            <Input
              placeholder="Enter player name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="mb-3"
            />

            <div className="max-h-64 overflow-y-auto border-t border-gray-100 pt-2">
              {searchResults.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No players found.
                </p>
              ) : (
                searchResults.map((player) => {
                  const isRostered = rosteredPlayers.has(String(player.id));
                  return (
                    <div
                      key={player.id}
                      className={`p-2 rounded-md flex justify-between items-center ${
                        isRostered
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "hover:bg-green-50 cursor-pointer"
                      }`}
                      onClick={() =>
                        !isRostered && handleAddPlayer(selectedRosterId!, player)
                      }
                    >
                      <div>
                        <p className="font-medium">{player.full_name}</p>
                        <p className="text-xs text-gray-500">{player.team ?? "—"}</p>
                      </div>
                      {isRostered && (
                        <span className="text-[10px] bg-gray-300 text-white px-2 py-0.5 rounded-md">
                          Rostered
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setSelectedRosterId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
