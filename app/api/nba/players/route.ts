import { NextResponse } from "next/server"

// Use environment variable for API key
const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY || process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = searchParams.get("page") || "1"
    const perPage = searchParams.get("per_page") || "100"

    // Validate API key exists
    if (!BALLDONTLIE_API_KEY) {
      console.error("BALLDONTLIE_API_KEY is not configured")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const url = new URL("https://api.balldontlie.io/v1/players")
    if (search) {
      url.searchParams.append("search", search)
    }
    url.searchParams.append("page", page)
    url.searchParams.append("per_page", perPage)

    console.log("Fetching players from Ball Don't Lie API:", url.toString())

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${BALLDONTLIE_API_KEY}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ball Don't Lie API Error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch players from external API", details: errorText, status: response.status },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in players API route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
