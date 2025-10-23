"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Loader2, CheckCircle, AlertCircle, User, BarChart3, Calendar, Trophy } from "lucide-react"
import {
  searchPlayers,
  getPlayerRecentGames,
  getPlayerSeasonAverages,
  getTodaysGames,
  calculateFantasyPoints,
  type Player,
  type Stats,
  type SeasonAverage,
  type Game,
} from "@/lib/balldontlie-api"

export default function NBADataTest() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerStats, setPlayerStats] = useState<Stats[]>([])
  const [seasonAverages, setSeasonAverages] = useState<SeasonAverage[]>([])
  const [todaysGames, setTodaysGames] = useState<Game[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = await searchPlayers(searchTerm)
      setPlayers(response.data || [])
      if (!response.data || response.data.length === 0) {
        setError("No players found matching your search")
      }
    } catch (err) {
      setError("Failed to search players. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlayer = async (player: Player) => {
    setSelectedPlayer(player)
    setLoading(true)
    setError(null)

    try {
      // Fetch recent games
      const statsResponse = await getPlayerRecentGames(player.id, 10)
      setPlayerStats(statsResponse.data || [])

      // Fetch season averages
      const avgResponse = await getPlayerSeasonAverages(player.id)
      setSeasonAverages(avgResponse.data || [])
    } catch (err) {
      setError("Failed to load player data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTodaysGames = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getTodaysGames()
      setTodaysGames(response.data || [])
      if (!response.data || response.data.length === 0) {
        setError("No games scheduled for today")
      }
    } catch (err) {
      setError("Failed to load today's games")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-green-500">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
            NBA Data Integration Test
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Test the Ball Don't Lie API integration</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">Player Search</TabsTrigger>
              <TabsTrigger value="games">Today's Games</TabsTrigger>
              <TabsTrigger value="api">API Info</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              {/* Search Bar */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Search for NBA players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Search Results */}
              {players.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Search Results ({players.length})</h3>
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {players.map((player) => (
                      <Button
                        key={player.id}
                        variant="outline"
                        className="justify-start h-auto p-4 bg-transparent"
                        onClick={() => handleSelectPlayer(player)}
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <User className="h-8 w-8 text-gray-400" />
                          <div className="flex-1 text-left">
                            <div className="font-semibold">
                              {player.first_name} {player.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {player.team.full_name} • {player.position}
                              {player.jersey_number && ` • #${player.jersey_number}`}
                            </div>
                          </div>
                          <Badge>{player.team.abbreviation}</Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Player Details */}
              {selectedPlayer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {selectedPlayer.first_name} {selectedPlayer.last_name}
                      </span>
                      <Badge variant="outline">{selectedPlayer.team.abbreviation}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Player Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Team:</span>
                        <p className="font-medium">{selectedPlayer.team.full_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Position:</span>
                        <p className="font-medium">{selectedPlayer.position}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Height:</span>
                        <p className="font-medium">{selectedPlayer.height || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <p className="font-medium">{selectedPlayer.weight || "N/A"}</p>
                      </div>
                    </div>

                    {/* Season Averages */}
                    {seasonAverages.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
                          Season Averages
                        </h4>
                        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{seasonAverages[0].pts.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">PPG</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{seasonAverages[0].reb.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">RPG</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{seasonAverages[0].ast.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">APG</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Games */}
                    {playerStats.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recent Games</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {playerStats.map((stat, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="text-sm font-medium">
                                  {stat.team.abbreviation} vs{" "}
                                  {stat.game.home_team.id === stat.team.id
                                    ? stat.game.visitor_team.abbreviation
                                    : stat.game.home_team.abbreviation}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(stat.game.date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg">{stat.pts} pts</div>
                                <div className="text-xs text-gray-500">
                                  {stat.reb} reb • {stat.ast} ast
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  FP: {calculateFantasyPoints(stat).toFixed(1)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <Button onClick={handleLoadTodaysGames} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Load Today's Games
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {todaysGames.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Today's Games ({todaysGames.length})</h3>
                  {todaysGames.map((game) => (
                    <Card key={game.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{game.visitor_team.full_name}</span>
                              <Badge variant="outline">{game.visitor_team_score}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{game.home_team.full_name}</span>
                              <Badge variant="outline">{game.home_team_score}</Badge>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <Badge>{game.status === "Final" ? "Final" : "Live"}</Badge>
                            <div className="text-xs text-gray-500 mt-1">{new Date(game.date).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Ball Don't Lie API Integration</p>
                    <p className="text-sm">
                      This app is integrated with the Ball Don't Lie API to provide real-time NBA data.
                    </p>
                    <ul className="text-sm space-y-1 ml-4 list-disc">
                      <li>Search for any NBA player</li>
                      <li>View season averages and recent game stats</li>
                      <li>Track today's NBA games</li>
                      <li>Calculate fantasy points automatically</li>
                      <li>Data is cached for 5 minutes to improve performance</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      API Documentation:{" "}
                      <a
                        href="https://docs.balldontlie.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        https://docs.balldontlie.io
                      </a>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fantasy Points Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Standard Scoring System:</p>
                    <ul className="space-y-1 ml-4">
                      <li>Points: +1 per point</li>
                      <li>Rebounds: +1 per rebound</li>
                      <li>Assists: +1 per assist</li>
                      <li>Steals: +1 per steal</li>
                      <li>Blocks: +1 per block</li>
                      <li>Turnovers: -1 per turnover</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">Formula: PTS + REB + AST + STL + BLK - TOV</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
