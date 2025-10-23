"use client";

import { Zap, Activity } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-700 to-blue-900 text-white px-6 text-center relative overflow-hidden">
      {/* Hero Title */}
      <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-4">
        Fantasy Basketball
        <span className="block text-orange-400 mt-2">
          Unlike You’ve Ever Seen Before
        </span>
      </h1>

      {/* Subtext */}
      <p className="max-w-2xl text-blue-100 text-lg sm:text-xl mb-10">
        A basketball platform built on the core of basketball:{" "}
        <span className="font-semibold text-white">
          if you can’t score, you can’t win.
        </span>{" "}
        Points are the holy grail.
      </p>

      {/* Fun Data Tag */}
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-full text-sm text-blue-100 shadow-md hover:bg-white/20 transition">
        <Activity className="h-4 w-4 text-orange-400 animate-pulse" />
        <span>Powered by Real-Time NBA Data... well, kind of real-time lol</span>
      </div>

      {/* Decorative Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 text-center w-full max-w-3xl">
        <div className="bg-white/10 p-4 rounded-xl shadow-sm">
          <p className="text-3xl font-bold text-orange-400">10</p>
          <p className="text-sm text-blue-100">Active Teams</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl shadow-sm">
          <p className="text-3xl font-bold text-orange-400">65</p>
          <p className="text-sm text-blue-100">Games / Season</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl shadow-sm">
          <p className="text-3xl font-bold text-orange-400">100+</p>
          <p className="text-sm text-blue-100">NBA Players</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl shadow-sm">
          <p className="text-3xl font-bold text-orange-400">
            <Zap className="inline-block w-6 h-6" />
          </p>
          <p className="text-sm text-blue-100">99.9% Uptime</p>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1)_0,transparent_60%)] pointer-events-none" />
    </div>
  );
}
