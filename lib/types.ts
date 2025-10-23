// lib/types.ts

export interface Owner {
  id: string
  name: string
  email: string
  team_id?: string | null
  created_at?: string
}

export interface Team {
  id: string
  name: string
  owner_id: string
  owner?: Owner | null
  created_at?: string
}
