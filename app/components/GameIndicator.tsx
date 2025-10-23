"use client"

interface GameIndicatorProps {
  currentGame: number
  onGameClick: (game: number) => void
}

export default function GameIndicator({ currentGame, onGameClick }: GameIndicatorProps) {
  return (
    <div className="bg-white shadow-md p-4 mb-4 rounded-lg border-2 border-green-500">
      <div className="flex justify-between items-center">
        <button onClick={() => onGameClick(currentGame - 1)} className="text-lg text-gray-400">
          Game {currentGame - 1}
        </button>
        <button onClick={() => onGameClick(currentGame)} className="text-xl font-bold text-green-600">
          Game {currentGame}
        </button>
        <div className="flex flex-col items-center">
          <button onClick={() => onGameClick(currentGame + 1)} className="text-lg text-gray-400">
            Game {currentGame + 1}
          </button>
          {currentGame === 10 && <span className="text-xs text-green-600">current</span>}
        </div>
      </div>
    </div>
  )
}
