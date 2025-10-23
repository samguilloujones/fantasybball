import { NextResponse } from "next/server"

// Use environment variable for API key
const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY || process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("player_id")
    const season = searchParams.get("season") || "2024"

    if (!playerId) {
      return NextResponse.json({ error: "player_id is required" }, { status: 400 })
    }

    // Validate API key exists
    if (!BALLDONTLIE_API_KEY) {
      console.error("BALLDONTLIE_API_KEY is not configured")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const url = `https://api.balldontlie.io/v2/stats?player_ids=${playerId}&season=${season}&per_page=100`

    console.log("Fetching stats from Ball Don't Lie API:", url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BALLDONTLIE_API_KEY}`,
      },
      next: { revalidate: 180 }, // Cache for 3 minutes (stats change frequently)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ball Don't Lie API Error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch stats from external API", details: errorText, status: response.status },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Calculate averages from raw stats
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({
        pts: 0,
        reb: 0,
        ast: 0,
        fg_pct: 0,
        fg3_pct: 0,
        ft_pct: 0,
        games_played: 0,
      })
    }

    const stats = data.data
    const gamesPlayed = stats.length

    const totals = stats.reduce(
      (acc: any, game: any) => ({
        pts: acc.pts + (game.pts || 0),
        reb: acc.reb + (game.reb || 0),
        ast: acc.ast + (game.ast || 0),
        fgm: acc.fgm + (game.fgm || 0),
        fga: acc.fga + (game.fga || 0),
        fg3m: acc.fg3m + (game.fg3m || 0),
        fg3a: acc.fg3a + (game.fg3a || 0),
        ftm: acc.ftm + (game.ftm || 0),
        fta: acc.fta + (game.fta || 0),
      }),
      { pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0 },
    )

    const averages = {
      pts: gamesPlayed > 0 ? totals.pts / gamesPlayed : 0,
      reb: gamesPlayed > 0 ? totals.reb / gamesPlayed : 0,
      ast: gamesPlayed > 0 ? totals.ast / gamesPlayed : 0,
      fg_pct: totals.fga > 0 ? (totals.fgm / totals.fga) * 100 : 0,
      fg3_pct: totals.fg3a > 0 ? (totals.fg3m / totals.fg3a) * 100 : 0,
      ft_pct: totals.fta > 0 ? (totals.ftm / totals.fta) * 100 : 0,
      games_played: gamesPlayed,
    }

    return NextResponse.json(averages)
  } catch (error) {
    console.error("Error in stats averages API route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
