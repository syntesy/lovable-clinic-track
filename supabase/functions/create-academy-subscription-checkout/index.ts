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

    const { productId } = await req.json();
    if (!productId) throw new Error("productId is required");

    const { data: product, error: prodErr } = await supabase
      .from("academy_products")
      .select("*")
      .eq("id", productId)
      .eq("status", "published")
      .single();
    if (prodErr || !product) throw new Error("Product not found or not published");
    if (product.type !== "subscription") throw new Error("Product is not a subscription");
    if (!product.stripe_price_id) throw new Error("Subscription product has no Stripe price configured");

    // Check teacher Connect
    const { data: teacherProfile } = await supabase
      .from("academy_teacher_profiles")
      .select("*")
      .eq("user_id", product.teacher_id)
      .single();

    if (!teacherProfile || teacherProfile.stripe_onboarding_status !== "complete" || !teacherProfile.stripe_payouts_enabled) {
      throw new Error("Teacher has not completed Stripe onboarding");
    }

    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const origin = req.headers.get("origin") || "https://lovable-clinic-track.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/academy/minhas-compras?payment=success`,
      cancel_url: `${origin}/academy/marketplace/${productId}?payment=cancelled`,
      subscription_data: {
        application_fee_percent: 20,
        transfer_data: {
          destination: teacherProfile.stripe_account_id!,
        },
      },
      metadata: {
        product_id: productId,
        buyer_user_id: user.id,
        teacher_id: product.teacher_id,
        product_type: "subscription",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("create-academy-subscription-checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
