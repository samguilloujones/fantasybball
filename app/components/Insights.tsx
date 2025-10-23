"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { TrendingUp, TrendingDown, Target, Zap, Medal, BarChart3, Activity } from "lucide-react"

export default function Insights() {
  const [selectedRange, setSelectedRange] = useState<"current" | "ytd" | "custom">("ytd")
  const [underperformThreshold, setUnderperformThreshold] = useState<number>(20)

  // Placeholder empty arrays (no Supabase data yet)
  const topScorers: any[] = []
  const underperformers: any[] = []
  const teamStats: any[] = []
  const playerChartData: any[] = []
  const chartData: any[] = []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-green-500">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            League Insights
          </CardTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Analytics based on player points scored
          </p>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="players" className="text-xs sm:text-sm">
                Player Analytics
              </TabsTrigger>
              <TabsTrigger value="teams" className="text-xs sm:text-sm">
                Team Analytics
              </TabsTrigger>
              <TabsTrigger value="matchups" className="text-xs sm:text-sm">
                Matchup Insights
              </TabsTrigger>
            </TabsList>

            {/* ---------- PLAYER ANALYTICS TAB ---------- */}
            <TabsContent value="players" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Scorers */}
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <CardTitle className="flex items-center text-sm sm:text-base">
                        <TrendingUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        Top Scorers
                      </CardTitle>
                      <Select value={selectedRange} onValueChange={(value: any) => setSelectedRange(value)}>
                        <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="current">Current Week</SelectItem>
                          <SelectItem value="ytd">Year to Date</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Rank</TableHead>
                            <TableHead className="text-xs">Player</TableHead>
                            <TableHead className="text-xs">Team</TableHead>
                            <TableHead className="text-xs text-right">Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topScorers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-xs text-gray-500 py-4">
                                No player data available yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            topScorers.map((player, index) => (
                              <TableRow key={player.name}>
                                <TableCell className="font-medium text-xs">#{index + 1}</TableCell>
                                <TableCell className="text-xs">{player.name}</TableCell>
                                <TableCell className="text-xs">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {player.team}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-xs text-right">
                                  {player.points}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Underperformers */}
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <CardTitle className="flex items-center text-sm sm:text-base">
                        <TrendingDown className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        Underperformers
                      </CardTitle>
                      <Select
                        value={underperformThreshold.toString()}
                        onValueChange={(value) => setUnderperformThreshold(Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-full sm:w-24 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="10">-10%</SelectItem>
                          <SelectItem value="15">-15%</SelectItem>
                          <SelectItem value="20">-20%</SelectItem>
                          <SelectItem value="25">-25%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      Players below season average by {underperformThreshold}%+
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Player</TableHead>
                            <TableHead className="text-xs">Team</TableHead>
                            <TableHead className="text-xs text-right">Current</TableHead>
                            <TableHead className="text-xs text-right">Avg</TableHead>
                            <TableHead className="text-xs text-right">Diff</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {underperformers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-xs text-gray-500 py-4">
                                No underperformer data available yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            underperformers.map((player) => (
                              <TableRow key={player.name}>
                                <TableCell className="text-xs">{player.name}</TableCell>
                                <TableCell className="text-xs">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {player.team}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-right">{player.current}</TableCell>
                                <TableCell className="text-xs text-right">{player.avg}</TableCell>
                                <TableCell className="text-xs text-right text-red-600">
                                  {player.diff}%
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Players Performance Chart */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Activity className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    Top Players Weekly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="h-64 sm:h-80 w-full">
                    {playerChartData.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs mt-24">
                        No chart data available yet.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={playerChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- TEAM ANALYTICS TAB ---------- */}
            <TabsContent value="teams" className="space-y-4">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Target className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    Weekly Scoring Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="h-64 sm:h-80 w-full">
                    {chartData.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs mt-24">
                        No team data available yet.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Zap className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    Team Consistency Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Team</TableHead>
                          <TableHead className="text-xs text-right">Avg Pts</TableHead>
                          <TableHead className="text-xs text-right">Std Dev</TableHead>
                          <TableHead className="text-xs">Consistency</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamStats.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-gray-500 py-4">
                              No team consistency data available yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          teamStats.map((team) => (
                            <TableRow key={team.name}>
                              <TableCell className="text-xs">{team.name}</TableCell>
                              <TableCell className="text-xs text-right">{team.avg}</TableCell>
                              <TableCell className="text-xs text-right">{team.std}</TableCell>
                              <TableCell>
                                <Progress value={team.consistency} className="w-16 h-2" />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- MATCHUP INSIGHTS TAB ---------- */}
            <TabsContent value="matchups" className="space-y-4">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Target className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    Luck Factor Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Team</TableHead>
                          <TableHead className="text-xs text-center">Actual</TableHead>
                          <TableHead className="text-xs text-center">Expected</TableHead>
                          <TableHead className="text-xs text-center">Luck</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamStats.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-gray-500 py-4">
                              No matchup data available yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          teamStats.map((team) => (
                            <TableRow key={team.name}>
                              <TableCell className="text-xs">{team.name}</TableCell>
                              <TableCell className="text-xs text-center">{team.actual}</TableCell>
                              <TableCell className="text-xs text-center">{team.expected}</TableCell>
                              <TableCell className="text-xs text-center">{team.luck}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Medal className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                    Medalist Awards vs Win-Loss Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="h-64 sm:h-80 w-full">
                    {teamStats.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs mt-24">
                        No medalist data available yet.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teamStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="awards" fill="#eab308" name="Awards" />
                          <Bar dataKey="wins" fill="#10b981" name="Wins" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
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
