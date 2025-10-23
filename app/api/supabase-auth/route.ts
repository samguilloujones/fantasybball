import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Handles POST for Supabase email/password login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json(); // <— ensures valid JSON
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Auth proxy error:", error);
    return NextResponse.json(
      { message: "Auth proxy failed", error: String(error) },
      { status: 500 }
    );
  }
}
