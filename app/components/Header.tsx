"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  onNavigate?: (path: string) => void;
  onMenuClick?: () => void;
  currentUser?: { email: string; role?: string; team?: string } | null;
}

export default function Header({ onNavigate, onMenuClick, currentUser }: HeaderProps) {
  const teamLabel =
    currentUser?.team ||
    (currentUser?.role === "commissioner" ? "Commissioner" : "Guest");

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 🏀 App Title */}
          <h1
            className="text-xl sm:text-2xl font-bold text-gray-800 cursor-pointer select-none"
            onClick={() => onNavigate && onNavigate("home")}
          >
            🏀 Fantasy BBALL
            <span className="text-gray-500 text-sm ml-2">– {teamLabel}</span>
          </h1>
        </div>

        {/* ☰ Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </header>
  );
}
