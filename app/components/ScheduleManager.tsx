"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, PlusCircle, Trash2, RefreshCw } from "lucide-react";

type UUID = string;

interface Team {
  id: UUID;
  name: string;
}

interface Game {
  id: UUID;
  season_id: UUID;
  game_number: number;
  week_number: number;
  start_date: string;
  end_date: string;
  team_a_id: UUID;
  team_b_id: UUID;
  notes: string | null;
  created_at?: string;
}

interface Season {
  id: UUID;
  name: string;
}

const SEASON_NAME = "2025-2026";
const SEASON_START = new Date("2025-10-21");
const SEASON_END = new Date("2026-04-12");
const WEEK1_START = new Date("2025-10-19");
const WEEK_LENGTH = 7;

const SLOT_WINDOWS: [number, number][] = [
  [0, 1],
  [2, 4],
  [5, 6],
];

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function computeWindowForGameNumber(gameNumber: number) {
  if (gameNumber < 0 || gameNumber > 65) {
    throw new Error("Invalid game number");
  }

  const weekNumber = Math.floor(gameNumber / 3) + 1;
  const slotIndex = gameNumber % 3;
  const [startOffset, endOffset] = SLOT_WINDOWS[slotIndex] ?? SLOT_WINDOWS[1];
  const weekStart = addDays(WEEK1_START, (weekNumber - 1) * WEEK_LENGTH);
  const startDate = addDays(weekStart, startOffset);
  const endDate = addDays(weekStart, endOffset);

  return { weekNumber, startDate, endDate };
}

export default function ScheduleManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const [gameNumber, setGameNumber] = useState<number | "">("");
  const [teamA, setTeamA] = useState<UUID | "">("");
  const [teamB, setTeamB] = useState<UUID | "">("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: teamData, error: teamErr } = await supabase
          .from("teams")
          .select("id, name")
          .order("name");
        if (teamErr) throw teamErr;
        setTeams(teamData || []);

        const { data: seasonData, error: seasonErr } = await supabase
          .from("seasons")
          .select("id, name")
          .eq("name", SEASON_NAME)
          .single();
        if (seasonErr) throw seasonErr;
        setSeason(seasonData);

        const { data: gameData, error: gameErr } = await supabase
          .from("games")
          .select("*")
          .eq("season_id", seasonData.id)
          .order("game_number", { ascending: true });
        if (gameErr) throw gameErr;
        setGames(gameData || []);
      } catch (e) {
        console.error("Error loading schedule:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const teamName = (id?: UUID | null) =>
    teams.find((t) => t.id === id)?.name ?? "—";

  const gamesByWeek = useMemo(() => {
    const map = new Map<number, Game[]>();
    for (const g of games) {
      if (!map.has(g.week_number)) map.set(g.week_number, []);
      map.get(g.week_number)!.push(g);
    }
    for (const [wk, arr] of map.entries()) {
      arr.sort((a, b) => a.game_number - b.game_number);
    }
    return map;
  }, [games]);

  const existingGameNumbers = useMemo(
    () => new Set(games.map((g) => g.game_number)),
    [games]
  );

  const validate = (): string | null => {
    if (!season) return "No season found.";
    if (!gameNumber && gameNumber !== 0)
      return "Please select a game number.";
    if (!teamA || !teamB) return "Please choose two teams.";
    if (teamA === teamB) return "A team cannot play itself.";
    if (existingGameNumbers.has(Number(gameNumber)))
      return `Game ${gameNumber} already exists.`;
    return null;
  };

  const handleCreate = async () => {
    setFormError(null);
    const err = validate();
    if (err) return setFormError(err);

    setSaving(true);
    try {
      const n = Number(gameNumber);
      const { weekNumber, startDate, endDate } = computeWindowForGameNumber(n);

      const payload = {
        season_id: season!.id,
        game_number: n,
        week_number: weekNumber,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
        team_a_id: teamA as UUID,
        team_b_id: teamB as UUID,
        notes: notes || null,
      };

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert(payload)
        .select("*")
        .single();
      if (gameError) throw gameError;

      const newGameId = gameData.id;
      await supabase.from("matchups").insert([
        {
          week: weekNumber,
          team_a_id: teamA,
          team_b_id: teamB,
          game_id: newGameId,
        },
      ]);

      setGames((prev) =>
        [...prev, gameData as Game].sort((a, b) => a.game_number - b.game_number)
      );
      setGameNumber("");
      setTeamA("");
      setTeamB("");
      setNotes("");
    } catch (e: any) {
      console.error("Error creating game + matchup:", e);
      setFormError(e?.message ?? "Failed to create game.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!season || teams.length < 2) return;
    setBulkGenerating(true);

    try {
      const existing = new Set(games.map((g) => g.game_number));
      const teamPairs: [UUID, UUID][] = [];

      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          teamPairs.push([teams[i].id, teams[j].id]);
        }
      }

      for (let i = teamPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teamPairs[i], teamPairs[j]] = [teamPairs[j], teamPairs[i]];
      }

      const newGames: Game[] = [];
      let gameNum = 0;

      while (gameNum <= 65 && teamPairs.length > 0) {
        if (existing.has(gameNum)) {
          gameNum++;
          continue;
        }

        const [a, b] = teamPairs.shift()!;
        const { weekNumber, startDate, endDate } =
          computeWindowForGameNumber(gameNum);

        newGames.push({
          id: crypto.randomUUID(),
          season_id: season.id,
          game_number: gameNum,
          week_number: weekNumber,
          start_date: startDate.toISOString().slice(0, 10),
          end_date: endDate.toISOString().slice(0, 10),
          team_a_id: a,
          team_b_id: b,
          notes: null,
        });
        gameNum++;
      }

      if (newGames.length > 0) {
        await supabase.from("games").insert(newGames);
        const allMatchups = newGames.map((g) => ({
          week: g.week_number,
          team_a_id: g.team_a_id,
          team_b_id: g.team_b_id,
          game_id: g.id,
        }));
        await supabase.from("matchups").insert(allMatchups);
        setGames((prev) =>
          [...prev, ...newGames].sort((a, b) => a.game_number - b.game_number)
        );
      }
    } catch (e) {
      console.error("Bulk generate failed:", e);
    } finally {
      setBulkGenerating(false);
    }
  };

  const gameOptions = Array.from({ length: 66 }, (_, i) => i);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-green-500 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Schedule Manager — {season?.name}
          </CardTitle>
          <Button
            variant="outline"
            onClick={handleBulkGenerate}
            disabled={bulkGenerating}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${bulkGenerating ? "animate-spin" : ""}`}
            />
            {bulkGenerating
              ? "Generating..."
              : "Bulk Generate Remaining Games"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Game #
              </label>
              <Select
                value={gameNumber.toString()}
                onValueChange={(v) => setGameNumber(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select game number" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  {gameOptions.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Game {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Team A
              </label>
              <Select
                value={teamA || ""}
                onValueChange={(v) => setTeamA(v as UUID)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center text-gray-700 font-semibold pb-2">
              vs
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Team B
              </label>
              <Select
                value={teamB || ""}
                onValueChange={(v) => setTeamB(v as UUID)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          {formError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {formError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} disabled={saving}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Matchup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Games</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...gamesByWeek.keys()]
            .sort((a, b) => a - b)
            .map((wk) => {
              const weekGames = gamesByWeek.get(wk)!;
              const weekStart = addDays(WEEK1_START, (wk - 1) * WEEK_LENGTH);
              const weekEnd = addDays(weekStart, 6);

              return (
                <div key={wk} className="rounded border">
                  <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold">
                    Week {wk} • {weekStart.toLocaleDateString()}–
                    {weekEnd.toLocaleDateString()}
                  </div>
                  <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {weekGames.map((g) => (
                      <div
                        key={g.id}
                        className="border rounded p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            Game {g.game_number}: {teamName(g.team_a_id)} vs{" "}
                            {teamName(g.team_b_id)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(g.start_date).toLocaleDateString()} →{" "}
                            {new Date(g.end_date).toLocaleDateString()}
                            {g.notes ? ` • ${g.notes}` : ""}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-red-600"
                          //onClick={() => handleDelete(g.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          {games.length === 0 && (
            <p className="text-sm text-gray-500">No games scheduled yet.</p>
          )}
          <Separator />
          <p className="text-xs text-gray-500">
            Season runs {WEEK1_START.toLocaleDateString()} –{" "}
            {SEASON_END.toLocaleDateString()} • 65 total game slots.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
