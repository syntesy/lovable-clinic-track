import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  console.log("Starting create-mentorship-checkout function");

  // Create Supabase client
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    console.log(`User authenticated: ${user.email}`);

    // Parse request body
    const { mentorshipId, sessionId } = await req.json();
    
    if (!mentorshipId) {
      throw new Error("mentorshipId is required");
    }

    console.log(`Processing checkout for mentorship: ${mentorshipId}, session: ${sessionId || 'none'}`);

    // Fetch mentorship details
    const { data: mentorship, error: mentorshipError } = await supabaseClient
      .from('mentorships')
      .select('*, mentor:mentors(name)')
      .eq('id', mentorshipId)
      .single();

    if (mentorshipError || !mentorship) {
      console.error("Mentorship not found:", mentorshipError);
      throw new Error("Mentorship not found");
    }

    // Check if Stripe is configured
    if (!stripeSecretKey) {
      console.log("Stripe not configured - creating manual enrollment");
      
      // Create enrollment with pending_manual status
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from('mentorship_enrollments')
        .insert({
          user_id: user.id,
          mentorship_id: mentorshipId,
          session_id: sessionId || null,
          status: 'pending_manual',
          payment_status: 'pending_manual',
        })
        .select()
        .single();

      if (enrollmentError) {
        console.error("Error creating manual enrollment:", enrollmentError);
        throw new Error("Failed to create enrollment");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          manual: true,
          enrollmentId: enrollment.id,
          message: "Inscrição solicitada. Aguarde aprovação do administrador."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user has a Stripe customer record
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create line items
    let lineItems;
    
    if (mentorship.stripe_price_id) {
      // Use configured Stripe price
      lineItems = [{
        price: mentorship.stripe_price_id,
        quantity: 1,
      }];
    } else {
      // Create price on the fly
      lineItems = [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: mentorship.title,
            description: `Mentoria com ${mentorship.mentor?.name || 'Mentor'}`,
          },
          unit_amount: mentorship.price_cents,
        },
        quantity: 1,
      }];
    }

    // Create pending enrollment first
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('mentorship_enrollments')
      .insert({
        user_id: user.id,
        mentorship_id: mentorshipId,
        session_id: sessionId || null,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error("Error creating enrollment:", enrollmentError);
      throw new Error("Failed to create enrollment");
    }

    console.log(`Created pending enrollment: ${enrollment.id}`);

    // Create Stripe checkout session
    const origin = req.headers.get("origin") || "https://www.reghen.com.br";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/academy/minhas-mentorias?payment=success&enrollment=${enrollment.id}`,
      cancel_url: `${origin}/academy/mentorias/${mentorship.slug}?payment=cancelled`,
      metadata: {
        enrollment_id: enrollment.id,
        mentorship_id: mentorshipId,
        user_id: user.id,
        session_id: sessionId || '',
      },
    });

    // Update enrollment with stripe session id
    await supabaseClient
      .from('mentorship_enrollments')
      .update({ stripe_session_id: session.id })
      .eq('id', enrollment.id);

    console.log(`Created Stripe session: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        enrollmentId: enrollment.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-mentorship-checkout:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
