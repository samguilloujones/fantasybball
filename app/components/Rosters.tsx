"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Users, PlusCircle, Search, XCircle, Pencil, Save, X } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

interface RosterSlot {
  id: string;
  team_id: string;
  player_id: number | null;
  season: string;
  slot_number: number;
  added_at: string | null;
}

interface Player {
  id: number;
  full_name: string;
  team: string;
  position?: string | null;
}

export default function Rosters() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [rosters, setRosters] = useState<RosterSlot[]>([]);
  const [players, setPlayers] = useState<Record<number, Player>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [season] = useState("2025-2026");
  const [rosteredPlayers, setRosteredPlayers] = useState<Set<number>>(new Set());

  // 🆕 Edit team name state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // ✅ Load teams + rosters + players
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const teamsRes = await fetch(`/api/supabase-proxy?path=teams?select=id,name&order=name`);
        const teamData = await teamsRes.json();

        const rostersRes = await fetch(
          `/api/supabase-proxy?path=rosters?select=*&season=eq.${season}&order=slot_number`
        );
        const rosterData = await rostersRes.json();

        const playersRes = await fetch(
          `/api/supabase-proxy?path=players?select=id,full_name,team,position`
        );
        const playerData = await playersRes.json();

        setTeams(teamData || []);
        setRosters(rosterData || []);

        const playerMap = (playerData || []).reduce((acc: Record<number, Player>, p: Player) => {
          acc[p.id] = p;
          return acc;
        }, {});
        setPlayers(playerMap);

        const rosteredIds = new Set(
          (rosterData || [])
            .filter((r: any) => r.player_id !== null)
            .map((r: any) => r.player_id as number)
        );
        setRosteredPlayers(rosteredIds);
      } catch (err) {
        console.error("Error loading rosters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [season]);

  // 🔍 Search players
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(
      `/api/supabase-proxy?path=players?select=id,full_name,team,position&ilike=full_name.%25${query}%25&limit=10`
    );
    const data = await res.json();
    setSearchResults(data || []);
  };

  // ➕ Add player
  const handleAddPlayer = async (rosterId: string, player: Player) => {
    try {
      if (rosteredPlayers.has(player.id)) {
        toast({
          title: "Player already rostered",
          description: "That player is already on another team this season.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(`/api/supabase-proxy?path=rosters`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: player.id,
          added_at: new Date().toISOString(),
          id: rosterId,
        }),
      });

      if (!res.ok) throw new Error("Failed to update roster");

      setRosters((prev) =>
        prev.map((slot) =>
          slot.id === rosterId
            ? { ...slot, player_id: player.id, added_at: new Date().toISOString() }
            : slot
        )
      );
      setPlayers((prev) => ({ ...prev, [player.id]: player }));
      setRosteredPlayers((prev) => new Set([...prev, player.id]));
      setSelectedRosterId(null);
      setSearchQuery("");
      setSearchResults([]);

      toast({
        title: "Player Added",
        description: `${player.full_name} has been added to your roster.`,
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

  // ❌ Remove player
  const handleRemovePlayer = async (rosterId: string) => {
    const slot = rosters.find((r) => r.id === rosterId);
    if (!slot || !slot.player_id) return;

    const res = await fetch(`/api/supabase-proxy?path=rosters`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: null,
        id: rosterId,
      }),
    });

    if (!res.ok) {
      toast({
        title: "Error removing player",
        description: "Could not remove player from roster.",
        variant: "destructive",
      });
      return;
    }

    setRosters((prev) =>
      prev.map((r) => (r.id === rosterId ? { ...r, player_id: null } : r))
    );
    setRosteredPlayers((prev) => {
      const updated = new Set(prev);
      updated.delete(slot.player_id!);
      return updated;
    });

    toast({
      title: "Player Removed",
      description: "The player has been removed from your roster.",
    });
  };

  // 🆕 Save team name change
  const handleSaveTeamName = async (teamId: string) => {
    setSavingName(true);
    try {
      const res = await fetch(`/api/supabase-proxy?path=teams?id=eq.${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName }),
      });
      if (!res.ok) throw new Error("Failed to update team name");

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
            Team Rosters – {season} Season
          </CardTitle>
          <p className="text-sm text-gray-600">Select players from the active NBA roster.</p>
        </CardHeader>
      </Card>

      {teams.map((team) => {
        const teamSlots = rosters.filter((r) => r.team_id === team.id);
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
                    <Button size="sm" variant="outline" onClick={() => setEditingTeamId(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-lg text-green-700">{team.name}</CardTitle>
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
                  const player = slot.player_id ? players[slot.player_id] : null;
                  return (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-3 text-center transition ${
                        slot.slot_number === 9
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200"
                      }`}
                    >
                      {player ? (
                        <>
                          <p className="font-semibold text-gray-800">{player.full_name}</p>
                          <p className="text-xs text-gray-500">{player.team}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Added {new Date(slot.added_at || "").toLocaleDateString()}
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
                          <p className="text-gray-500 text-sm">Empty Slot</p>
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
                      {slot.slot_number === 9 && (
                        <p className="text-xs font-medium text-yellow-700 mt-2">Injured Reserve</p>
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
                <p className="text-gray-500 text-sm text-center py-4">No players found.</p>
              ) : (
                searchResults.map((player) => {
                  const isRostered = rosteredPlayers.has(player.id);
                  return (
                    <div
                      key={player.id}
                      className={`p-2 rounded-md flex justify-between items-center ${
                        isRostered
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "hover:bg-green-50 cursor-pointer"
                      }`}
                      onClick={() => !isRostered && handleAddPlayer(selectedRosterId!, player)}
                    >
                      <div>
                        <p className="font-medium">{player.full_name}</p>
                        <p className="text-xs">{player.team}</p>
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
