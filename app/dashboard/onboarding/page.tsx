import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandProfileForm } from "@/components/brand-profile-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If user already has a brand profile, redirect to dashboard
  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Set up your brand profile</h1>
        <p className="mt-2 text-neutral-400">
          Tell us about your brand so we can help you create better content.
        </p>
      </div>
      <BrandProfileForm mode="onboarding" />
    </div>
  );
}
