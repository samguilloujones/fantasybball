// -----------------------------------------------------------------------------
// ✅ API ROUTE: /app/api/supabase-proxy
// Safe middle layer for Supabase access from client components
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// -----------------------------------------------------------------------------
// 🧠 GET HANDLER — handles reads with filters, ordering, and limits
// -----------------------------------------------------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 });
  }

  try {
    // Example: path=players?select=id,full_name,team&ilike=full_name.%25curry%25&limit=10
    const [table, queryString] = path.split("?");
    const params = new URLSearchParams(queryString);

    const select = params.get("select") || "*";
    let query = supabase.from(table).select(select);
    
    console.log(`query: ${JSON.stringify(query)}`)

    // Parse filters like season=eq.2025-2026 or full_name=ilike.%25curry%25
    for (const [key, value] of params.entries()) {
      if (["select", "order", "limit"].includes(key)) continue;

      // e.g. key = "season", value = "eq.2025-2026"
      if (value.startsWith("eq.")) {
        query = query.eq(key, value.replace("eq.", ""));
      } else if (value.startsWith("ilike.")) {
        query = query.ilike(key, value.replace("ilike.", ""));
      }
    }

    // Handle order=column.asc / column.desc
    if (params.get("order")) {
      const [column, direction] = params.get("order")!.split(".");
      query = query.order(column, { ascending: direction !== "desc" });
    }

    // Handle limit
    if (params.get("limit")) {
      const limitVal = Number(params.get("limit"));
      if (!isNaN(limitVal)) query = query.limit(limitVal);
    }

    const { data, error } = await query;
    console.log(`Data: ${JSON.stringify(error)}`)
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("❌ GET /supabase-proxy error:", err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// 🧱 POST HANDLER — handles insert, update, delete, and select operations
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const { path, action, data } = await req.json();

    if (!path || !action) {
      return NextResponse.json(
        { error: "Missing 'path' or 'action' in request body" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      // -----------------------------------------------------
      // INSERT
      // -----------------------------------------------------
      case "insert":
        result = await supabase.from(path).insert(data);
        break;

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------
      case "update":
        if (!data || !Array.isArray(data) || data.length === 0) {
          return NextResponse.json(
            { error: "Missing or invalid 'data' for update action" },
            { status: 400 }
          );
        }

        const updateRow = data[0];
        if (!updateRow.id) {
          return NextResponse.json(
            { error: "Missing 'id' field in update data" },
            { status: 400 }
          );
        }

        result = await supabase.from(path).update(updateRow).eq("id", updateRow.id);
        break;

      // -----------------------------------------------------
      // DELETE
      // -----------------------------------------------------
      case "delete":
        result = await supabase.from(path).delete().match(data);
        break;

      // -----------------------------------------------------
      // SELECT (Safe server-side select via POST)
      // -----------------------------------------------------
      case "select":
        result = await supabase.from(path).select("*").match(data);
        break;

      // -----------------------------------------------------
      // DEFAULT
      // -----------------------------------------------------
      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    console.error("❌ POST /supabase-proxy error:", err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
