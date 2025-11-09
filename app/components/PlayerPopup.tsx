"use client";

import { useState, useEffect } from "react";
import { X, Activity } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { type Player } from "@/lib/balldontlie-api";

interface PlayerPopupProps {
  player: Player;
  onClose: () => void;
}

export default function PlayerPopup({ player, onClose }: PlayerPopupProps) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (player?.id) loadAndCachePlayerStats();
  }, [player?.id]);

  const loadAndCachePlayerStats = async () => {
    if (!player?.id) return;
    setLoading(true);
    setError(null);

    const seasonsToFetch = [2024];
    const season = '2025-26';
    const playerName = `${player.first_name} ${player.last_name}`;

    try {
      const cachedSeasons: any[] = [];
      const missingSeasons: number[] = [];

      // 1️⃣ Check which seasons already exist in Supabase
      //Todo: This is getting a 500

      // 2️⃣ If all cached, no fetch required

      console.log("I am here")

      const res = await fetch(
        `/api/player-stats?player=${encodeURIComponent(playerName)}&season=${encodeURIComponent(season)}`,
        { 
          method: 'GET' // <-- EXPLICITLY set the method
        }
      );

      const playerData = await res.json();

      console.log(`Yo ${playerData.PLAYER_NAME}`)

      const fetchedSeasons: any[] = [];

      // 3️⃣ Fetch missing seasons using the right API (v1 or v2)
      for (const season of seasonsToFetch) {
        console.log("Get me some stats")
        const isV2 = season >= 2024;
        // const baseUrl = isV2
        //   ? "https://api.balldontlie.io/v2"
        //   : "https://www.balldontlie.io/api/v1";

        // const url = `${baseUrl}/season_averages?season=${season}&player_ids[]=${player.id}`;
        // const res = await fetch(url, {
        //   headers: isV2
        //     ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_BDL_API_KEY ?? ""}` }
        //     : {},
        // });

        if (!res.ok) {
          console.error(`❌ Fetch failed for ${season} (${isV2 ? "v2" : "v1"}):`, res.status);
          continue;
        }

        //const result = await res.json();
        //const seasonData = result?.data?.[0];
        //if (!seasonData) continue;

        const payload = {
          player_id: player.id,
          season,
          pts: (playerData.PTS / playerData.GP),
          fg_pct: playerData.FG_PCT ?? 0,
          fg3_pct: playerData.FG3_PCT ?? 0,
          ft_pct: playerData.FT_PCT ?? 0,
          games_played: playerData.GP ?? 0,
          last_updated: new Date().toISOString(),
        };

        fetchedSeasons.push(payload);

        // 4️⃣ Save results to Supabase through your proxy (safe for free tier)
      }

      // 5️⃣ Combine cached + fetched
      const allSeasons = [...cachedSeasons, ...fetchedSeasons].sort(
        (a, b) => b.season - a.season
      );
      setStats(allSeasons);
    } catch (err) {
      console.error("❌ Error loading player stats:", err);
      setError("Unable to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (!player) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-start sticky top-0 rounded-t-lg">
          <div className="flex-1 pr-8">
            <h2 className="text-xl font-bold text-gray-900">
              {player.first_name} {player.last_name}
            </h2>
            <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
              <span>{"Team"}</span>
              {player.jersey_number && (
                <>
                  <span>•</span>
                  <span>#{player.jersey_number}</span>
                </>
              )}
              {player.position && (
                <>
                  <span>•</span>
                  <span>{player.position}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 bg-white">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoCard label="Height" value={player.height || "Tall"} />
            <InfoCard label="Weight" value={player.weight ? `${player.weight} lbs` : "N/A"} />
            <InfoCard label="College" value={player.college || "N/A"} />
            <InfoCard label="Country" value={player.country || "USA"} />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Season Stats</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <ErrorBox message={error} />
            ) : stats.length > 0 ? (
              <StatsDisplay stats={stats} />
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No stats available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents (unchanged UI) ---------- */
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <p className="font-medium text-base">{message}</p>
      <p className="text-sm">Failed to load stats from server</p>
    </div>
  );
}

function StatsDisplay({ stats }: { stats: any[] }) {
  return (
    <div className="space-y-4">
      {stats.map((s) => (
        <div key={s.season} className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-3 text-base">
            {s.season} Season
          </h4>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <StatBox label="PPG" value={s.pts} color="blue" />
          </div>
          <div className="space-y-2">
            <PercentLine label="FG%" value={s.fg_pct} />
            <PercentLine label="3P%" value={s.fg3_pct} />
            <PercentLine label="FT%" value={s.ft_pct} />
          </div>
          <div className="mt-3 text-center text-sm text-gray-500">
            Games Played: {s.games_played || 0}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <div className={`p-4 rounded-lg text-center ${colorMap[color]} border`}>
      <p className={`text-sm mb-1 capitalize text-${color}-600`}>{label}</p>
      <p className="text-2xl font-bold">{value ? value.toFixed(1) : "0.0"}</p>
    </div>
  );
}

function PercentLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-base">
        {value ? (value * 100).toFixed(1) : "0.0"}%
      </span>
    </div>
  );
}
