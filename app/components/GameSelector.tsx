"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GameSelectorProps {
  currentGame: number
  onGameSelect: (game: number) => void
}

const gameData = Array.from({ length: 65 }, (_, i) => {
  const gameNum = i + 1
  let status: "completed" | "current" | "in-progress" | "upcoming"

  if (gameNum < 10) {
    status = "completed"
  } else if (gameNum === 10) {
    status = "current"
  } else if (gameNum === 11) {
    status = "in-progress"
  } else {
    status = "upcoming"
  }

  const startDate = new Date(2024, 10, 4)
  const daysPerGame = Math.floor(170 / 65)
  const gameDate = new Date(startDate.getTime() + (gameNum - 1) * daysPerGame * 24 * 60 * 60 * 1000)
  const endDate = new Date(gameDate.getTime() + (daysPerGame - 1) * 24 * 60 * 60 * 1000)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const formatDate = (d: Date) => `${months[d.getMonth()]} ${d.getDate()}`

  return {
    game: gameNum,
    status,
    date: `${formatDate(gameDate)}-${formatDate(endDate)}`,
  }
})

export default function GameSelector({ currentGame, onGameSelect }: GameSelectorProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "current":
        return <Calendar className="h-4 w-4 text-blue-600" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "upcoming":
        return <Calendar className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
            Final
          </Badge>
        )
      case "current":
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Current</Badge>
      case "in-progress":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
            Live
          </Badge>
        )
      case "upcoming":
        return (
          <Badge variant="outline" className="text-gray-500 text-xs">
            Upcoming
          </Badge>
        )
      default:
        return null
    }
  }

  const currentGameData = gameData.find((game) => game.game === currentGame)

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
      {/* Current Game Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3">
          {currentGameData && getStatusIcon(currentGameData.status)}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-gray-800">Game {currentGame}</h2>
              {currentGameData && getStatusBadge(currentGameData.status)}
            </div>
            {currentGameData && (
              <p className="text-sm text-gray-600 mt-1 flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{currentGameData.date}</span>
              </p>
            )}
          </div>
        </div>

        {/* Game Selector Dropdown */}
        <div className="w-full sm:w-auto">
          <Select value={currentGame.toString()} onValueChange={(value) => onGameSelect(Number.parseInt(value))}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white">
              <SelectValue placeholder="Select game" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-white">
              {gameData.map((game) => (
                <SelectItem key={game.game} value={game.game.toString()} className="bg-white hover:bg-gray-50">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(game.status)}
                    <span className="font-medium">Game {game.game}</span>
                    {game.status === "current" && (
                      <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">Now</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onGameSelect(Math.max(1, currentGame - 1))}
          disabled={currentGame <= 1}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-md transition-colors font-medium"
        >
          ← Previous
        </button>

        <button
          onClick={() => onGameSelect(10)}
          className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors font-medium"
        >
          Current Game
        </button>

        <button
          onClick={() => onGameSelect(Math.min(65, currentGame + 1))}
          disabled={currentGame >= 65}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-md transition-colors font-medium"
        >
          Next →
        </button>

        {/* Season Progress */}
        <div className="ml-auto flex-1 min-w-[200px]">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Season Progress</span>
            <span>
              {currentGame}/65 ({((currentGame / 65) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentGame / 65) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
