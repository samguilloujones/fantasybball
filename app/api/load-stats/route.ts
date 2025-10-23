import { NextResponse } from "next/server"

const BALLDONTLIE_BASE = "https://api.balldontlie.io/v1"
const CURRENT_SEASONS = [2024, 2025]
const API_KEY = process.env.BALLDONTLIE_API_KEY // optional

async function fetchAllStats(season: number) {
  let allStats: any[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `${BALLDONTLIE_BASE}/stats?seasons[]=${season}&per_page=${perPage}&page=${page}`
    const res = await fetch(url, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
    })
    if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`)
    const data = await res.json()
    allStats = allStats.concat(data.data)

    if (!data.meta || page >= data.meta.total_pages) break
    page++
  }

  return allStats
}

async function proxyUpsert(table: string, rows: any[]) {
  const res = await fetch(`/api/supabase-proxy?path=${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ upsert: rows }),
  })
  if (!res.ok) throw new Error(`Failed to upsert into ${table}: ${res.statusText}`)
}

async function proxyRpc(functionName: string, params?: Record<string, any>) {
  const url = `/api/supabase-proxy?path=rpc/${functionName}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  })
  if (!res.ok) throw new Error(`RPC ${functionName} failed: ${res.statusText}`)
}

export async function GET() {
  try {
    for (const season of CURRENT_SEASONS) {
      console.log(`📊 Fetching BallDonLie stats for ${season}`)
      const stats = await fetchAllStats(season)

      const formatted = stats
        .filter((s) => s.player && s.player.id)
        .map((s) => ({
          player_id: s.player.id,
          season,
          pts: s.pts,
          reb: s.reb,
          ast: s.ast,
          fg_pct: s.fg_pct,
          fg3_pct: s.fg3_pct,
          ft_pct: s.ft_pct,
          games_played: s.game ? 1 : null,
        }))

      console.log(`🧩 Upserting ${formatted.length} player_stats rows for ${season}`)
      await proxyUpsert("player_stats", formatted)

      console.log(`📈 Updating player_season_stats for ${season}`)
      await proxyRpc("update_player_season_stats", { season_param: season })
    }

    console.log(`🏀 Marking active players`)
    await proxyRpc("mark_active_players")

    return NextResponse.json({ success: true, message: "Stats synced successfully via proxy" })
  } catch (error: any) {
    console.error("❌ Error syncing stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
