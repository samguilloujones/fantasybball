import "dotenv/config";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// -----------------------------------------------------------------------------
//  Supabase setup
// -----------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔢 NBA Player ID mapping (you can extend this or load dynamically)
const NBA_ID_MAP = {
  curryst01: 201939, // Stephen Curry
  lebronj01: 2544,   // LeBron James
  doncilu01: 1629029, // Luka Doncic
  tatumja01: 1628369, // Jayson Tatum
  edwarda01: 1630162, // Anthony Edwards
};

const DELAY_MS = 800;

// -----------------------------------------------------------------------------
//  Fetch player stats through your own NBA proxy endpoint
// -----------------------------------------------------------------------------
async function fetchViaProxy(nbaId) {
  // 👇 Your deployed domain or local dev URL
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${base}/api/nba-proxy?playerId=${nbaId}`;

  try {
    const { data } = await axios.get(url, { timeout: 20000 });

    // Validate structure
    if (!data?.league?.standard?.regularSeason?.seasons) return [];

    const allSeasons = data.league.standard.regularSeason.seasons;

    const stats = allSeasons.map((s) => {
      const totals = s.total;
      return {
        season: parseInt(s.seasonYear),
        team: totals?.teamAbbreviation || "TOT",
        games_played: totals?.gamesPlayed || 0,
        ppg: totals?.ppg || 0,
        fg_pct: totals?.fgp ? totals.fgp / 100 : 0,
        three_pct: totals?.tpp ? totals.tpp / 100 : 0,
        ft_pct: totals?.ftp ? totals.ftp / 100 : 0,
      };
    });

    return stats.filter((s) => s.games_played > 0);
  } catch (err) {
    console.error(`❌ Proxy fetch failed for ${nbaId}: ${err.message}`);
    return [];
  }
}

// -----------------------------------------------------------------------------
//  Scrape stats for a single player and map for Supabase
// -----------------------------------------------------------------------------
async function scrapePlayerStats(playerId) {
  const nbaId = NBA_ID_MAP[playerId];
  if (!nbaId) {
    console.warn(`⚠️ Missing NBA ID for ${playerId}`);
    return [];
  }

  console.log(`📊 Fetching NBA stats via proxy for ${playerId} (${nbaId})`);

  const stats = await fetchViaProxy(nbaId);

  const mapped = stats.map((s) => ({
    player_id: playerId,
    season: s.season,
    team: s.team,
    position: null,
    games_played: s.games_played,
    ppg: s.ppg,
    fg_pct: s.fg_pct,
    three_pct: s.three_pct,
    ft_pct: s.ft_pct,
    updated_at: new Date().toISOString(),
  }));

  console.log(`✅ Parsed ${mapped.length} rows for ${playerId}`);
  return mapped;
}

// -----------------------------------------------------------------------------
//  Runner: single or full-league mode
// -----------------------------------------------------------------------------
async function run() {
  const single = process.argv[2];

  // ---------------------------------------------
  // Single-player test (e.g. "node ... curryst01")
  // ---------------------------------------------
  if (single) {
    console.log(`🚀 Running single-player test for ${single}\n`);
    const stats = await scrapePlayerStats(single);
    console.log(stats);
    return;
  }

  // ---------------------------------------------
  // Full sync (loop through all active players)
  // ---------------------------------------------
  console.log("🚀 Starting full NBA season-stats sync...\n");

  const { data: players, error } = await supabase
    .from("players")
    .select("id")
    .eq("active", true);

  if (error) throw error;

  for (const p of players) {
    const stats = await scrapePlayerStats(p.id);

    for (const s of stats) {
      const { error } = await supabase.from("player_season_stats").upsert(s, {
        onConflict: "player_id,season",
      });
      if (error)
        console.error(`❌ Upsert error for ${p.id}:`, error.message);
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("🎉 All players processed successfully!");
}

// -----------------------------------------------------------------------------
//  Run the script
// -----------------------------------------------------------------------------
run().catch((err) => console.error("💥 Fatal error:", err));
