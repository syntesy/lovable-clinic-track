import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  console.log("Stripe webhook received");

  if (!stripeSecretKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return new Response(JSON.stringify({ error: "Stripe not configured" }), { 
      status: 500,
      headers: corsHeaders 
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-08-27.basil",
  });

  // Create Supabase client with service role for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Webhook signature verification failed:", errMessage);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { 
          status: 400,
          headers: corsHeaders 
        });
      }
    } else {
      // For development/testing without webhook secret
      event = JSON.parse(body);
      console.log("Warning: Processing webhook without signature verification");
    }

    console.log(`Processing event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log(`Checkout session completed: ${session.id}`);
      console.log(`Metadata:`, session.metadata);

      const enrollmentId = session.metadata?.enrollment_id;
      
      if (!enrollmentId) {
        console.error("No enrollment_id in session metadata");
        return new Response(JSON.stringify({ error: "Missing enrollment_id" }), { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Update enrollment status
      const { error: updateError } = await supabase
        .from('mentorship_enrollments')
        .update({
          status: 'active',
          payment_status: 'paid',
          stripe_payment_id: session.payment_intent as string,
        })
        .eq('id', enrollmentId);

      if (updateError) {
        console.error("Error updating enrollment:", updateError);
        throw new Error("Failed to update enrollment");
      }

      console.log(`Enrollment ${enrollmentId} marked as paid and active`);

      // If there's a session_id, update spots available
      const sessionId = session.metadata?.session_id;
      if (sessionId) {
        const { data: mentorshipSession } = await supabase
          .from('mentorship_sessions')
          .select('spots_available')
          .eq('id', sessionId)
          .single();

        if (mentorshipSession && mentorshipSession.spots_available !== null) {
          await supabase
            .from('mentorship_sessions')
            .update({ spots_available: Math.max(0, mentorshipSession.spots_available - 1) })
            .eq('id', sessionId);
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const enrollmentId = session.metadata?.enrollment_id;

      if (enrollmentId) {
        // Mark enrollment as expired
        await supabase
          .from('mentorship_enrollments')
          .update({
            status: 'expired',
            payment_status: 'expired',
          })
          .eq('id', enrollmentId);

        console.log(`Enrollment ${enrollmentId} marked as expired`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
