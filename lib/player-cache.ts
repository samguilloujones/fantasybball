import type { Player, SeasonAverage, Stats } from "./balldontlie-api"

interface CachedPlayer {
  data: Player
  timestamp: number
}

interface CachedStats {
  data: Stats[]
  timestamp: number
}

interface CachedSeasonAvg {
  data: SeasonAverage[]
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class PlayerCache {
  private players: Map<number, CachedPlayer> = new Map()
  private stats: Map<string, CachedStats> = new Map()
  private seasonAverages: Map<string, CachedSeasonAvg> = new Map()

  // Player caching
  getPlayer(playerId: number): Player | null {
    const cached = this.players.get(playerId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  setPlayer(playerId: number, data: Player) {
    this.players.set(playerId, {
      data,
      timestamp: Date.now(),
    })
  }

  // Stats caching
  getStats(playerId: number, startDate: string, endDate: string): Stats[] | null {
    const key = `${playerId}-${startDate}-${endDate}`
    const cached = this.stats.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  setStats(playerId: number, startDate: string, endDate: string, data: Stats[]) {
    const key = `${playerId}-${startDate}-${endDate}`
    this.stats.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  // Season averages caching
  getSeasonAverages(playerId: number, season: number): SeasonAverage[] | null {
    const key = `${playerId}-${season}`
    const cached = this.seasonAverages.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  setSeasonAverages(playerId: number, season: number, data: SeasonAverage[]) {
    const key = `${playerId}-${season}`
    this.seasonAverages.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  // Clear all cache
  clear() {
    this.players.clear()
    this.stats.clear()
    this.seasonAverages.clear()
  }

  // Clear expired cache entries
  clearExpired() {
    const now = Date.now()

    for (const [key, value] of this.players.entries()) {
      if (now - value.timestamp >= CACHE_DURATION) {
        this.players.delete(key)
      }
    }

    for (const [key, value] of this.stats.entries()) {
      if (now - value.timestamp >= CACHE_DURATION) {
        this.stats.delete(key)
      }
    }

    for (const [key, value] of this.seasonAverages.entries()) {
      if (now - value.timestamp >= CACHE_DURATION) {
        this.seasonAverages.delete(key)
      }
    }
  }
}

export const playerCache = new PlayerCache()

// Clear expired cache every 5 minutes
if (typeof window !== "undefined") {
  setInterval(
    () => {
      playerCache.clearExpired()
    },
    5 * 60 * 1000,
  )
}
