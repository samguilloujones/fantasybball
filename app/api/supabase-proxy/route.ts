import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"

// -----------------------------------------------------------------------------
//  SERVER-SIDE ADMIN CLIENT — allows access to Supabase Auth users
// -----------------------------------------------------------------------------
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// -----------------------------------------------------------------------------
//  GET HANDLER — used for reads (fetching data)
// -----------------------------------------------------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  let path = searchParams.get("path")

  if (!path) {
    return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 })
  }

  try {
    // 🧠 Handle Auth user requests
    if (path === "auth_users") {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      if (error) throw error
      return NextResponse.json(data.users)
    }

    // 🧠 Default: regular Supabase table fetch
    let selectClause = "*"
    const orderClauses: { column: string; ascending: boolean }[] = []

    // Extract embedded ?select= syntax
    if (path.includes("?select=")) {
      const [table, rawQuery] = path.split("?select=")
      path = table
      const decoded = decodeURIComponent(rawQuery || "")
      selectClause = decoded
    }

    // Collect all order parameters (supports multiple)
    const orderParams = searchParams.getAll("order")
    if (orderParams.length > 0) {
      for (const order of orderParams) {
        const parts = order.split(".")
        let column = parts.slice(0, -1).join(".") || order
        const direction = parts[parts.length - 1]
        const ascending = direction.toLowerCase() !== "desc"
        orderClauses.push({ column, ascending })
      }
    }

    // ✅ Build Supabase query
    let query = supabase.from(path).select(selectClause)
    for (const o of orderClauses) {
      query = query.order(o.column, { ascending: o.ascending })
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    console.error("Supabase Proxy GET Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// -----------------------------------------------------------------------------
//  POST HANDLER — used for inserts, updates, deletes (explicit action required)
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { path, action, data, match } = body

    if (!path || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 🧠 Handle Auth user creation
    if (path === "auth_users" && action === "insert") {
      const { email, password } = data
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password })
      if (error) throw error
      return NextResponse.json(created.user)
    }

    let result
    switch (action) {
      case "insert":
        result = await supabase.from(path).insert(data)
        break

      case "update":
        if (!match) {
          return NextResponse.json({ error: "Missing match criteria for update" }, { status: 400 })
        }
        result = await supabase.from(path).update(data).match(match)
        break

      case "delete":
        if (!match) {
          return NextResponse.json({ error: "Missing match criteria for delete" }, { status: 400 })
        }
        result = await supabase.from(path).delete().match(match)
        break

      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }

    const { data: resultData, error } = result
    if (error) throw error
    return NextResponse.json(resultData)
  } catch (err: any) {
    console.error("Supabase Proxy POST Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// -----------------------------------------------------------------------------
//  PATCH HANDLER — used for direct updates (Auth + DB tables)
// -----------------------------------------------------------------------------
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get("path")
    if (!path) {
      return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 })
    }

    const body = await req.json()

    // 🧠 Auth user updates (email/password)
    if (path === "auth_users") {
      const { id, email, password } = body
      if (!id) return NextResponse.json({ error: "Missing user ID" }, { status: 400 })

      const updates: any = {}
      if (email) updates.email = email
      if (password) updates.password = password

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates)
      if (error) throw error

      return NextResponse.json({ success: true, user: data.user })
    }

    // 🧠 Default table update logic
    const [table, filterString] = path.split("?")
    const match: Record<string, any> = {}

    if (filterString) {
      const filters = filterString.split("&")
      for (const f of filters) {
        const [key, value] = f.split("=eq.")
        if (key && value) match[key] = value
      }
    }

    const { data, error } = await supabase.from(table).update(body).match(match)
    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    console.error("Supabase Proxy PATCH Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// -----------------------------------------------------------------------------
//  DELETE HANDLER — used for removing Auth users (or DB rows)
// -----------------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const { path } = Object.fromEntries(new URL(req.url).searchParams)
    const body = await req.json()
    const { id, match } = body

    if (path === "auth_users") {
      if (!id) return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // Default table deletion
    if (!path) return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 })
    if (!match) return NextResponse.json({ error: "Missing match criteria" }, { status: 400 })

    const { data, error } = await supabase.from(path).delete().match(match)
    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    console.error("Supabase Proxy DELETE Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
