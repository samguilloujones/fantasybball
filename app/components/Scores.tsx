"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Trophy, Medal } from "lucide-react";
import { format } from "date-fns";

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
}

interface Medalist {
  game_id: UUID;
  team_id: UUID;
}

const SEASON_NAME = "2025-2026";

export default function Scores() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [medalists, setMedalists] = useState<Medalist[]>([]);
  const [seasonId, setSeasonId] = useState<UUID | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Load data
  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        // 1️⃣ Get the current season
        const { data: season, error: seasonErr } = await supabase
          .from("seasons")
          .select("id")
          .eq("name", SEASON_NAME)
          .single();
        if (seasonErr) throw seasonErr;
        setSeasonId(season.id);

        // 2️⃣ Load all games for the season
        const { data: gameData, error: gameErr } = await supabase
          .from("games")
          .select("*")
          .eq("season_id", season.id)
          .order("game_number", { ascending: true });
        if (gameErr) throw gameErr;
        setGames(gameData || []);

        // 3️⃣ Load all teams
        const { data: teamData, error: teamErr } = await supabase
          .from("teams")
          .select("id, name")
          .order("name");
        if (teamErr) throw teamErr;
        setTeams(teamData || []);

        // 4️⃣ Load medalists
        const { data: medalData, error: medalErr } = await supabase
          .from("medalists")
          .select("game_id, team_id")
          .eq("season", SEASON_NAME);
        if (medalErr) throw medalErr;
        setMedalists(medalData || []);
      } catch (err) {
        console.error("Error loading scoreboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  // 🧠 Helper — get team name by ID
  const teamName = (id?: UUID | null) =>
    teams.find((t) => t.id === id)?.name || "—";

  // 🧠 Helper — check if team is medalist for that game
  const isMedalist = (gameId: UUID, teamId: UUID) =>
    medalists.some((m) => m.game_id === gameId && m.team_id === teamId);

  // 🗓️ Group games by week
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

  // 🕐 Loading state
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
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-10" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 📊 Main render
  return (
    <div className="space-y-8">
      {/* 🏆 Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-600" />
            League Scoreboard — {SEASON_NAME}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Automatically synced from Schedule Manager.
          </p>
        </CardHeader>
      </Card>

      {/* 🗓️ Weekly Grouped Games */}
      {[...gamesByWeek.keys()]
        .sort((a, b) => a - b)
        .map((week) => {
          const weekGames = gamesByWeek.get(week)!;
          const start = weekGames[0]?.start_date
            ? format(new Date(weekGames[0].start_date), "MMM d")
            : "";
          const end = weekGames[weekGames.length - 1]?.end_date
            ? format(new Date(weekGames[weekGames.length - 1].end_date), "MMM d, yyyy")
            : "";

          return (
            <Card key={week} className="shadow-sm">
              <CardHeader className="border-b border-green-100 bg-gray-50">
                <CardTitle className="text-base font-semibold text-green-700">
                  Week {week} • {start} – {end}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {weekGames.map((game) => (
                  <Link key={game.id} href={`/matchup/${game.id}`}>
                    <div className="border rounded-lg p-3 hover:bg-green-50 transition cursor-pointer relative">
                      <div className="flex justify-between text-sm font-semibold text-gray-800">
                        <span>Game {game.game_number}</span>
                        <span className="text-gray-500 text-xs">
                          {format(new Date(game.start_date), "MMM d")} →{" "}
                          {format(new Date(game.end_date), "MMM d")}
                        </span>
                      </div>

                      {/* 🧾 Matchup */}
                      <div className="mt-2 text-sm text-gray-700 space-y-1">
                        <div
                          className={`flex justify-between items-center ${
                            isMedalist(game.id, game.team_a_id)
                              ? "font-semibold text-green-700"
                              : ""
                          }`}
                        >
                          <span>{teamName(game.team_a_id)}</span>
                          {isMedalist(game.id, game.team_a_id) && (
                            <Medal className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div
                          className={`flex justify-between items-center ${
                            isMedalist(game.id, game.team_b_id)
                              ? "font-semibold text-green-700"
                              : ""
                          }`}
                        >
                          <span>{teamName(game.team_b_id)}</span>
                          {isMedalist(game.id, game.team_b_id) && (
                            <Medal className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>

                      {game.notes && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          {game.notes}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}

      {/* 🕳️ Empty state */}
      {games.length === 0 && (
        <p className="text-center text-gray-500">
          No games scheduled yet. Add matchups in the Schedule Manager.
        </p>
      )}
    </div>
  );
}
