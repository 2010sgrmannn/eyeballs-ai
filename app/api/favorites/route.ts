import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("content_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Favorites fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }

    const ids = (data ?? []).map((row) => row.content_id);
    return NextResponse.json({ ids });
  } catch (error) {
    console.error("Favorites API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content_id } = await request.json();
    if (!content_id) {
      return NextResponse.json(
        { error: "content_id is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("content_id", content_id)
      .maybeSingle();

    if (existing) {
      // Remove favorite
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("content_id", content_id);
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, content_id });

      if (error) {
        console.error("Favorite insert error:", error);
        return NextResponse.json(
          { error: "Failed to add favorite" },
          { status: 500 }
        );
      }
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Favorites API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
