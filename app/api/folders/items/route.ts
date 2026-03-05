import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folder_id, content_ids } = await request.json();
    if (!folder_id || !Array.isArray(content_ids) || content_ids.length === 0) {
      return NextResponse.json(
        { error: "folder_id and content_ids are required" },
        { status: 400 }
      );
    }

    if (content_ids.length > 100) {
      return NextResponse.json(
        { error: "content_ids cannot exceed 100 items" },
        { status: 400 }
      );
    }

    // Verify folder belongs to user
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folder_id)
      .eq("user_id", user.id)
      .single();

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Upsert items to avoid duplicates
    const rows = content_ids.map((content_id: string) => ({
      folder_id,
      content_id,
    }));

    const { error } = await supabase
      .from("folder_items")
      .upsert(rows, { onConflict: "folder_id,content_id", ignoreDuplicates: true });

    if (error) {
      console.error("Folder items insert error:", error);
      return NextResponse.json(
        { error: "Failed to add items to folder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Folder items API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folder_id, content_ids } = await request.json();
    if (!folder_id || !Array.isArray(content_ids) || content_ids.length === 0) {
      return NextResponse.json(
        { error: "folder_id and content_ids are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("folder_items")
      .delete()
      .eq("folder_id", folder_id)
      .in("content_id", content_ids);

    if (error) {
      console.error("Folder items delete error:", error);
      return NextResponse.json(
        { error: "Failed to remove items from folder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Folder items API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
