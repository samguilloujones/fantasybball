/**
 * scripts/scrapePlayers.js
 * -------------------------------------------------------
 * Scrapes all active NBA players from Basketball Reference.
 * Stores real Basketball Reference IDs for accurate linking.
 * -------------------------------------------------------
 */
import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Delay helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeActivePlayers() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const allPlayers = [];

  for (const letter of alphabet) {
    const url = `https://www.basketball-reference.com/players/${letter}/`;
    console.log(`🔍 Scraping ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "FantasyBBallBot/1.0 (+contact: admin@fantasybball.app)",
        },
      });

      const $ = cheerio.load(data);

      // Basketball Reference bolds active players
      $("strong a").each((_, el) => {
        const full_name = $(el).text().trim();
        const link = $(el).attr("href");
        const playerRefId = link.split("/")[3].replace(".html", ""); // e.g. curryst01

        allPlayers.push({
          id: playerRefId, // ✅ use the real ID
          full_name,
          active: true,
          created_at: new Date().toISOString(),
        });
      });

      console.log(`✅ Found ${allPlayers.length} players so far...`);
    } catch (err) {
      console.error(`❌ Error scraping ${url}:`, err.message);
    }

    await sleep(2000);
  }

  fs.writeFileSync("last_players_backup.json", JSON.stringify(allPlayers, null, 2));
  console.log(`🏀 Total active players scraped: ${allPlayers.length}`);
  return allPlayers;
}

async function upsertPlayers(players) {
  console.log(`📦 Uploading ${players.length} players to Supabase...`);
  const { error } = await supabase.from("players").upsert(players);
  if (error) console.error("❌ Supabase insert error:", error.message);
  else console.log(`✅ Successfully inserted/updated ${players.length} players.`);
}

(async () => {
  console.log("🚀 Starting Fantasy BBALL player scraper...");
  try {
    const players = await scrapeActivePlayers();
    await upsertPlayers(players);
    console.log("🎉 Scrape and upload complete!");
  } catch (err) {
    console.error("💥 Fatal error:", err);
  }
})();
