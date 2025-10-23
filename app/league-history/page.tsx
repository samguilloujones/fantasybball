"use client";
import LeagueHistory from "@/app/components/LeagueHistory";

export default function LeagueHistoryPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">🏆 League History</h1>
      <LeagueHistory />
    </main>
  );
}
