import { createClient } from "@/lib/supabase/server";
import { fetchFolders } from "@/lib/library-queries";
import { CollectionsView } from "@/components/library/collections-view";

export default async function CollectionsPage() {
  const supabase = await createClient();

  let folders: Awaited<ReturnType<typeof fetchFolders>> = [];
  try {
    folders = await fetchFolders(supabase);
  } catch {
    // Tables may not exist yet
  }

  return (
    <div>
      <div className="mb-6">
        <h1
          style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700, color: "#E0E0E0" }}
        >
          Collections
        </h1>
        <p
          className="mt-1"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#888" }}
        >
          Your favorites and custom lists
        </p>
      </div>

      <CollectionsView initialFolders={folders} />
    </div>
  );
}
