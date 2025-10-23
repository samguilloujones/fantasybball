"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Login from "@/app/components/Login";
import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Check for existing session + listen for auth changes
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (session?.user) {
          setCurrentUser(session.user);
          setIsAuthenticated(true);
          await fetchTeamForUser(session.user.id);
        }
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
        fetchTeamForUser(session.user.id);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setTeamName(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ✅ Fetch team name using correct join (owners.team_id → teams.id)
  const fetchTeamForUser = async (userId: string) => {
    try {
      const res = await fetch(
        `/api/supabase-proxy?path=owners?select=team_id,teams(name)&user_id=eq.${userId}`
      );

      if (!res.ok) throw new Error("Failed to fetch team via proxy");

      const data = await res.json();

      if (data?.length > 0 && data[0]?.teams?.name) {
        setTeamName(data[0].teams.name);
      } else {
        console.warn("No team found for user:", userId);
        setTeamName("Unassigned");
      }
    } catch (err) {
      console.error("Error fetching team via proxy:", err);
      setTeamName(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTeamName(null);
  };

  const handleNavigate = (path: string) => {
    window.location.href = `/${path}`;
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // 🌀 Show spinner while checking session
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg animate-pulse">Loading...</p>
      </main>
    );
  }

  // 🧱 If not logged in — only show login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <Login />
      </main>
    );
  }

  // 🏀 Logged in — show header, sidebar, and welcome page
  return (
    <main className="min-h-screen bg-gray-100 relative">
      <Header
        onNavigate={handleNavigate}
        onMenuClick={toggleSidebar}
        currentUser={{ ...currentUser, team: teamName }}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={(path) => {
          if (path) handleNavigate(path);
          setIsSidebarOpen(false);
        }}
      />
      <div className="flex flex-col items-center justify-center mt-24 text-center px-4">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            Welcome to Fantasy BBALL 🏀
          </h1>
          <p className="text-gray-600 mb-4">
            You’re logged in as{" "}
            <strong>{teamName || "Your Team"}</strong>.
          </p>
          <p className="text-gray-500">
            Use the sidebar to view your Scoreboard, Rosters, Standings, and more.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Log Out
          </button>
        </div>
      </div>
    </main>
  );
}
