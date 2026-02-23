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

    // Wrap processing in try/catch for dead-letter
    try {
      await processEvent(event, stripe, supabase);
      await logEvent(supabase, event, null);
    } catch (processingError: unknown) {
      const errMsg = processingError instanceof Error ? processingError.message : "Unknown processing error";
      console.error(`Failed to process event ${event.id}:`, errMsg);

      // Store in dead-letter table
      await supabase.from("academy_webhook_failures").upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event.data?.object || {},
        error_message: errMsg,
        status: "failed",
      }, { onConflict: "stripe_event_id" });

      // Still return 200 to prevent Stripe from retrying (we handle retries ourselves)
      return ok(corsHeaders);
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

async function processEvent(event: Stripe.Event, stripe: Stripe, supabase: any) {
  // ===== CHECKOUT COMPLETED (one-time payments) =====
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    if (meta.product_type === "subscription") {
      await auditLog(supabase, null, "checkout_completed_subscription", "order", meta.order_id || null, { product_id: meta.product_id });
      return;
    }

    const orderId = meta.order_id;
    const productId = meta.product_id;
    const buyerUserId = meta.buyer_user_id;

    if (!orderId || !productId || !buyerUserId) {
      console.error("Missing metadata in checkout session");
      return;
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

    // Create or update enrollment (idempotent)
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

    await auditLog(supabase, buyerUserId, "purchase_completed", "order", orderId, { product_id: productId, amount_cents: session.amount_total });
    console.log(`Order ${orderId} paid, enrollment created for product ${productId}`);
  }

  // ===== CHARGE REFUNDED =====
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = charge.payment_intent as string;

    if (paymentIntentId) {
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

        await supabase
          .from("academy_enrollments")
          .update({ access_status: "refunded" })
          .eq("user_id", order.user_id)
          .eq("product_id", order.product_id)
          .eq("access_status", "active");

        await auditLog(supabase, order.user_id, "refund_confirmed", "order", order.id, { product_id: order.product_id });
        console.log(`Order ${order.id} refunded, enrollment revoked`);
      }
    }
  }

  // ===== DISPUTE CREATED =====
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId = dispute.payment_intent as string;

    if (paymentIntentId) {
      const { data: order } = await supabase
        .from("academy_orders")
        .select("*")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();

      if (order) {
        // Mark order as disputed
        await supabase
          .from("academy_orders")
          .update({ status: "disputed", updated_at: new Date().toISOString() })
          .eq("id", order.id);

        // Revoke enrollment
        await supabase
          .from("academy_enrollments")
          .update({ access_status: "canceled" })
          .eq("user_id", order.user_id)
          .eq("product_id", order.product_id)
          .eq("access_status", "active");

        // Record dispute
        await supabase.from("academy_disputes").upsert({
          order_id: order.id,
          stripe_dispute_id: dispute.id,
          status: "needs_response",
          amount_cents: dispute.amount || 0,
          currency: dispute.currency || "brl",
        }, { onConflict: "stripe_dispute_id" });

        await auditLog(supabase, order.user_id, "dispute_created", "order", order.id, { dispute_id: dispute.id });
        console.log(`Dispute ${dispute.id} created for order ${order.id}, enrollment revoked`);
      }
    }
  }

  // ===== DISPUTE CLOSED =====
  if (event.type === "charge.dispute.closed" || event.type === "charge.dispute.updated") {
    const dispute = event.data.object as Stripe.Dispute;

    const { data: existingDispute } = await supabase
      .from("academy_disputes")
      .select("*, academy_orders!inner(user_id, product_id)")
      .eq("stripe_dispute_id", dispute.id)
      .maybeSingle();

    if (existingDispute) {
      const newStatus = dispute.status === "won" ? "won" : dispute.status === "lost" ? "lost" : existingDispute.status;

      await supabase
        .from("academy_disputes")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", existingDispute.id);

      // If won, restore enrollment
      if (newStatus === "won" && existingDispute.academy_orders) {
        const ord = existingDispute.academy_orders;
        await supabase
          .from("academy_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", existingDispute.order_id);

        // Re-create enrollment
        const { data: existingEnroll } = await supabase
          .from("academy_enrollments")
          .select("id")
          .eq("user_id", ord.user_id)
          .eq("product_id", ord.product_id)
          .eq("access_status", "active")
          .maybeSingle();

        if (!existingEnroll) {
          await supabase.from("academy_enrollments").insert({
            user_id: ord.user_id,
            product_id: ord.product_id,
            access_status: "active",
          });
        }

        await auditLog(supabase, ord.user_id, "dispute_won", "order", existingDispute.order_id, { dispute_id: dispute.id });
      } else if (newStatus === "lost") {
        await auditLog(supabase, null, "dispute_lost", "order", existingDispute.order_id, { dispute_id: dispute.id });
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
      let resolvedProductId = meta.product_id;
      let resolvedUserId = meta.buyer_user_id;

      if (!resolvedProductId || !resolvedUserId) {
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

        await auditLog(supabase, resolvedUserId, "subscription_renewed", "subscription", subscriptionId, { product_id: resolvedProductId });
        console.log(`Subscription ${subscriptionId} active for product ${resolvedProductId}`);
      }
    }
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

      await auditLog(supabase, sub.user_id, "subscription_canceled", "subscription", subscription.id, { product_id: sub.product_id });
      console.log(`Subscription ${subscription.id} canceled, enrollment revoked`);
    }
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
  }
}

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

async function auditLog(supabase: any, userId: string | null, action: string, entityType: string, entityId: string | null, metadata?: any) {
  try {
    await supabase.from("academy_audit_log").insert({
      actor_user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
    });
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
}
