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

    console.log("Fetching game logs from Ball Don't Lie API:", url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BALLDONTLIE_API_KEY}`,
      },
      next: { revalidate: 180 }, // Cache for 3 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ball Don't Lie API Error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch game logs from external API", details: errorText, status: response.status },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data.data || [])
  } catch (error) {
    console.error("Error in game logs API route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
