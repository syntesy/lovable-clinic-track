import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown";
        console.error("Webhook signature verification failed:", errMsg);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: corsHeaders });
      }
    } else {
      event = JSON.parse(body);
      console.log("Warning: Processing without signature verification");
    }

    console.log(`Processing academy event: ${event.type} (${event.id})`);

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from("academy_payment_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ===== CHECKOUT COMPLETED (one-time payments) =====
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      if (meta.product_type === "subscription") {
        // Subscription enrollment handled via invoice.paid
        await logEvent(supabase, event, null);
        return ok(corsHeaders);
      }

      const orderId = meta.order_id;
      const productId = meta.product_id;
      const buyerUserId = meta.buyer_user_id;

      if (!orderId || !productId || !buyerUserId) {
        console.error("Missing metadata in checkout session");
        await logEvent(supabase, event, null);
        return ok(corsHeaders);
      }

      // Update order
      await supabase
        .from("academy_orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      // Get product for access policy
      const { data: product } = await supabase
        .from("academy_products")
        .select("access_policy, access_days")
        .eq("id", productId)
        .single();

      let accessExpiresAt: string | null = null;
      if (product?.access_policy === "time_limited" && product.access_days) {
        const d = new Date();
        d.setDate(d.getDate() + product.access_days);
        accessExpiresAt = d.toISOString();
      }

      // Create or update enrollment
      const { data: existingEnrollment } = await supabase
        .from("academy_enrollments")
        .select("id")
        .eq("user_id", buyerUserId)
        .eq("product_id", productId)
        .eq("access_status", "active")
        .maybeSingle();

      if (existingEnrollment) {
        await supabase
          .from("academy_enrollments")
          .update({ access_expires_at: accessExpiresAt })
          .eq("id", existingEnrollment.id);
      } else {
        await supabase
          .from("academy_enrollments")
          .insert({
            user_id: buyerUserId,
            product_id: productId,
            access_status: "active",
            access_expires_at: accessExpiresAt,
          });
      }

      await logEvent(supabase, event, orderId);
      console.log(`Order ${orderId} paid, enrollment created for product ${productId}`);
    }

    // ===== CHARGE REFUNDED =====
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      if (paymentIntentId) {
        // Find order
        const { data: order } = await supabase
          .from("academy_orders")
          .select("*")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (order) {
          await supabase
            .from("academy_orders")
            .update({ status: "refunded", updated_at: new Date().toISOString() })
            .eq("id", order.id);

          // Revoke enrollment
          await supabase
            .from("academy_enrollments")
            .update({ access_status: "refunded" })
            .eq("user_id", order.user_id)
            .eq("product_id", order.product_id)
            .eq("access_status", "active");

          await logEvent(supabase, event, order.id);
          console.log(`Order ${order.id} refunded, enrollment revoked`);
        }
      }
    }

    // ===== INVOICE PAID (subscriptions) =====
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const meta = subscription.metadata || {};
        const productId = meta.product_id;
        const buyerUserId = meta.buyer_user_id;

        // Also check checkout session metadata
        let resolvedProductId = productId;
        let resolvedUserId = buyerUserId;

        if (!resolvedProductId || !resolvedUserId) {
          // Try to find from existing subscription record
          const { data: existingSub } = await supabase
            .from("academy_subscriptions")
            .select("*")
            .eq("stripe_subscription_id", subscriptionId)
            .maybeSingle();

          if (existingSub) {
            resolvedProductId = existingSub.product_id;
            resolvedUserId = existingSub.user_id;
          }
        }

        if (resolvedProductId && resolvedUserId) {
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          // Upsert subscription record
          const { data: existingSub2 } = await supabase
            .from("academy_subscriptions")
            .select("id")
            .eq("user_id", resolvedUserId)
            .eq("product_id", resolvedProductId)
            .maybeSingle();

          if (existingSub2) {
            await supabase
              .from("academy_subscriptions")
              .update({
                stripe_customer_id: invoice.customer as string,
                stripe_subscription_id: subscriptionId,
                status: "active",
                current_period_end: periodEnd,
              })
              .eq("id", existingSub2.id);
          } else {
            await supabase
              .from("academy_subscriptions")
              .insert({
                user_id: resolvedUserId,
                product_id: resolvedProductId,
                stripe_customer_id: invoice.customer as string,
                stripe_subscription_id: subscriptionId,
                status: "active",
                current_period_end: periodEnd,
              });
          }

          // Create/update enrollment
          const { data: existingEnroll } = await supabase
            .from("academy_enrollments")
            .select("id")
            .eq("user_id", resolvedUserId)
            .eq("product_id", resolvedProductId)
            .eq("access_status", "active")
            .maybeSingle();

          if (existingEnroll) {
            await supabase
              .from("academy_enrollments")
              .update({ access_expires_at: periodEnd })
              .eq("id", existingEnroll.id);
          } else {
            await supabase
              .from("academy_enrollments")
              .insert({
                user_id: resolvedUserId,
                product_id: resolvedProductId,
                access_status: "active",
                access_expires_at: periodEnd,
              });
          }

          console.log(`Subscription ${subscriptionId} active for product ${resolvedProductId}`);
        }
      }

      await logEvent(supabase, event, null);
    }

    // ===== SUBSCRIPTION DELETED =====
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      const { data: sub } = await supabase
        .from("academy_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (sub) {
        await supabase
          .from("academy_subscriptions")
          .update({ status: "canceled" })
          .eq("id", sub.id);

        await supabase
          .from("academy_enrollments")
          .update({ access_status: "canceled" })
          .eq("user_id", sub.user_id)
          .eq("product_id", sub.product_id)
          .eq("access_status", "active");

        console.log(`Subscription ${subscription.id} canceled, enrollment revoked`);
      }

      await logEvent(supabase, event, null);
    }

    // ===== SUBSCRIPTION UPDATED =====
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      
      const { data: sub } = await supabase
        .from("academy_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (sub) {
        const newStatus = subscription.status === "active" ? "active"
          : subscription.status === "past_due" ? "past_due"
          : "canceled";

        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await supabase
          .from("academy_subscriptions")
          .update({ status: newStatus, current_period_end: periodEnd })
          .eq("id", sub.id);

        if (newStatus === "canceled") {
          await supabase
            .from("academy_enrollments")
            .update({ access_status: "canceled" })
            .eq("user_id", sub.user_id)
            .eq("product_id", sub.product_id)
            .eq("access_status", "active");
        }
      }

      await logEvent(supabase, event, null);
    }

    // ===== CHECKOUT EXPIRED =====
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("academy_orders")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", orderId);
      }
      await logEvent(supabase, event, orderId || null);
    }

    return ok(corsHeaders);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});

function ok(headers: Record<string, string>) {
  return new Response(JSON.stringify({ received: true }), {
    headers: { ...headers, "Content-Type": "application/json" }, status: 200,
  });
}

async function logEvent(supabase: any, event: any, orderId: string | null) {
  try {
    await supabase.from("academy_payment_events").insert({
      order_id: orderId,
      stripe_event_id: event.id,
      type: event.type,
      payload: event.data?.object || {},
    });
  } catch (e) {
    console.error("Failed to log event:", e);
  }
}
