import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAnthropicClient,
  analyzeContent,
  analyzeContentBatch,
} from "@/services/analyzer";
import type {
  ContentItem,
  CreatorInfo,
  AnalyzeResponse,
} from "@/types/content";

/**
 * POST /api/analyze
 *
 * Triggers AI analysis for unanalyzed content belonging to the authenticated user.
 *
 * Optional body params:
 *   - content_ids: string[] - specific content IDs to analyze (re-analyze)
 *   - limit: number - max items to analyze (default 50)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse optional body
    let contentIds: string[] | undefined;
    let limit = 50;

    try {
      const body = await request.json();
      if (Array.isArray(body.content_ids)) {
        contentIds = body.content_ids;
      }
      if (typeof body.limit === "number" && body.limit > 0) {
        limit = Math.min(body.limit, 200);
      }
    } catch {
      // Empty body is fine - analyze all unanalyzed content
    }

    // Create Anthropic client (validates API key)
    let anthropicClient;
    try {
      anthropicClient = createAnthropicClient();
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Failed to initialize AI client",
        },
        { status: 500 }
      );
    }

    // Fetch content to analyze
    let query = supabase
      .from("content")
      .select("*, creators!inner(follower_count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (contentIds && contentIds.length > 0) {
      // Re-analyze specific items
      query = query.in("id", contentIds);
    } else {
      // Only unanalyzed items
      query = query.is("analyzed_at", null);
    }

    const { data: contentRows, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch content: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!contentRows || contentRows.length === 0) {
      return NextResponse.json({
        analyzed: 0,
        errors: 0,
        results: [],
      } satisfies AnalyzeResponse);
    }

    // Process each content item
    const batchResults = await analyzeContentBatch(
      contentRows,
      async (row) => {
        const item = row as unknown as ContentItem & {
          creators: CreatorInfo;
        };
        const creator: CreatorInfo = item.creators ?? {
          follower_count: null,
        };

        const analysis = await analyzeContent(
          anthropicClient,
          item,
          creator
        );

        // Update content row with analysis results
        const { error: updateError } = await supabase
          .from("content")
          .update({
            transcript: analysis.transcript,
            hook_text: analysis.hook_text,
            cta_text: analysis.cta_text,
            virality_score: analysis.virality_score,
            analyzed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (updateError) {
          throw new Error(
            `Failed to update content ${item.id}: ${updateError.message}`
          );
        }

        // Delete existing tags for this content (for re-analysis)
        await supabase
          .from("content_tags")
          .delete()
          .eq("content_id", item.id);

        // Insert new tags
        if (analysis.tags.length > 0) {
          const { error: tagError } = await supabase
            .from("content_tags")
            .insert(
              analysis.tags.map((t) => ({
                content_id: item.id,
                tag: t.tag,
                category: t.category,
              }))
            );

          if (tagError) {
            throw new Error(
              `Failed to insert tags for content ${item.id}: ${tagError.message}`
            );
          }
        }

        return { success: true };
      }
    );

    // Build response
    const response: AnalyzeResponse = {
      analyzed: batchResults.filter((r) => r.success).length,
      errors: batchResults.filter((r) => !r.success).length,
      results: contentRows.map((row, i) => ({
        content_id: (row as { id: string }).id,
        ...batchResults[i],
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
