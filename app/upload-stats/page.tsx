"use client";

import { useState } from "react";
import Papa from "papaparse";
import Fuse from "fuse.js";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------
// CSV FORMAT EXAMPLE:
//
// Player,10/21/2025,10/22/2025,10/23/2025
// Stephen Curry,X,23,X
// Anthony Davis,X,22,X
// Brandon Ingram,X,16,X
// ---------------------------------------------------------

// 🧩 Helper: normalize header names and trim whitespace
const normalizeHeaders = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const cleanKey = key.trim().replace(/\s+/g, " ");
    newObj[cleanKey] = obj[key];
  }
  return newObj;
};

export default function UploadStats() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  // ---------------------------------------------------------
  // Handle file selection
  // ---------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setFile(e.target.files[0]);
  };

  // ---------------------------------------------------------
  // Parse CSV using PapaParse
  // ---------------------------------------------------------
  const handleParse = async () => {
    if (!file) return;
    setStatus("📊 Parsing CSV...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("🧩 CSV Headers:", results.meta.fields);
        console.log("🧩 First row sample:", results.data[0]);
        const data = results.data.map((r: any) => normalizeHeaders(r));
        await mapPlayersToIds(data);
      },
    });
  };

  // ---------------------------------------------------------
  // Fuzzy match CSV player names to players in Supabase
  // ---------------------------------------------------------
  const mapPlayersToIds = async (data: any[]) => {
    setStatus("🔍 Matching players...");
    const { data: players, error } = await supabase
      .from("players")
      .select("id, full_name");

    if (error) {
      setStatus(`❌ Failed to load players: ${error.message}`);
      return;
    }

    const fuse = new Fuse(players, { keys: ["full_name"], threshold: 0.3 });
    const parsed: any[] = [];

    data.forEach((rawRow) => {
      const row = normalizeHeaders(rawRow);
      const playerName =
        row["Player"] || row["Player Name"] || row["Name"] || row["player_name"];
      if (!playerName) return;

      Object.entries(row).forEach(([col, val]) => {
        if (col.match(/\d{2}\/\d{2}\/\d{4}/)) {
          const game_date = new Date(col.trim()).toISOString().slice(0, 10);
          const points =
            val === "X" || val === "" ? null : parseInt(val as string, 10);
          if (points !== null && !isNaN(points)) {
            const match = fuse.search(playerName)[0];
            parsed.push({
              player_name: playerName,
              player_id: match?.item?.id || null,
              game_date,
              points,
            });
          }
        }
      });
    });

    setPreview(parsed);
    setStatus(`✅ Found ${parsed.length} valid game entries`);
  };

  // ---------------------------------------------------------
  // Upload results via Supabase Proxy
  // ---------------------------------------------------------
  const handleUpload = async () => {
    const valid = preview.filter((r) => r.player_id);
    if (!valid.length) {
      setStatus("⚠️ No valid player matches found to upload.");
      return;
    }

    setStatus("🚀 Uploading via /api/supabase-proxy...");

    try {
      const response = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "player_game_stats",
          action: "insert",
          data: valid,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unknown upload error");

      setStatus(`✅ Uploaded ${valid.length} player stats successfully!`);
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus(`❌ Upload failed: ${err.message}`);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>📤 Upload Daily Player Stats (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} />

          <div className="flex gap-3">
            <Button onClick={handleParse}>Preview Matches</Button>
            <Button onClick={handleUpload} disabled={!preview.length}>
              Upload via Proxy
            </Button>
          </div>

          {status && <p className="text-sm mt-2">{status}</p>}

          {preview.length > 0 && (
            <div className="mt-4 border rounded bg-white p-3 max-h-80 overflow-y-auto text-xs">
              <p className="font-semibold mb-2">Preview (first 10 rows):</p>
              <pre>{JSON.stringify(preview.slice(0, 10), null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
