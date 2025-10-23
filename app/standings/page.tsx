"use client";
import Standings from "@/app/components/Standings";

export default function StandingsPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">📈 League Standings</h1>
      <Standings />
    </main>
  );
}
