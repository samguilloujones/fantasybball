import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error in /api/supabase-proxy route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Optional GET route just to confirm API works in browser
export async function GET() {
  return NextResponse.json({ status: "supabase-proxy active" })
}

