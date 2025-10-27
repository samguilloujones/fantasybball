import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const target = `https://cdn.nba.com/static/json/player/${playerId}/playercareerstats.json`;

  try {
    console.log(`➡️ Fetching NBA CDN URL: ${target}`);

    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.70 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.nba.com/",
        "Origin": "https://www.nba.com",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`❌ NBA request failed (${res.status})`);
      const text = await res.text();
      return NextResponse.json(
        { error: `NBA request failed (${res.status})`, body: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log(`✅ Success for playerId ${playerId}`);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("💥 Proxy error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
