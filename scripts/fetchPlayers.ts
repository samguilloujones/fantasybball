import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { getAllPlayers } from "../lib/balldontlieService";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("❌ Missing Supabase credentials in .env.local");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seedPlayers() {
  console.log("🌍 Environment verified");
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);
  console.log("🗝️ Using service_role key for DB writes.");

  const players = await getAllPlayers();
  console.log(`🧾 Total players fetched: ${players.length}`);

  if (!players.length) {
    console.error("❌ No players fetched. Check API key validity.");
    return;
  }

  const batchSize = 200;
  let totalUpserted = 0;

  for (let i = 0; i < players.length; i += batchSize) {
    const batch = players.slice(i, i + batchSize).map((p: any) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      full_name: `${p.first_name} ${p.last_name}`,
      position: p.position || null,
      team: p.team?.full_name || null,
      is_active: p.active ?? null,
    }));

    const { error } = await supabase.from("players").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
    } else {
      totalUpserted += batch.length;
      console.log(`✅ Upserted ${totalUpserted}/${players.length} players...`);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`🎉 Done! ${totalUpserted} total players upserted to Supabase.`);
}

seedPlayers().catch((err) => console.error("❌ Script failed:", err));
