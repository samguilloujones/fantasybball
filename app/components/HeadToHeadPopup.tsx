"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Target, Calendar } from "lucide-react"

interface HeadToHeadPopupProps {
  isOpen: boolean
  onClose: () => void
  team1: string
  team2: string
}

interface MatchupHistory {
  week: string
  date: string
  team1Score: number
  team2Score: number
  winner: string
}

// Mock data - replace with real data
const mockMatchupHistory: MatchupHistory[] = [
  {
    week: "Week 1",
    date: "Nov 22-Nov 23",
    team1Score: 112,
    team2Score: 108,
    winner: "team1",
  },
]

export default function HeadToHeadPopup({ isOpen, onClose, team1, team2 }: HeadToHeadPopupProps) {
  // Calculate stats
  const team1Wins = mockMatchupHistory.filter((m) => m.winner === "team1").length
  const team2Wins = mockMatchupHistory.filter((m) => m.winner === "team2").length
  const totalGames = mockMatchupHistory.length

  const team1WinPercent = totalGames > 0 ? (team1Wins / totalGames) * 100 : 0
  const team2WinPercent = totalGames > 0 ? (team2Wins / totalGames) * 100 : 0

  const team1AvgScore =
    mockMatchupHistory.length > 0
      ? mockMatchupHistory.reduce((sum, m) => sum + m.team1Score, 0) / mockMatchupHistory.length
      : 0

  const team2AvgScore =
    mockMatchupHistory.length > 0
      ? mockMatchupHistory.reduce((sum, m) => sum + m.team2Score, 0) / mockMatchupHistory.length
      : 0

  const team1HighScore = mockMatchupHistory.length > 0 ? Math.max(...mockMatchupHistory.map((m) => m.team1Score)) : 0
  const team2HighScore = mockMatchupHistory.length > 0 ? Math.max(...mockMatchupHistory.map((m) => m.team2Score)) : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[85vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            Head-to-Head History
          </DialogTitle>
        </DialogHeader>

        {/* Teams Header */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-xl font-bold text-gray-800 truncate max-w-[120px] sm:max-w-none">{team1}</h3>
          <Badge variant="outline" className="text-xs sm:text-sm">
            VS
          </Badge>
          <h3 className="text-base sm:text-xl font-bold text-gray-800 truncate max-w-[120px] sm:max-w-none">{team2}</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Overall Record */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 border border-blue-100">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wide">
              Overall Series Record
            </h4>
            <div className="flex items-center justify-between mb-2">
              <div className="text-center flex-1">
                <div className="text-2xl sm:text-4xl font-bold text-blue-600">{team1Wins}</div>
                <div className="text-xs sm:text-sm text-gray-600 truncate">{team1}</div>
                <div className="text-xs text-gray-500">{team1WinPercent.toFixed(0)}% wins</div>
              </div>
              <div className="text-center px-2 sm:px-4">
                <div className="text-lg sm:text-2xl text-gray-400">-</div>
                <div className="text-xs text-gray-500">{totalGames} games</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl sm:text-4xl font-bold text-purple-600">{team2Wins}</div>
                <div className="text-xs sm:text-sm text-gray-600 truncate">{team2}</div>
                <div className="text-xs text-gray-500">{team2WinPercent.toFixed(0)}% wins</div>
              </div>
            </div>
            {/* Win percentage bar */}
            <div className="w-full h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${team1WinPercent}%` }}
              />
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              Average Score in Matchups
            </h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">{team1}</span>
                  <span className="text-base sm:text-xl font-bold text-blue-600">{team1AvgScore.toFixed(1)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(team1AvgScore / Math.max(team1AvgScore, team2AvgScore)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">{team2}</span>
                  <span className="text-base sm:text-xl font-bold text-purple-600">{team2AvgScore.toFixed(1)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${(team2AvgScore / Math.max(team1AvgScore, team2AvgScore)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Highest Score */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              Highest Score in Matchups
            </h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">{team1}</span>
                  <span className="text-base sm:text-xl font-bold text-blue-600">{team1HighScore}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(team1HighScore / Math.max(team1HighScore, team2HighScore)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">{team2}</span>
                  <span className="text-base sm:text-xl font-bold text-purple-600">{team2HighScore}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${(team2HighScore / Math.max(team1HighScore, team2HighScore)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Previous Matchups */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              Previous Matchups ({mockMatchupHistory.length})
            </h4>
            <div className="space-y-2">
              {mockMatchupHistory.map((matchup, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">{matchup.week}</span>
                      <span>•</span>
                      <span>{matchup.date}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 truncate max-w-[80px] sm:max-w-none">{team1}</div>
                        <div
                          className={`text-lg sm:text-2xl font-bold ${
                            matchup.winner === "team1" ? "text-green-600" : "text-gray-600"
                          }`}
                        >
                          {matchup.team1Score}
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm">-</span>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 truncate max-w-[80px] sm:max-w-none">{team2}</div>
                        <div
                          className={`text-lg sm:text-2xl font-bold ${
                            matchup.winner === "team2" ? "text-green-600" : "text-gray-600"
                          }`}
                        >
                          {matchup.team2Score}
                        </div>
                      </div>
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[80px] sm:max-w-none">
                        {matchup.winner === "team1" ? team1 : team2}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
