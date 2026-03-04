import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type BulkAction = "delete" | "favorite" | "unfavorite" | "add_to_folder";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, content_ids, folder_id } = (await request.json()) as {
      action: BulkAction;
      content_ids: string[];
      folder_id?: string;
    };

    if (!action || !Array.isArray(content_ids) || content_ids.length === 0) {
      return NextResponse.json(
        { error: "action and content_ids are required" },
        { status: 400 }
      );
    }

    let affected = 0;

    switch (action) {
      case "delete": {
        // Delete content_tags first
        await supabase
          .from("content_tags")
          .delete()
          .in("content_id", content_ids);
        // Delete favorites
        await supabase
          .from("favorites")
          .delete()
          .in("content_id", content_ids);
        // Delete folder items
        await supabase
          .from("folder_items")
          .delete()
          .in("content_id", content_ids);
        // Delete content
        const { data } = await supabase
          .from("content")
          .delete()
          .in("id", content_ids)
          .eq("user_id", user.id)
          .select("id");
        affected = data?.length ?? 0;
        break;
      }

      case "favorite": {
        const rows = content_ids.map((content_id) => ({
          user_id: user.id,
          content_id,
        }));
        const { data } = await supabase
          .from("favorites")
          .upsert(rows, {
            onConflict: "user_id,content_id",
            ignoreDuplicates: true,
          })
          .select("id");
        affected = data?.length ?? content_ids.length;
        break;
      }

      case "unfavorite": {
        const { data } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .in("content_id", content_ids)
          .select("id");
        affected = data?.length ?? 0;
        break;
      }

      case "add_to_folder": {
        if (!folder_id) {
          return NextResponse.json(
            { error: "folder_id is required for add_to_folder action" },
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

        const rows = content_ids.map((content_id) => ({
          folder_id,
          content_id,
        }));
        const { data } = await supabase
          .from("folder_items")
          .upsert(rows, {
            onConflict: "folder_id,content_id",
            ignoreDuplicates: true,
          })
          .select("id");
        affected = data?.length ?? content_ids.length;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ ok: true, affected });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
