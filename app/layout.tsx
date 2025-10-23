"use client";

import { useState, useEffect, createContext } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export const RoleContext = createContext<string | null>(null);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleNavigate = (path?: string) => {
    if (path) window.location.href = `/${path.toLowerCase()}`;
    setIsSidebarOpen(false);
  };

  const isLoginPage = pathname === "/";

  useEffect(() => {
    let mounted = true;

    const adminEmails = ["samguilloujones@gmail.com", "sukalskibrian@gmail.com"];

    const checkUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        const user = session?.user;
        if (!user) return;

        const email = user.email?.toLowerCase() || "";
        const userId = user.id;

        // ✅ Assign role
        if (adminEmails.includes(email)) {
          setRole("admin");
        } else {
          setRole("basic");
        }

        // 🏀 Fetch team name via user_id instead of email
        const { data: owner, error: ownerError } = await supabase
          .from("owners")
          .select("team_id")
          .eq("user_id", userId)
          .single();

        if (ownerError) {
          console.error("Error fetching owner:", ownerError.message);
        } else if (owner?.team_id) {
          const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("name")
            .eq("id", owner.team_id)
            .single();

          if (!teamError && team?.name) {
            setTeamName(team.name);
          } else if (teamError) {
            console.error("Error fetching team:", teamError.message);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setRole("basic");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    // 🔁 Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      if (!user) return;

      const email = user.email?.toLowerCase() || "";
      const userId = user.id;

      if (adminEmails.includes(email)) {
        setRole("admin");
      } else {
        setRole("basic");
      }

      const { data: owner } = await supabase
        .from("owners")
        .select("team_id")
        .eq("user_id", userId)
        .single();

      if (owner?.team_id) {
        const { data: team } = await supabase
          .from("teams")
          .select("name")
          .eq("id", owner.team_id)
          .single();

        if (team?.name) {
          setTeamName(team.name);
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <html lang="en">
        <body className="bg-gradient-to-b from-blue-600 to-blue-700 min-h-screen flex items-center justify-center">
          <p className="text-white/90 text-sm animate-pulse">Loading user...</p>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen text-gray-900 antialiased">
        <RoleContext.Provider value={role}>
          {!isLoginPage && (
            <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-md">
              {/* Left side: logo and title */}
              <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  FB
                </div>
                Fantasy Basketball
              </h1>

              {/* Right side: team name + menu */}
              <div className="flex items-center gap-3">
                {teamName && (
                  <div className="flex items-center gap-2 bg-blue-600/70 hover:bg-blue-600 transition-colors px-3 py-1.5 rounded-full shadow-md">
                    {/* user icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white opacity-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A9 9 0 1118.878 6.195 9 9 0 015.12 17.804zM15 10a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-white tracking-wide">
                      {teamName}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleToggleSidebar}
                  className="p-2 rounded-md hover:bg-blue-600 transition"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6 text-white" />
                </button>
              </div>
            </header>
          )}

          {/* Sidebar */}
          {!isLoginPage && (
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={handleNavigate}
              activePage={pathname}
              userRole={role}
            />
          )}

          {/* Main content area */}
          <main className="p-6 sm:p-8 transition-all duration-300">{children}</main>
        </RoleContext.Provider>
      </body>
    </html>
  );
}
