import { NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = JSON.stringify(body);

    console.log("Here")

    return new Promise((resolve) => {
      const process = spawn("python3", ["get_player_stats.py", input]);

      let output = "";
      process.stdout.on("data", (data) => (output += data.toString()));
      process.stderr.on("data", (data) => console.error("Python error:", data.toString()));

      process.on("close", () => {
        try {
          const parsed = JSON.parse(output);
          resolve(NextResponse.json(parsed));
        } catch {
          resolve(
            NextResponse.json({ error: "Failed to parse Python output" }, { status: 500 })
          );
        }
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
