import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandProfileForm } from "@/components/brand-profile-form";
import type { BrandProfileFormData } from "@/types/brand-profile";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("niche, brand_voice, values, target_audience, content_style")
    .eq("user_id", user.id)
    .single();

  const initialData: BrandProfileFormData | undefined = profile
    ? {
        niche: profile.niche ?? "",
        brand_voice: profile.brand_voice ?? "",
        values: profile.values ?? [],
        target_audience: profile.target_audience ?? "",
        content_style: profile.content_style ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-neutral-400">
          Update your brand profile and preferences.
        </p>
      </div>
      <BrandProfileForm
        mode={initialData ? "edit" : "onboarding"}
        initialData={initialData}
      />
    </div>
  );
}
