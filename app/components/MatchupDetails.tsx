"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";

interface Game {
  id: string;
  team_a_id: string;
  team_b_id: string;
  start_date: string;
  end_date: string;
  game_number: number;
  week_number: number;
}

interface Team {
  id: string;
  name: string;
}

interface Player {
  id: number;
  full_name: string;
}

interface PlayerScore {
  player_id: number;
  points: number;
  date: string;
}

export default function MatchupDetails() {
  const params = useParams();
  const matchupId = params?.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [rosters, setRosters] = useState<Record<string, Player[]>>({});
  const [scores, setScores] = useState<Record<number, number[]>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      // 1️⃣ Load the game
      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select("*")
        .eq("id", matchupId)
        .single();
      if (gameErr) throw gameErr;
      setGame(gameData);

      // 2️⃣ Load both teams
      const { data: teamData, error: teamErr } = await supabase
        .from("teams")
        .select("id, name")
        .in("id", [gameData.team_a_id, gameData.team_b_id]);
      if (teamErr) throw teamErr;
      setTeams(teamData);

      // 3️⃣ Load rosters for those teams
      const { data: rosterData, error: rosterErr } = await supabase
        .from("rosters")
        .select("team_id, player_id, players(full_name)")
        .in("team_id", [gameData.team_a_id, gameData.team_b_id])
        .eq("season", "2025-2026");
      if (rosterErr) throw rosterErr;

      const grouped: Record<string, Player[]> = {};
      rosterData.forEach((r) => {
        if (!grouped[r.team_id]) grouped[r.team_id] = [];
        grouped[r.team_id].push({
          id: r.player_id,
          full_name: r.players.full_name,
        });
      });
      setRosters(grouped);

      // 4️⃣ Load NBA scores for players during that date range
      const playerIds = rosterData.map((r) => r.player_id);
      const { data: playerScores, error: scoreErr } = await supabase
        .from("scores")
        .select("player_id, points, date")
        .in("player_id", playerIds)
        .gte("date", gameData.start_date)
        .lte("date", gameData.end_date);
      if (scoreErr) throw scoreErr;

      // 5️⃣ Aggregate scores
      const playerScoreMap: Record<number, number[]> = {};
      playerScores.forEach((s) => {
        if (!playerScoreMap[s.player_id]) playerScoreMap[s.player_id] = [];
        playerScoreMap[s.player_id].push(s.points);
      });
      setScores(playerScoreMap);

      // 6️⃣ Calculate team totals
      const totalsMap: Record<string, number> = {};
      for (const [teamId, players] of Object.entries(grouped)) {
        totalsMap[teamId] = players.reduce((sum, p) => {
          const best = Math.max(...(playerScoreMap[p.id] || [0]));
          return sum + best;
        }, 0);
      }
      setTotals(totalsMap);
    };

    loadData().catch((err) => console.error(err));
  }, [matchupId]);

  if (!game || teams.length === 0) {
    return <p className="text-center text-gray-500 mt-10">Loading matchup...</p>;
  }

  const teamA = teams.find((t) => t.id === game.team_a_id)!;
  const teamB = teams.find((t) => t.id === game.team_b_id)!;
  const teamAWon = (totals[teamA.id] || 0) > (totals[teamB.id] || 0);

  return (
    <div className="space-y-6">
      <Link href="/scoreboard" className="text-blue-600 text-sm flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Scoreboard
      </Link>

      <Card>
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>{teamA.name}</span>
            <span className="font-bold text-2xl">
              {totals[teamA.id] || 0} — {totals[teamB.id] || 0}
            </span>
            <span>{teamB.name}</span>
          </CardTitle>
          <p className="text-sm mt-1">
            Winner: <strong>{teamAWon ? teamA.name : teamB.name}</strong>
          </p>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-4 mt-4">
          {[teamA, teamB].map((team) => (
            <div key={team.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{team.name}</h3>
                {teamAWon && team.id === teamA.id && (
                  <Trophy className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left">Player</th>
                    <th className="text-right">Best Game</th>
                  </tr>
                </thead>
                <tbody>
                  {rosters[team.id]?.map((p) => {
                    const games = scores[p.id] || [];
                    const best = Math.max(...games, 0);
                    return (
                      <tr key={p.id} className="border-t">
                        <td>{p.full_name}</td>
                        <td className="text-right font-medium">{best}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-2 text-right font-semibold">
                Total: {totals[team.id] || 0}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
