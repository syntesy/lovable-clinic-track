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
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: authError } = await supabaseAuth.auth.getClaims(token);
  if (authError || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }
  const userId = claims.claims.sub as string;

  // Check admin
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: isAdmin } = await supabase.rpc("is_academy_admin", { _user_id: userId });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  try {
    const { stripeEventId } = await req.json();
    if (!stripeEventId) {
      return new Response(JSON.stringify({ error: "stripeEventId required" }), { status: 400, headers: corsHeaders });
    }

    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500, headers: corsHeaders });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve event from Stripe
    const event = await stripe.events.retrieve(stripeEventId);

    // Remove existing payment event record so it can be reprocessed
    await supabase.from("academy_payment_events").delete().eq("stripe_event_id", stripeEventId);

    // Forward to webhook handler internally (call the same endpoint)
    const webhookUrl = `${supabaseUrl}/functions/v1/stripe-academy-webhook`;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(event),
    });

    const result = await response.json();

    // Mark as reprocessed in failures table
    await supabase
      .from("academy_webhook_failures")
      .update({ status: "reprocessed", retry_count: 1 })
      .eq("stripe_event_id", stripeEventId);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
