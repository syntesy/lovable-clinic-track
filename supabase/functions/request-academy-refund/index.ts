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

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("academy_orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderErr || !order) throw new Error("Order not found");
    if (order.status !== "paid") throw new Error("Order is not eligible for refund");

    // Check 7-day window
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) throw new Error("Refund window of 7 days has expired");

    if (!order.stripe_payment_intent_id) throw new Error("No payment intent found for this order");

    // Create refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reason: "requested_by_customer",
    });

    console.log(`Refund created: ${refund.id} for order ${orderId}`);

    // Update order status immediately (webhook will also handle this)
    await supabase
      .from("academy_orders")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    // Revoke enrollment
    await supabase
      .from("academy_enrollments")
      .update({ access_status: "refunded" })
      .eq("user_id", user.id)
      .eq("product_id", order.product_id)
      .eq("access_status", "active");

    return new Response(JSON.stringify({ success: true, refundId: refund.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("request-academy-refund error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
