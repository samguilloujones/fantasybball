"use client";

import {
  X,
  Home,
  CalendarDays,
  BarChart2,
  Users,
  Settings,
  Trophy,
  User,
  ListChecks,
  LineChart,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: (page?: string) => void;
  activePage?: string;
}

export default function Sidebar({ isOpen, onClose, activePage }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("supabase_token");
      router.push("/"); // redirect to login
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ✅ Everyone sees all menu items now
  const menuItems = [
    { name: "Home", icon: Home, path: "/landing" },
    { name: "Scoreboard", icon: CalendarDays, path: "/scoreboard" },
    { name: "Standings", icon: BarChart2, path: "/standings" },
    { name: "Rosters", icon: Users, path: "/rosters" },
    { name: "Players", icon: User, path: "/players" },
    { name: "Schedule Manager", icon: ClipboardList, path: "/schedule-manager" },
    { name: "League History", icon: Trophy, path: "/league-history" },
    { name: "Insights", icon: LineChart, path: "/insights" },
    { name: "Settings", icon: Settings, path: "/settings" },
    { name: "Owner Bios", icon: ListChecks, path: "/owner-bios" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose()}
          />

          {/* Slide-out Sidebar (from right) */}
          <motion.div
            className="fixed top-0 right-0 w-72 sm:w-80 h-full bg-black text-white shadow-lg z-50 flex flex-col justify-between"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h2 className="text-xl font-semibold">Menu</h2>
              <button onClick={() => onClose()}>
                <X className="h-5 w-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto">
              <ul className="p-4 space-y-3">
                {menuItems.map(({ name, icon: Icon, path }) => (
                  <li key={name}>
                    <button
                      onClick={() => router.push(path)}
                      className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${
                        activePage === path
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="text-sm font-medium">{name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Logout Button */}
            <div className="border-t border-gray-800 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-3 rounded-lg text-left hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3 text-gray-300" />
                <span className="text-sm font-medium text-gray-200">Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
