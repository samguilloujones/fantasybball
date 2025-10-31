export interface Player {
  id: number
  first_name: string
  last_name: string
  position: string
  height: string
  weight: string
  jersey_number: string
  college: string
  country: string
  draft_year: number | null
  draft_round: number | null
  draft_number: number | null
  // team: {
  //   id: number
  //   conference: string
  //   division: string
  //   city: string
  //   name: string
  //   full_name: string
  //   abbreviation: string
  // }
}

export interface PlayerStats {
  pts: number
  reb: number
  ast: number
  fg_pct: number
  fg3_pct: number
  ft_pct: number
  games_played: number
}

export interface GameLog {
  id: number
  date: string
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  turnover: number
  min: string
  fgm: number
  fga: number
  fg_pct: number
  fg3m: number
  fg3a: number
  fg3_pct: number
  ftm: number
  fta: number
  ft_pct: number
}

/**
 * Fetch all players from our backend API
 * @param page - Page number for pagination
 * @param perPage - Number of results per page
 * @param search - Search query for player names
 */
export async function getAllPlayers(page = 1, perPage = 100, search = ""): Promise<{ data: Player[]; meta: any }> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  })

  if (search) {
    params.append("search", search)
  }

  // Call our backend API route instead of external API
  const response = await fetch(`/api/nba/players?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || error.details || "Failed to fetch players")
  }

  return response.json()
}

/**
 * Fetch a specific player by ID from our backend API
 * @param id - Player ID
 */
export async function getPlayerById(id: number): Promise<Player> {
  // Call our backend API route instead of external API
  const response = await fetch(`/api/nba/players/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || error.details || "Failed to fetch player")
  }

  return response.json()
}

/**
 * Search for a player by name from our backend API
 * @param firstName - Player's first name
 * @param lastName - Player's last name
 */
export async function getPlayerByName(firstName: string, lastName: string): Promise<Player | null> {
  try {
    const searchQuery = `${firstName} ${lastName}`
    const { data: players } = await getAllPlayers(1, 25, searchQuery)

    const player = players.find(
      (p) =>
        p.first_name.toLowerCase() === firstName.toLowerCase() && p.last_name.toLowerCase() === lastName.toLowerCase(),
    )

    return player || null
  } catch (error) {
    console.error("Error fetching player by name:", error)
    return null
  }
}

/**
 * Fetch player season averages from our backend API
 * @param playerId - Player ID
 * @param season - Season year (default: 2024)
 */
export async function getPlayerStats(playerId: number, season = 2024): Promise<PlayerStats> {
  // Call our backend API route instead of external API
  const response = await fetch(`/api/nba/stats/averages?player_id=${playerId}&season=${season}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || error.details || "Failed to fetch player stats")
  }

  return response.json()
}

/**
 * Fetch player game logs from our backend API
 * @param playerId - Player ID
 * @param season - Season year (default: 2024)
 */
export async function getPlayerGameLogs(playerId: number, season = 2024): Promise<GameLog[]> {
  // Call our backend API route instead of external API
  const response = await fetch(`/api/nba/stats/game-logs?player_id=${playerId}&season=${season}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || error.details || "Failed to fetch game logs")
  }

  return response.json()
}
