import { createClient } from "@/lib/supabase/server";
import {
  fetchLibraryContent,
  fetchCreators,
  fetchAvailableTags,
} from "@/lib/library-queries";
import { DEFAULT_FILTERS } from "@/types/database";
import { LibraryView } from "@/components/library";

export default async function LibraryPage() {
  const supabase = await createClient();

  const [initialData, creators, availableTags] = await Promise.all([
    fetchLibraryContent(supabase, {
      filters: DEFAULT_FILTERS,
      sortField: "virality_score",
      sortDirection: "desc",
      page: 1,
    }),
    fetchCreators(supabase),
    fetchAvailableTags(supabase),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Content Library</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Browse, filter, and analyze your scraped content.
        </p>
      </div>

      <LibraryView
        initialData={initialData}
        creators={creators}
        availableTags={availableTags}
      />
    </div>
  );
}
