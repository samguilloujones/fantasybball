"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/supabase-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid JSON response from server.");
      }

      if (!response.ok) {
        const msg =
          data?.error_description ||
          data?.message ||
          "Failed to sign in. Please check credentials.";
        throw new Error(msg);
      }

      console.log("✅ Login successful:", data);

      localStorage.setItem("supabase_token", data.access_token);
      router.push("/landing");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center mx-4">
        {/* Basketball Logo */}
        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-md 
                       transition-transform duration-700 ease-in-out hover:rotate-[360deg]"
          >
            🏀
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1 text-gray-900">
          Fantasy Basketball
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Welcome back! Please sign in to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=""
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=""
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
