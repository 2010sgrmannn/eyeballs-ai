import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { creatorId } = await request.json();
    if (!creatorId) {
      return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
    }

    // Verify creator belongs to user
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("id", creatorId)
      .eq("user_id", user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Delete content_tags for all content belonging to this creator
    const { data: contentRows } = await supabase
      .from("content")
      .select("id")
      .eq("creator_id", creatorId);

    if (contentRows && contentRows.length > 0) {
      const contentIds = contentRows.map((r) => r.id);
      await supabase.from("content_tags").delete().in("content_id", contentIds);
    }

    // Delete content rows
    await supabase.from("content").delete().eq("creator_id", creatorId);

    // Delete creator
    await supabase.from("creators").delete().eq("id", creatorId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Creator delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete creator" },
      { status: 500 }
    );
  }
}

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
