"use client";

import ScheduleManager from "@/app/components/ScheduleManager";

export default function ScheduleManagerPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">📅 Schedule Manager</h1>
        <ScheduleManager />
      </div>
    </main>
  );
}
