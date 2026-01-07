import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportFilters {
  startMonth?: string; // YYYY-MM
  endMonth?: string;   // YYYY-MM
  therapyItemCode?: string;
  procedureType?: string;
}

// Generate SHA256 hash of content
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Convert array of objects to CSV
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return String(val);
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client with user's JWT for RLS
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for logging (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user info
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin or research role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAccess = roles?.some((r) => r.role === "admin" || r.role === "research");
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Access denied. Requires admin or research role." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse filters from request body
    let filters: ExportFilters = {};
    if (req.method === "POST") {
      try {
        filters = await req.json();
      } catch {
        // No filters provided
      }
    }

    console.log(`[export-registry-research] User ${user.id} requesting export with filters:`, filters);

    // Build query for the research export view
    let query = supabaseUser.from("registry_research_export_v1").select("*");

    // Apply date filters
    if (filters.startMonth) {
      const startDate = `${filters.startMonth}-01`;
      query = query.gte("procedure_date", startDate);
    }
    if (filters.endMonth) {
      // Get last day of month
      const [year, month] = filters.endMonth.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${filters.endMonth}-${lastDay}`;
      query = query.lte("procedure_date", endDate);
    }

    // Apply other filters
    if (filters.therapyItemCode) {
      query = query.eq("therapy_item_code", filters.therapyItemCode);
    }
    if (filters.procedureType) {
      query = query.eq("technique_tag", filters.procedureType);
    }

    // Execute query
    const { data: exportData, error: queryError } = await query;

    if (queryError) {
      console.error("[export-registry-research] Query error:", queryError);
      
      // Log failed export
      await supabaseAdmin.from("registry_exports_log").insert({
        exported_by: user.id,
        exported_at: new Date().toISOString(),
        export_name: "registry_research_export_v1",
        view_version: "v1",
        filters_json: filters,
        row_count: 0,
        status: "fail",
        notes: queryError.message,
        user_agent: req.headers.get("user-agent") || null,
      });

      return new Response(
        JSON.stringify({ error: "Failed to fetch data", details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rowCount = exportData?.length || 0;
    console.log(`[export-registry-research] Fetched ${rowCount} rows`);

    // Generate CSV
    const csvContent = toCSV(exportData || []);
    
    // Calculate hash for integrity verification
    const exportHash = await generateHash(csvContent);

    // Log successful export
    const { error: logError } = await supabaseAdmin.from("registry_exports_log").insert({
      exported_by: user.id,
      exported_at: new Date().toISOString(),
      export_name: "registry_research_export_v1",
      view_version: "v1",
      filters_json: filters,
      row_count: rowCount,
      status: "success",
      export_hash: exportHash,
      export_format: "csv",
      user_agent: req.headers.get("user-agent") || null,
    });

    if (logError) {
      console.error("[export-registry-research] Failed to log export:", logError);
    }

    // Return CSV file
    const filename = `registry_research_export_${new Date().toISOString().slice(0, 10)}.csv`;
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Hash": exportHash,
        "X-Row-Count": String(rowCount),
      },
    });
  } catch (error) {
    console.error("[export-registry-research] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
