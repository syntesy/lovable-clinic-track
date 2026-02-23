import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
  const callerUserId = claims.claims.sub as string;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: isAdmin } = await supabase.rpc("is_academy_admin", { _user_id: callerUserId });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    const fixes: string[] = [];

    // 1. Orders 'paid' without active enrollment
    let ordersQuery = supabase.from("academy_orders").select("*").eq("status", "paid");
    if (userId) ordersQuery = ordersQuery.eq("user_id", userId);
    const { data: paidOrders = [] } = await ordersQuery;

    for (const order of paidOrders) {
      const { data: enrollment } = await supabase
        .from("academy_enrollments")
        .select("id")
        .eq("user_id", order.user_id)
        .eq("product_id", order.product_id)
        .eq("access_status", "active")
        .maybeSingle();

      if (!enrollment) {
        await supabase.from("academy_enrollments").insert({
          user_id: order.user_id,
          product_id: order.product_id,
          access_status: "active",
        });
        fixes.push(`Created missing enrollment for order ${order.id}`);
      }
    }

    // 2. Orders 'refunded' with active enrollment
    let refundQuery = supabase.from("academy_orders").select("*").eq("status", "refunded");
    if (userId) refundQuery = refundQuery.eq("user_id", userId);
    const { data: refundedOrders = [] } = await refundQuery;

    for (const order of refundedOrders) {
      const { data: activeEnroll } = await supabase
        .from("academy_enrollments")
        .select("id")
        .eq("user_id", order.user_id)
        .eq("product_id", order.product_id)
        .eq("access_status", "active")
        .maybeSingle();

      if (activeEnroll) {
        await supabase
          .from("academy_enrollments")
          .update({ access_status: "refunded" })
          .eq("id", activeEnroll.id);
        fixes.push(`Revoked enrollment for refunded order ${order.id}`);
      }
    }

    // 3. Subscriptions canceled with active enrollment
    let subQuery = supabase.from("academy_subscriptions").select("*").eq("status", "canceled");
    if (userId) subQuery = subQuery.eq("user_id", userId);
    const { data: canceledSubs = [] } = await subQuery;

    for (const sub of canceledSubs) {
      const { data: activeEnroll } = await supabase
        .from("academy_enrollments")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("product_id", sub.product_id)
        .eq("access_status", "active")
        .maybeSingle();

      if (activeEnroll) {
        await supabase
          .from("academy_enrollments")
          .update({ access_status: "canceled" })
          .eq("id", activeEnroll.id);
        fixes.push(`Expired enrollment for canceled subscription ${sub.id}`);
      }
    }

    // Log reconciliation
    await supabase.from("academy_audit_log").insert({
      actor_user_id: callerUserId,
      action: "reconciliation_run",
      entity_type: "system",
      entity_id: userId || "all",
      metadata: { fixes_count: fixes.length, fixes },
    });

    return new Response(JSON.stringify({ success: true, fixes_count: fixes.length, fixes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
