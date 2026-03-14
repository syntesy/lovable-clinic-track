import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) throw new Error("User not authenticated");
    const user = userData.user;

    const { action } = await req.json();
    const origin = req.headers.get("origin") || "https://www.reghen.com.br";

    // Check if teacher profile exists
    const { data: existing } = await supabase
      .from("academy_teacher_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (action === "create" || !existing?.stripe_account_id) {
      // Create new Express account
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email!,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              delay_days: 7,
              interval: "daily",
            },
          },
        },
      });

      // Upsert teacher profile
      if (existing) {
        await supabase
          .from("academy_teacher_profiles")
          .update({
            stripe_account_id: account.id,
            stripe_onboarding_status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("academy_teacher_profiles")
          .insert({
            user_id: user.id,
            stripe_account_id: account.id,
            stripe_onboarding_status: "pending",
          });
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${origin}/academy/professor/dashboard?stripe=refresh`,
        return_url: `${origin}/academy/professor/dashboard?stripe=complete`,
        type: "account_onboarding",
      });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "refresh" || action === "status") {
      // Check account status
      const account = await stripe.accounts.retrieve(existing.stripe_account_id);
      const isComplete = account.details_submitted && account.charges_enabled;
      const newStatus = isComplete ? "complete" : account.details_submitted ? "restricted" : "pending";

      await supabase
        .from("academy_teacher_profiles")
        .update({
          stripe_onboarding_status: newStatus,
          stripe_payouts_enabled: account.payouts_enabled ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (action === "status") {
        return new Response(JSON.stringify({
          status: newStatus,
          payouts_enabled: account.payouts_enabled ?? false,
          charges_enabled: account.charges_enabled ?? false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      // Create new onboarding link if not complete
      if (!isComplete) {
        const accountLink = await stripe.accountLinks.create({
          account: existing.stripe_account_id,
          refresh_url: `${origin}/academy/professor/dashboard?stripe=refresh`,
          return_url: `${origin}/academy/professor/dashboard?stripe=complete`,
          type: "account_onboarding",
        });
        return new Response(JSON.stringify({ url: accountLink.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      return new Response(JSON.stringify({ status: "complete", message: "Already onboarded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("create-connect-account error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
