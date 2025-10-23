"use client"

import { Crown, Waves as Vs, History } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Game {
  id: number
  team1: string
  score1: number
  team2: string
  score2: number
}

interface GameResultsProps {
  games: Game[]
  showWinner: boolean
  onGameClick: (game: Game) => void
  onHeadToHeadClick?: (team1: string, team2: string) => void
}

export default function GameResults({ games, showWinner, onGameClick, onHeadToHeadClick }: GameResultsProps) {
  // Find the highest score of the week for crown placement
  const highestScore = Math.max(...games.flatMap((game) => [game.score1, game.score2]))

  return (
    <div className="space-y-6">
      {games.map((game, index) => {
        const isTeam1Winner = game.score1 > game.score2
        const isTeam2Winner = game.score2 > game.score1
        const team1HasCrown = showWinner && game.score1 === highestScore
        const team2HasCrown = showWinner && game.score2 === highestScore

        return (
          <div key={game.id} className="bg-gray-50 rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Game Header */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Matchup {index + 1}</h3>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">{showWinner ? "Final" : "In Progress"}</div>
                  {onHeadToHeadClick && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onHeadToHeadClick(game.team1, game.team2)
                      }}
                      className="h-7 text-xs sm:text-sm"
                    >
                      <History className="h-3 w-3 mr-1" />
                      {window.innerWidth > 640 ? "H2H History" : ""}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Matchup Content */}
            <div
              className="p-4 md:p-6 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => onGameClick(game)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                {/* Team 1 */}
                <div className="flex-1 sm:text-center">
                  <div className="mb-2 sm:mb-0">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{game.team1}</h4>
                    <div className="flex items-center justify-center space-x-2">
                      <span
                        className={`text-xl sm:text-2xl font-bold ${
                          showWinner && isTeam1Winner && !team1HasCrown ? "text-green-600" : "text-gray-700"
                        }`}
                      >
                        {game.score1}
                      </span>
                      {team1HasCrown && <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500 drop-shadow-sm" />}
                    </div>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="flex-shrink-0 mx-6 sm:mx-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <Vs className="h-5 w-5 sm:h-5 sm:w-5 text-gray-500" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">VS</span>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex-1 sm:text-center">
                  <div className="mb-2 sm:mb-0">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{game.team2}</h4>
                    <div className="flex items-center justify-center space-x-2">
                      <span
                        className={`text-xl sm:text-2xl font-bold ${
                          showWinner && isTeam2Winner && !team2HasCrown ? "text-green-600" : "text-gray-700"
                        }`}
                      >
                        {game.score2}
                      </span>
                      {team2HasCrown && <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500 drop-shadow-sm" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Winner Indicator */}
              {showWinner && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    {team1HasCrown || team2HasCrown ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500" />
                        <span className="text-sm sm:text-base font-medium text-yellow-600">
                          Week High Score: {team1HasCrown ? game.team1 : game.team2}
                        </span>
                        <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500" />
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base font-medium text-green-600">
                        Winner: {isTeam1Winner ? game.team1 : game.team2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Click hint */}
              <div className="mt-3 text-center">
                <span className="text-xs sm:text-sm text-gray-400">Click to view player details</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Week Summary */}
      {showWinner && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg sm:text-lg font-semibold text-yellow-800">Week High Score</h3>
              <Crown className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-yellow-700">
              <span className="font-bold">{highestScore} points</span> - The highest scoring team(s) this week earn the
              crown!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
