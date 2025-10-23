import { NextResponse } from "next/server"

// Use environment variable for API key
const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY || process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Validate API key exists
    if (!BALLDONTLIE_API_KEY) {
      console.error("BALLDONTLIE_API_KEY is not configured")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    console.log("Fetching player details from Ball Don't Lie API for ID:", id)

    const response = await fetch(`https://api.balldontlie.io/v1/players/${id}`, {
      headers: {
        Authorization: `Bearer ${BALLDONTLIE_API_KEY}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ball Don't Lie API Error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch player from external API", details: errorText, status: response.status },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in player details API route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
