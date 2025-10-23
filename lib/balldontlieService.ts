// lib/balldontlieService.ts
const V1_BASE = "https://api.balldontlie.io/v1";
const V2_BASE = "https://api.balldontlie.io/v2";
const API_KEY = process.env.BALLDONTLIE_API_KEY;

// --- Generic fetch wrapper with v2 → v1 fallback ---
async function fetchAPI(path: string, version: "v1" | "v2" = "v2"): Promise<any> {
  const base = version === "v2" ? V2_BASE : V1_BASE;

  const headers: Record<string, string> = {};
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const res = await fetch(`${base}/${path}`, { headers });

  if (!res.ok) {
    if (version === "v2") {
      console.warn(`⚠️ v2 failed (${res.status}) — retrying v1`);
      return fetchAPI(path, "v1");
    }
    throw new Error(`BallDontLie error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// --- Fetch all players (cursor-based pagination, resilient to rate limits) ---
export async function getAllPlayers() {
  console.log("🏀 Fetching players from BallDontLie (cursor-based v1 w/ fallback)...");

  let players: any[] = [];
  let cursor: number | null = 0;
  const perPage = 100;
  let pageCount = 0;

  while (true) {
    const url = cursor
      ? `players?per_page=${perPage}&cursor=${cursor}`
      : `players?per_page=${perPage}`;
    try {
      const data = await fetchAPI(url, "v1");
      if (!data?.data?.length) break;

      players.push(...data.data);
      pageCount++;
      cursor = data.meta?.next_cursor;

      console.log(`✅ Fetched ${players.length} total players (cursor=${cursor || "end"})`);

      if (!cursor) break;

      // Respect rate limits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err: any) {
      if (err.message.includes("429")) {
        console.warn("⏳ Rate limit hit – waiting 20s before retrying...");
        await new Promise((r) => setTimeout(r, 20000));
      } else {
        console.error("❌ Fetch error:", err);
        break;
      }
    }
  }

  return players;
}

// --- Fetch the last 10 seasons of PPG for a given player ---
export async function getPlayerSeasonAverages(playerId: number) {
  const currentSeason = new Date().getFullYear() - 1; // e.g. 2025–26 = 2025
  const startSeason = currentSeason - 9;
  const allSeasons: { season: number; pts: number | null }[] = [];

  console.log(`📈 Fetching 10-year PPG history for player ${playerId}...`);

  for (let year = startSeason; year <= currentSeason; year++) {
    try {
      const data = await fetchAPI(
        `season_averages?season=${year}&player_ids[]=${playerId}`,
        "v1"
      );
      const avg = data?.data?.[0];
      allSeasons.push({
        season: year,
        pts: avg ? avg.pts : null,
      });
    } catch (err) {
      console.warn(`⚠️ Failed to fetch season ${year} for player ${playerId}`);
      allSeasons.push({ season: year, pts: null });
    }

    // small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  return allSeasons.reverse(); // newest first
}

// --- Optional: fetch single player details (for debugging or UI detail) ---
export async function getPlayerById(playerId: number) {
  const data = await fetchAPI(`players/${playerId}`, "v1");
  return data;
}

// --- Optional: fetch all teams (for future league features) ---
export async function getAllTeams() {
  const data = await fetchAPI("teams", "v1");
  return data?.data || [];
}
