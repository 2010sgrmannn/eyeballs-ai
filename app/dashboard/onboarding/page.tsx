import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  // If reset=true, clear onboarding_completed_at so user can redo onboarding
  if (params.reset === "true") {
    await supabase
      .from("brand_profiles")
      .update({ onboarding_completed_at: null })
      .eq("user_id", user.id);
  } else {
    // If user already completed onboarding, redirect to dashboard
    const { data: profile } = await supabase
      .from("brand_profiles")
      .select("id, onboarding_completed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed_at) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <OnboardingFlow />
    </div>
  );
}
