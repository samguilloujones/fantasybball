"use client";

import Players from "@/app/components/Players";

export default function PlayersPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">🏀 Available Players</h1>
        <Players onNavigate={() => {}} />
      </div>
    </main>
  );
}
