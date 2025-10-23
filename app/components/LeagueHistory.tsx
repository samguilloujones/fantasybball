"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Calendar, Crown } from "lucide-react"

interface SeasonWinner {
  year: number
  champion: string
  runnerUp: string
  finalScore: string
  totalTeams: number
}

interface WeeklyMedalist {
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

// Mock data for previous season winners
const seasonWinners: SeasonWinner[] = [
  {
    year: 2024,
    champion: "COLOSSAL",
    runnerUp: "Hammy Sammy",
    finalScore: "145-132",
    totalTeams: 10,
  },
  {
    year: 2023,
    champion: "Life of Paolo",
    runnerUp: "Midsize Sedan",
    finalScore: "138-125",
    totalTeams: 10,
  },
  {
    year: 2022,
    champion: "Ant Farm",
    runnerUp: "Bo Zoes",
    finalScore: "142-139",
    totalTeams: 8,
  },
  {
    year: 2021,
    champion: "Great Scotts",
    runnerUp: "Tatum Got Hotdish",
    finalScore: "151-144",
    totalTeams: 8,
  },
]

// Mock data for weekly medalists (current season 2025)
const weeklyMedalists2025: WeeklyMedalist[] = [
  { week: 1, teams: ["COLOSSAL"], points: 156, season: 2025 },
  { week: 2, teams: ["Hammy Sammy"], points: 148, season: 2025 },
  { week: 3, teams: ["Life of Paolo", "Midsize Sedan"], points: 142, season: 2025 },
  { week: 4, teams: ["Ant Farm"], points: 139, season: 2025 },
  { week: 5, teams: ["Bo Zoes"], points: 145, season: 2025 },
  { week: 6, teams: ["COLOSSAL"], points: 152, season: 2025 },
  { week: 7, teams: ["Great Scotts"], points: 147, season: 2025 },
  { week: 8, teams: ["Tatum Got Hotdish"], points: 144, season: 2025 },
  { week: 9, teams: ["Hammy Sammy"], points: 149, season: 2025 },
  { week: 10, teams: ["COLOSSAL"], points: 153, season: 2025 },
]

// Mock data for 2024 season medalists
const weeklyMedalists2024: WeeklyMedalist[] = [
  { week: 1, teams: ["Life of Paolo"], points: 162, season: 2024 },
  { week: 2, teams: ["COLOSSAL"], points: 155, season: 2024 },
  { week: 3, teams: ["Hammy Sammy"], points: 148, season: 2024 },
  { week: 4, teams: ["Midsize Sedan"], points: 151, season: 2024 },
  { week: 5, teams: ["Bo Zoes"], points: 146, season: 2024 },
  { week: 6, teams: ["COLOSSAL"], points: 159, season: 2024 },
  { week: 7, teams: ["Life of Paolo"], points: 157, season: 2024 },
  { week: 8, teams: ["Ant Farm"], points: 143, season: 2024 },
  { week: 9, teams: ["COLOSSAL"], points: 161, season: 2024 },
  { week: 10, teams: ["Great Scotts"], points: 149, season: 2024 },
  { week: 11, teams: ["COLOSSAL"], points: 158, season: 2024 },
  { week: 12, teams: ["Life of Paolo"], points: 154, season: 2024 },
  { week: 13, teams: ["Hammy Sammy"], points: 152, season: 2024 },
  { week: 14, teams: ["COLOSSAL"], points: 165, season: 2024 },
]

const allMedalists = [...weeklyMedalists2025, ...weeklyMedalists2024]

export default function LeagueHistory() {
  const [selectedSeason, setSelectedSeason] = useState<number>(2025)
  const [selectedTeam, setSelectedTeam] = useState<string>("")

  const availableSeasons = [2025, 2024]
  const currentSeasonMedalists = allMedalists.filter((m) => m.season === selectedSeason)

  // Calculate team medalist counts for selected season
  const getTeamMedalistCounts = (season: number): TeamMedalistCount[] => {
    const seasonMedalists = allMedalists.filter((m) => m.season === season)
    const teamCounts: { [key: string]: { count: number; weeks: number[] } } = {}

    seasonMedalists.forEach((medalist) => {
      medalist.teams.forEach((team) => {
        if (!teamCounts[team]) {
          teamCounts[team] = { count: 0, weeks: [] }
        }
        teamCounts[team].count += 1
        teamCounts[team].weeks.push(medalist.week)
      })
    })

    return Object.entries(teamCounts)
      .map(([teamName, data]) => ({
        teamName,
        count: data.count,
        weeks: data.weeks.sort((a, b) => a - b),
      }))
      .sort((a, b) => b.count - a.count)
  }

  const teamMedalistCounts = getTeamMedalistCounts(selectedSeason)

  // Get team details for selected team
  const getTeamDetails = (teamName: string) => {
    const teamData = teamMedalistCounts.find((t) => t.teamName === teamName)
    return teamData || { teamName, count: 0, weeks: [] }
  }

  const teamNames = [
    "Ant Farm",
    "Bo Zoes",
    "COLOSSAL",
    "G.I. Jones",
    "Great Scotts",
    "Hammy Sammy",
    "Life of Paolo",
    "Midsize Sedan",
    "Tatum Got Hotdish",
    "Zutopia",
  ]

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
                value={selectedSeason.toString()}
                onValueChange={(value) => setSelectedSeason(Number.parseInt(value))}
              >
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {availableSeasons.map((season) => (
                    <SelectItem key={season} value={season.toString()} className="text-sm">
                      {season} Season
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Tabs defaultValue="champions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="champions" className="text-xs sm:text-sm py-2">
                Champions
              </TabsTrigger>
              <TabsTrigger value="medalists" className="text-xs sm:text-sm py-2">
                Medalists
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2">
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="team-view" className="text-xs sm:text-sm py-2">
                Team View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="champions" className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Championship History</h3>
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader className="bg-green-100">
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Year</TableHead>
                      <TableHead className="text-xs sm:text-sm">Champion</TableHead>
                      <TableHead className="text-xs sm:text-sm">Runner-Up</TableHead>
                      <TableHead className="text-xs sm:text-sm">Final Score</TableHead>
                      <TableHead className="text-xs sm:text-sm">League Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasonWinners.map((winner) => (
                      <TableRow key={winner.year}>
                        <TableCell className="font-medium text-xs sm:text-sm">{winner.year}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center">
                            <Crown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                            <span className="font-semibold">{winner.champion}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{winner.runnerUp}</TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">{winner.finalScore}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{winner.totalTeams} teams</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="medalists" className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Weekly Medalists - {selectedSeason} Season
                <span className="block sm:inline text-xs text-gray-500 sm:ml-2">(Highest weekly points)</span>
              </h3>
              <div className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader className="bg-green-100">
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Week</TableHead>
                      <TableHead className="text-xs sm:text-sm">Medalist(s)</TableHead>
                      <TableHead className="text-xs sm:text-sm">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSeasonMedalists.map((medalist) => (
                      <TableRow key={`${medalist.season}-${medalist.week}`}>
                        <TableCell className="font-medium text-xs sm:text-sm">Week {medalist.week}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-start space-x-2">
                            <Medal className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {medalist.teams.map((team, index) => (
                                <Badge key={team} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  {team}
                                  {medalist.teams.length > 1 && index < medalist.teams.length - 1 && ","}
                                </Badge>
                              ))}
                            </div>
                            {medalist.teams.length > 1 && (
                              <span className="text-xs text-gray-500 whitespace-nowrap">(Co-medalists)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-xs sm:text-sm">{medalist.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Medalist Leaderboard - {selectedSeason} Season
                <span className="block sm:inline text-xs text-gray-500 sm:ml-2">(Teams ranked by medalist awards)</span>
              </h3>
              <div className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader className="bg-green-100">
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Rank</TableHead>
                      <TableHead className="text-xs sm:text-sm">Team</TableHead>
                      <TableHead className="text-xs sm:text-sm">Medalist Awards</TableHead>
                      <TableHead className="text-xs sm:text-sm">Weeks Won</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMedalistCounts.map((team, index) => (
                      <TableRow key={team.teamName}>
                        <TableCell className="font-medium text-xs sm:text-sm">#{index + 1}</TableCell>
                        <TableCell className="font-semibold text-xs sm:text-sm">{team.teamName}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center flex-wrap">
                            <Medal className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                            <span className="font-bold">{team.count}</span>
                            <span className="text-xs text-gray-500 ml-1 whitespace-nowrap">
                              {team.count === 1 ? "award" : "awards"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex flex-wrap gap-1">
                            {team.weeks.map((week) => (
                              <Badge key={week} variant="outline" className="text-xs">
                                W{week}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="team-view" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                <h3 className="text-base sm:text-lg font-semibold">Team Medalist History</h3>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {teamNames.map((team) => (
                      <SelectItem key={team} value={team} className="text-sm">
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTeam && (
                <Card className="p-3">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center text-base sm:text-lg">
                      <span className="mb-2 sm:mb-0">{selectedTeam}</span>
                      <Badge className="ml-0 sm:ml-2 bg-green-100 text-green-800 text-xs w-fit">
                        🏅 {getTeamDetails(selectedTeam).count}-time Medalist ({selectedSeason})
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getTeamDetails(selectedTeam).count > 0 ? (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3">
                          Medalist awards won in {selectedSeason} season:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {getTeamDetails(selectedTeam).weeks.map((week) => {
                            const medalistData = currentSeasonMedalists.find((m) => m.week === week)
                            return (
                              <Card key={week} className="p-3">
                                <div className="text-center">
                                  <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mx-auto mb-1" />
                                  <div className="font-semibold text-sm">Week {week}</div>
                                  <div className="text-xs text-gray-500">{medalistData?.points} pts</div>
                                  {medalistData && medalistData.teams.length > 1 && (
                                    <div className="text-xs text-blue-600">Co-medalist</div>
                                  )}
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No medalist awards won in {selectedSeason} season.</p>
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
