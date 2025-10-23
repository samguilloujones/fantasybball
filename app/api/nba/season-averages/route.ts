import { NextResponse } from "next/server"

const API_V1 = "https://www.balldontlie.io/api/v1"
const API_V2 = "https://api.balldontlie.io/v2"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const season = Number(searchParams.get("season"))
  const playerId = searchParams.get("playerId")

  if (!season || !playerId) {
    return NextResponse.json({ error: "Missing season or playerId" }, { status: 400 })
  }

  try {
    // Decide which version to call
    const isV2 = season >= 2024
    const base = isV2 ? API_V2 : API_V1
    const url = `${base}/season_averages?season=${season}&player_ids[]=${playerId}`

    const res = await fetch(url, {
      headers: isV2
        ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_BDL_API_KEY ?? ""}` }
        : {},
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`❌ BallDontLie fetch failed ${season} (${isV2 ? "v2" : "v1"}):`, res.status)
      return NextResponse.json({ error: `Bdl API ${res.status}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("🔥 Error fetching BallDontLie stats:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch" }, { status: 500 })
  }
}
