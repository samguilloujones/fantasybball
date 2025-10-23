"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Team } from "@/lib/types"

interface TeamWithStats extends Team {
  owners?: {
    name: string
    email: string
  } | null
  wins?: number
  losses?: number
  pointsFor?: number
  pointsAgainst?: number
  streak?: string
  change?: "up" | "down" | "same"
}

export default function Standings() {
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
  async function fetchTeams() {
    try {
      const { data, error } = await supabase
  .from("teams")
  .select(`
    id,
    name,
    owner_id,
    created_at,
    owners!teams_owner_id_fkey (
      name,
      email
    )
  `)
  .order("name", { ascending: true });


      if (error) throw error;
      setTeams(data || []);
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false);
    }
  }

  fetchTeams()
}, [])


  if (loading) return <p className="p-4">Loading standings...</p>
  if (error) return <p className="p-4 text-red-500">{error}</p>

  const playoffTeams = teams.slice(0, 4)
  const nonPlayoffTeams = teams.slice(4)

  const getChangeIcon = (change: "up" | "down" | "same") => {
    switch (change) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "same":
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-green-500">
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-green-600" />
            League Standings
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Current season rankings and statistics
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-bold">Rank</th>
                  <th className="text-left py-3 px-2 font-bold">Team</th>
                  <th className="text-center py-3 px-2 font-bold">Owner</th>
                  <th className="text-center py-3 px-2 font-bold">W-L</th>
                  <th className="text-center py-3 px-2 font-bold">PF</th>
                  <th className="text-center py-3 px-2 font-bold">PA</th>
                  <th className="text-center py-3 px-2 font-bold">Diff</th>
                  <th className="text-center py-3 px-2 font-bold">Streak</th>
                  <th className="text-center py-3 px-2 font-bold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {playoffTeams.map((team, i) => (
                  <tr
                    key={team.id}
                    className={`border-b ${
                      i < 4 ? "bg-green-50" : ""
                    } hover:bg-gray-50`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{i + 1}</span>
                        {i < 4 && (
                          <Badge className="bg-green-600 text-xs">Playoff</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-semibold">{team.name}</td>
                    <td className="text-center py-3 px-2">
                      {team.owners?.name || "Unassigned"}
                    </td>
                    <td className="text-center py-3 px-2">
                      {team.wins}-{team.losses}
                    </td>
                    <td className="text-center py-3 px-2">{team.pointsFor}</td>
                    <td className="text-center py-3 px-2">
                      {team.pointsAgainst}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span
                        className={
                          (team.pointsFor ?? 0) - (team.pointsAgainst ?? 0) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {(team.pointsFor ?? 0) - (team.pointsAgainst ?? 0) > 0
                          ? "+"
                          : ""}
                        {(team.pointsFor ?? 0) - (team.pointsAgainst ?? 0)}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge
                        variant={
                          team.streak?.startsWith("W") ? "default" : "destructive"
                        }
                      >
                        {team.streak}
                      </Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      {getChangeIcon(team.change!)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-200">
                  <td colSpan={9} className="py-1"></td>
                </tr>

                {nonPlayoffTeams.map((team, i) => (
                  <tr key={team.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-bold">{i + 5}</span>
                    </td>
                    <td className="py-3 px-2 font-semibold">{team.name}</td>
                    <td className="text-center py-3 px-2">
                      {team.owners?.name || "Unassigned"}
                    </td>
                    <td className="text-center py-3 px-2">
                      {team.wins}-{team.losses}
                    </td>
                    <td className="text-center py-3 px-2">{team.pointsFor}</td>
                    <td className="text-center py-3 px-2">
                      {team.pointsAgainst}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span
                        className={
                          (team.pointsFor ?? 0) - (team.pointsAgainst ?? 0) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {(team.pointsFor ?? 0) - (team.pointsAgainst ?? 0) > 0
                          ? "+"
                          : ""}
                        {(team.pointsFor ?? 0) - (team.pointsAgainst ?? 0)}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge
                        variant={
                          team.streak?.startsWith("W") ? "default" : "destructive"
                        }
                      >
                        {team.streak}
                      </Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      {getChangeIcon(team.change!)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Playoff Picture</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span>Top 4 teams make playoffs</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-600 text-xs">Playoff</Badge>
                <span>Clinched playoff spot</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
