"use client";
import Scoreboard from "@/app/components/Scoreboard";

export default function ScoreboardPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">🏀 League Scoreboard</h1>
      <Scoreboard />
    </main>
  );
}
