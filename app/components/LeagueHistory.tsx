"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Calendar, Crown } from "lucide-react"

interface Season {
  id: string
  year: number
}

interface Champion {
  year: number
  champion: string
  runnerUp: string
  finalScore: string
  totalTeams: number
}

interface Medalist {
  week: number
  teams: string[]
  points: number
  season: number
}

interface TeamMedalistCount {
  teamName: string
  count: number
  weeks: number[]
}

export default function LeagueHistory() {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [champions, setChampions] = useState<Champion[]>([])
  const [medalists, setMedalists] = useState<Medalist[]>([])
  const [teamCounts, setTeamCounts] = useState<TeamMedalistCount[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")

  // ✅ Load Seasons on mount
  useEffect(() => {
    const fetchSeasons = async () => {
      const { data, error } = await supabase.from("seasons").select("id, year").order("year", { ascending: false })
      if (error) console.error("Error fetching seasons:", error)
      else {
        setSeasons(data)
        if (data.length > 0) setSelectedSeason(data[0].year)
      }
    }
    fetchSeasons()
  }, [])

  // ✅ Fetch Champions from Supabase (assumes a `championships` table or equivalent view)
  useEffect(() => {
    if (!selectedSeason) return
    const fetchChampions = async () => {
      const { data, error } = await supabase
        .from("championships")
        .select(`
          year,
          champion:champion_team_id(name),
          runner_up:runner_up_team_id(name),
          final_score,
          total_teams
        `)
        .eq("year", selectedSeason)
        .order("year", { ascending: false })
      if (error) console.error("Error fetching champions:", error)
      else setChampions(data)
    }
    fetchChampions()
  }, [selectedSeason])

  // ✅ Fetch Medalists (join games + teams)
  useEffect(() => {
    if (!selectedSeason) return
    const fetchMedalists = async () => {
      const { data, error } = await supabase
        .from("medalists")
        .select(`
          score,
          team:team_id(name),
          game:game_id(week_number),
          season:season_id(year)
        `)
        .eq("season.year", selectedSeason)
        .order("game.week_number", { ascending: true })

      if (error) {
        console.error("Error fetching medalists:", error)
        return
      }

      // Transform into weekly structure
      const weekMap: Record<number, { teams: string[]; points: number; season: number }> = {}
      data.forEach((m: any) => {
        const week = m.game?.week_number
        if (!week) return
        if (!weekMap[week]) {
          weekMap[week] = { teams: [], points: m.score, season: m.season.year }
        }
        weekMap[week].teams.push(m.team.name)
      })

      const medalistList: Medalist[] = Object.entries(weekMap).map(([week, info]) => ({
        week: Number(week),
        teams: info.teams,
        points: info.points,
        season: info.season,
      }))

      setMedalists(medalistList)
    }
    fetchMedalists()
  }, [selectedSeason])

  // ✅ Calculate team medalist counts
  useEffect(() => {
    const counts: Record<string, { count: number; weeks: number[] }> = {}
    medalists.forEach((m) => {
      m.teams.forEach((team) => {
        if (!counts[team]) counts[team] = { count: 0, weeks: [] }
        counts[team].count += 1
        counts[team].weeks.push(m.week)
      })
    })

    const sorted = Object.entries(counts)
      .map(([teamName, data]) => ({
        teamName,
        count: data.count,
        weeks: data.weeks.sort((a, b) => a - b),
      }))
      .sort((a, b) => b.count - a.count)
    setTeamCounts(sorted)
  }, [medalists])

  const getTeamDetails = (teamName: string) =>
    teamCounts.find((t) => t.teamName === teamName) || { teamName, count: 0, weeks: [] }

  const currentSeasonMedalists = medalists.filter((m) => m.season === selectedSeason)

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <CardHeader className="border-b border-green-500 pb-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl">League History</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Championship winners and weekly medalists</p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <Select
                value={selectedSeason?.toString() ?? ""}
                onValueChange={(v) => setSelectedSeason(Number(v))}
              >
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.year.toString()}>
                      {s.year} Season
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <Tabs defaultValue="champions" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="champions">Champions</TabsTrigger>
              <TabsTrigger value="medalists">Medalists</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="team-view">Team View</TabsTrigger>
            </TabsList>

            {/* 🏆 Champions Tab */}
            <TabsContent value="champions" className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Championship History</h3>
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader className="bg-green-100">
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Champion</TableHead>
                      <TableHead>Runner-Up</TableHead>
                      <TableHead>Final Score</TableHead>
                      <TableHead>League Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {champions.length > 0 ? (
                      champions.map((winner) => (
                        <TableRow key={winner.year}>
                          <TableCell>{winner.year}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                              <span className="font-semibold">{winner.champion}</span>
                            </div>
                          </TableCell>
                          <TableCell>{winner.runnerUp}</TableCell>
                          <TableCell>{winner.finalScore}</TableCell>
                          <TableCell>{winner.totalTeams} teams</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          No championship data found for this season.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* 🥇 Medalists Tab */}
            <TabsContent value="medalists" className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Weekly Medalists - {selectedSeason}
              </h3>
              <Table>
                <TableHeader className="bg-green-100">
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Medalist(s)</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSeasonMedalists.length > 0 ? (
                    currentSeasonMedalists.map((m) => (
                      <TableRow key={m.week}>
                        <TableCell>Week {m.week}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {m.teams.map((t) => (
                              <Badge key={t} className="bg-green-100 text-green-800">{t}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{m.points}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No medalist data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* 🏅 Leaderboard */}
            <TabsContent value="leaderboard" className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Medalist Leaderboard - {selectedSeason}
              </h3>
              <Table>
                <TableHeader className="bg-green-100">
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Awards</TableHead>
                    <TableHead>Weeks Won</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamCounts.map((team, i) => (
                    <TableRow key={team.teamName}>
                      <TableCell>#{i + 1}</TableCell>
                      <TableCell>{team.teamName}</TableCell>
                      <TableCell>{team.count}</TableCell>
                      <TableCell>
                        {team.weeks.map((w) => (
                          <Badge key={w} variant="outline">W{w}</Badge>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* 👥 Team View */}
            <TabsContent value="team-view" className="space-y-4">
              <div className="flex items-center gap-3">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamCounts.map((team) => (
                      <SelectItem key={team.teamName} value={team.teamName}>
                        {team.teamName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTeam && (
                <Card className="p-3">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      {selectedTeam} – 🏅 {getTeamDetails(selectedTeam).count}-time Medalist
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getTeamDetails(selectedTeam).weeks.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {getTeamDetails(selectedTeam).weeks.map((week) => {
                          const medalData = currentSeasonMedalists.find((m) => m.week === week)
                          return (
                            <Card key={week} className="p-3 text-center">
                              <Medal className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                              <div className="font-semibold">Week {week}</div>
                              <div className="text-xs text-gray-500">{medalData?.points} pts</div>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No medalist awards for this team.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
