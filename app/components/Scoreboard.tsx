"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, History } from "lucide-react"

interface Team {
  id: string
  name: string
}

interface Matchup {
  id: string
  week_number: number
  game_number: number
  team_a: Team | null
  team_b: Team | null
  winner: Team | null
  scores: {
    team_id: string
    points: number
  }[]
}

// 🗓️ Static mock date ranges (can later come from Supabase)
const GAME_DATES: Record<number, { start: string; end: string }> = {
  1: { start: "2024-10-19", end: "2024-10-21" },
  2: { start: "2024-10-22", end: "2024-10-24" },
  3: { start: "2024-10-25", end: "2024-10-27" },
  4: { start: "2024-10-28", end: "2024-10-30" },
  5: { start: "2024-10-31", end: "2024-11-02" },
  6: { start: "2024-11-03", end: "2024-11-05" },
  7: { start: "2024-11-06", end: "2024-11-08" },
  8: { start: "2024-11-09", end: "2024-11-11" },
  9: { start: "2024-11-12", end: "2024-11-14" },
  10: { start: "2024-11-22", end: "2024-11-23" },
}

export default function Scoreboard() {
  const [matchups, setMatchups] = useState<Matchup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentGameIndex, setCurrentGameIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `/api/supabase-proxy?path=matchups?select=id,team_a_id(id,name),team_b_id(id,name),winner_id(id,name),scores(team_id,points),game_id(game_number,week_number)`
        )

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch matchups: ${res.statusText}\n${text}`)
        }

        const json = await res.json()

        // Handle Supabase proxy response shape
        const data = Array.isArray(json) ? json : json.data
        const apiError = json.error || null

        if (apiError) {
          throw new Error(apiError.message || "Unknown Supabase API error")
        }

        if (!Array.isArray(data)) {
          console.error("❌ Unexpected Supabase response:", json)
          throw new Error("Supabase proxy did not return an array")
        }

        const formatted: Matchup[] = data.map((m: any) => ({
          id: m.id,
          week_number: m.game_id?.week_number ?? 0,
          game_number: m.game_id?.game_number ?? 0,
          team_a: m.team_a_id ? { id: m.team_a_id.id, name: m.team_a_id.name } : null,
          team_b: m.team_b_id ? { id: m.team_b_id.id, name: m.team_b_id.name } : null,
          winner: m.winner_id ? { id: m.winner_id.id, name: m.winner_id.name } : null,
          scores: m.scores ?? [],
        }))

        setMatchups(formatted)
      } catch (err: any) {
        console.error("❌ Error fetching scoreboard:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 🧭 Loading / Error / Empty States
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading scoreboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading data: {error}
      </div>
    )
  }

  if (matchups.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 italic">
        No matchups found in the database.
      </div>
    )
  }

  // 🧮 Group matchups by week/game
  const grouped = matchups.reduce((acc, m) => {
    const key = `${m.week_number}-${m.game_number}`
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, Matchup[]>)

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [wA, gA] = a.split("-").map(Number)
    const [wB, gB] = b.split("-").map(Number)
    return wA - wB || gA - gB
  })

  const currentKey = sortedKeys[currentGameIndex]
  const currentMatchups = grouped[currentKey] || []
  const [currentWeek, currentGame] = currentKey
    ? currentKey.split("-").map(Number)
    : [0, 0]

  const handlePrev = () => setCurrentGameIndex((prev) => Math.max(prev - 1, 0))
  const handleNext = () => setCurrentGameIndex((prev) => Math.min(prev + 1, sortedKeys.length - 1))

  // 🗓️ Format date range
  const today = new Date()
  const gameDates = GAME_DATES[currentGame]
  const start = gameDates ? new Date(gameDates.start) : null
  const end = gameDates ? new Date(gameDates.end) : null

  const formattedRange =
    start && end
      ? `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : "Dates TBD"

  const isCurrent = start && end && today >= start && today <= end
  const seasonProgress = Math.round(((currentGameIndex + 1) / sortedKeys.length) * 100)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 🏀 Header */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-800">
              Game {currentGame}{" "}
              {isCurrent && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                  Current
                </span>
              )}
            </h1>
          </div>
          <div className="text-sm text-gray-500 mt-2 sm:mt-0">{formattedRange}</div>
        </div>

        {/* 🧭 Navigation */}
        <div className="mt-4 border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentGameIndex === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                currentGameIndex === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 font-medium text-sm">
              Current Game
            </div>

            <button
              onClick={handleNext}
              disabled={currentGameIndex === sortedKeys.length - 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                currentGameIndex === sortedKeys.length - 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full sm:w-1/3 mt-3 sm:mt-0">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Season Progress</span>
              <span>
                {currentGameIndex + 1}/{sortedKeys.length} ({seasonProgress}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-green-400 to-blue-500"
                style={{ width: `${seasonProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 🏆 Game Matchups */}
      <div className="space-y-5">
        {currentMatchups.map((m, idx) => {
          const scoreA = m.scores.find((s) => s.team_id === m.team_a?.id)?.points ?? 0
          const scoreB = m.scores.find((s) => s.team_id === m.team_b?.id)?.points ?? 0
          const winnerName = m.winner?.name || null

          return (
            <div
              key={m.id}
              className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-700 font-medium">Matchup {idx + 1}</h2>
                <button className="flex items-center gap-1 text-xs border border-gray-300 rounded-md px-2 py-1 text-gray-600 hover:bg-gray-50 transition">
                  <History className="w-4 h-4" /> H2H History
                </button>
              </div>

              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{m.team_a?.name ?? "TBD"}</p>
                  <p className="text-green-600 font-bold text-2xl mt-1">{scoreA}</p>
                </div>

                <div className="w-12 text-gray-400 font-medium">VS</div>

                <div className="flex-1">
                  <p className="font-semibold text-lg">{m.team_b?.name ?? "TBD"}</p>
                  <p className="text-green-600 font-bold text-2xl mt-1">{scoreB}</p>
                </div>
              </div>

              {winnerName && (
                <p className="text-center text-sm mt-4 text-green-600 font-medium">
                  Winner: {winnerName}
                </p>
              )}

              <p className="text-center text-xs text-gray-400 mt-1">
                Click to view player details
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
