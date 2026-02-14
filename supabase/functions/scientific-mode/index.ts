import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get current user from token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, psr_id, password } = body;

    if (!psr_id || !password || !action) {
      return new Response(
        JSON.stringify({ error: "psr_id, password e action são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["enable", "validate"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action deve ser 'enable' ou 'validate'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Re-authenticate user with password (server-side verification)
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: "Senha incorreta. Tente novamente." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user role (PROFESSIONAL or ADMIN)
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasPermission = roles?.some(
      (r: any) => r.role === "admin" || r.role === "professional"
    );

    if (!hasPermission) {
      return new Response(
        JSON.stringify({
          error: "Apenas profissionais ou administradores podem gerenciar o modo científico.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify psr belongs to user's clinic
    const { data: psr, error: psrError } = await adminClient
      .from("procedure_standard_records")
      .select("id, scientific_mode_enabled, scientific_badge_status, clinic_id")
      .eq("id", psr_id)
      .single();

    if (psrError || !psr) {
      return new Response(
        JSON.stringify({ error: "Registro não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify clinic ownership
    const { data: clinic } = await adminClient
      .from("clinics")
      .select("id")
      .eq("id", psr.clinic_id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!clinic) {
      return new Response(
        JSON.stringify({ error: "Acesso negado a este registro" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let updateData: Record<string, any>;
    let auditAction: string;

    if (action === "enable") {
      if (psr.scientific_mode_enabled) {
        return new Response(
          JSON.stringify({ error: "Modo científico já está ativado" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      updateData = {
        scientific_mode_enabled: true,
        scientific_badge_status: "DRAFT",
      };
      auditAction = "SCIENTIFIC_ENABLE";
    } else {
      // validate
      if (psr.scientific_badge_status !== "DRAFT") {
        return new Response(
          JSON.stringify({
            error: "Somente registros em DRAFT podem ser validados",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      updateData = {
        scientific_badge_status: "VALIDATED",
      };
      auditAction = "SCIENTIFIC_VALIDATE";
    }

    // Perform the update
    const { data: updatedPsr, error: updateError } = await adminClient
      .from("procedure_standard_records")
      .update(updateData)
      .eq("id", psr_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Write audit log
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: auditAction,
      table_name: "procedure_standard_records",
      record_id: psr_id,
      old_data: {
        scientific_mode_enabled: psr.scientific_mode_enabled,
        scientific_badge_status: psr.scientific_badge_status,
      },
      new_data: updateData,
      additional_info: { timestamp: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ success: true, data: updatedPsr }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
