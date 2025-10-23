// app/api/player-stats/route.ts
import { NextResponse } from "next/server";

const BASE = "https://api.balldontlie.io/v1";
const API_KEY = process.env.BALLDONTLIE_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const currentSeason = new Date().getFullYear() - 1; // 2025 for 2025–26 season
  const startSeason = currentSeason - 9;
  const allSeasons: any[] = [];

  for (let year = startSeason; year <= currentSeason; year++) {
    try {
      const res = await fetch(
        `${BASE}/season_averages?season=${year}&player_ids[]=${playerId}`,
        {
          headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
        }
      );
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const avg = data?.data?.[0];
      allSeasons.push({
        season: year,
        pts: avg ? avg.pts : null,
      });
    } catch (err) {
      console.warn(`⚠️ Failed to fetch season ${year} for player ${playerId}`);
      allSeasons.push({ season: year, pts: null });
    }

    // brief delay to avoid hitting rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({ playerId, stats: allSeasons.reverse() });
}
