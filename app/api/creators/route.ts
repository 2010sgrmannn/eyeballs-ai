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

    // Fetch creators with a count of their content rows
    const { data: creators, error } = await supabase
      .from("creators")
      .select("*")
      .eq("user_id", user.id)
      .order("scraped_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Creators fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch creators" },
        { status: 500 }
      );
    }

    // Fetch post counts for each creator
    const creatorIds = (creators ?? []).map((c) => c.id);
    let postCounts: Record<string, number> = {};

    if (creatorIds.length > 0) {
      const { data: counts, error: countError } = await supabase
        .from("content")
        .select("creator_id")
        .in("creator_id", creatorIds);

      if (!countError && counts) {
        postCounts = counts.reduce(
          (acc, row) => {
            acc[row.creator_id] = (acc[row.creator_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    }

    const creatorsWithCounts = (creators ?? []).map((creator) => ({
      ...creator,
      post_count: postCounts[creator.id] || 0,
    }));

    return NextResponse.json({ creators: creatorsWithCounts });
  } catch (error) {
    console.error("Creators API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
