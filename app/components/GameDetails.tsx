"use client"

import { useState } from "react"
import { Trophy, TrendingUp, ChevronRight, Loader2 } from "lucide-react"

interface Player {
  name: string
  scores: {
    game1: number
    game2: number
    game3: number
  }
}

interface Team {
  name: string
  players: Player[]
}

interface GameDetailsProps {
  team1: Team
  team2: Team
  score1: number
  score2: number
  onPlayerClick?: (playerName: string) => void
}

export default function GameDetails({ team1, team2, score1, score2, onPlayerClick }: GameDetailsProps) {
  const [loadingPlayer, setLoadingPlayer] = useState<string | null>(null)

  const winner = score1 > score2 ? team1.name : team2.name

  const handlePlayerClick = async (playerName: string) => {
    if (onPlayerClick) {
      setLoadingPlayer(playerName)
      await onPlayerClick(playerName)
      setLoadingPlayer(null)
    }
  }

  const renderTeamTable = (team: Team, score: number, isWinner: boolean) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${isWinner ? "border-2 border-yellow-400" : ""}`}>
      <div className={`px-4 py-3 ${isWinner ? "bg-yellow-50" : "bg-gray-50"} border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
            {isWinner && <Trophy className="h-5 w-5 text-yellow-500" />}
          </div>
          <span className="text-2xl font-bold text-blue-600">{score}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Player</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Game 1</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Game 2</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Game 3</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Best</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {team.players.map((player, index) => {
              const bestScore = Math.max(player.scores.game1, player.scores.game2, player.scores.game3)
              const isLoading = loadingPlayer === player.name

              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handlePlayerClick(player.name)}
                      disabled={isLoading}
                      className="flex items-center space-x-2 text-left hover:text-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">{player.name}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600">{player.scores.game1}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600">{player.scores.game2}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600">{player.scores.game3}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span>{bestScore}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold mb-1">{team1.name}</h2>
            <p className="text-blue-100 text-sm">Team Score: {score1}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold">{score1}</div>
            <div className="text-2xl text-blue-200">vs</div>
            <div className="text-4xl font-bold">{score2}</div>
          </div>
          <div className="text-center sm:text-right">
            <h2 className="text-3xl font-bold mb-1">{team2.name}</h2>
            <p className="text-blue-100 text-sm">Team Score: {score2}</p>
          </div>
        </div>
        {winner && (
          <div className="mt-4 pt-4 border-t border-blue-500 text-center">
            <p className="text-blue-100 text-sm">Winner</p>
            <p className="text-2xl font-bold flex items-center justify-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-300" />
              <span>{winner}</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTeamTable(team1, score1, winner === team1.name)}
        {renderTeamTable(team2, score2, winner === team2.name)}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Each player's fantasy score is determined by their best performance across the 3 games
          during this scoring period. Click on any player name to view their detailed stats.
        </p>
      </div>
    </div>
  )
}
