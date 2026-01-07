import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportFilters {
  startMonth?: string;
  endMonth?: string;
  therapyItemCode?: string;
  procedureType?: string;
}

interface RequestBody {
  action?: "export" | "preview" | "snapshot";
  filters?: ExportFilters;
  exportLogId?: string; // For replay
  snapshotTitle?: string; // For snapshot creation
}

async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

// deno-lint-ignore no-explicit-any
async function buildQuery(supabase: any, filters: ExportFilters) {
  let baseQuery = supabase.from("registry_research_export_v1").select("*");

  if (filters.startMonth) {
    baseQuery = baseQuery.gte("procedure_date", `${filters.startMonth}-01`);
  }
  if (filters.endMonth) {
    const [year, month] = filters.endMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    baseQuery = baseQuery.lte("procedure_date", `${filters.endMonth}-${lastDay}`);
  }
  if (filters.therapyItemCode) {
    baseQuery = baseQuery.eq("therapy_item_code", filters.therapyItemCode);
  }
  if (filters.procedureType) {
    baseQuery = baseQuery.eq("technique_tag", filters.procedureType);
  }

  return baseQuery;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    let body: RequestBody = { action: "export", filters: {} };
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        // Default values
      }
    }

    const action = body.action || "export";
    const filters = body.filters || {};

    console.log(`[export-registry-research] User ${user.id} action: ${action}, filters:`, filters);

    // ============ PREVIEW ACTION ============
    if (action === "preview") {
      const query = await buildQuery(supabaseUser, filters);
      const { data: exportData, error: queryError } = await query;

      if (queryError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch data", details: queryError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rows = exportData || [];
      
      // Aggregate counts without showing individual data
      const byProcedureType: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      const byRegion: Record<string, number> = {};

      rows.forEach((row: Record<string, unknown>) => {
        // By procedure type
        const procType = String(row.technique_tag || "Não especificado");
        byProcedureType[procType] = (byProcedureType[procType] || 0) + 1;

        // By month
        const procDate = row.procedure_date as string | null;
        if (procDate) {
          const month = procDate.slice(0, 7); // YYYY-MM
          byMonth[month] = (byMonth[month] || 0) + 1;
        }

        // By region
        const region = String(row.region_tag || "Não especificado");
        byRegion[region] = (byRegion[region] || 0) + 1;
      });

      return new Response(
        JSON.stringify({
          totalRows: rows.length,
          byProcedureType,
          byMonth,
          byRegion,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ SNAPSHOT ACTION ============
    if (action === "snapshot") {
      const exportLogId = body.exportLogId;
      const snapshotTitle = body.snapshotTitle;

      if (!exportLogId) {
        return new Response(
          JSON.stringify({ error: "exportLogId is required for snapshot" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the export log
      const { data: logData, error: logError } = await supabaseAdmin
        .from("registry_exports_log")
        .select("*")
        .eq("id", exportLogId)
        .single();

      if (logError || !logData) {
        return new Response(
          JSON.stringify({ error: "Export log not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate snapshot code
      const { data: codeData, error: codeError } = await supabaseAdmin.rpc("generate_snapshot_code");
      
      if (codeError) {
        console.error("Error generating snapshot code:", codeError);
        return new Response(
          JSON.stringify({ error: "Failed to generate snapshot code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create snapshot
      const { data: snapshot, error: snapshotError } = await supabaseAdmin
        .from("research_export_snapshots")
        .insert({
          snapshot_code: codeData,
          created_by: user.id,
          export_log_id: exportLogId,
          export_hash: logData.export_hash,
          view_name: logData.export_name || "registry_research_export_v1",
          view_version: logData.view_version || "v1",
          filters_json: logData.filters_json,
          row_count: logData.row_count,
          title: snapshotTitle || null,
        })
        .select()
        .single();

      if (snapshotError) {
        console.error("Error creating snapshot:", snapshotError);
        return new Response(
          JSON.stringify({ error: "Failed to create snapshot", details: snapshotError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          snapshot: {
            id: snapshot.id,
            code: snapshot.snapshot_code,
            hash: snapshot.export_hash,
            rowCount: snapshot.row_count,
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ EXPORT ACTION ============
    const query = await buildQuery(supabaseUser, filters);
    const { data: exportData, error: queryError } = await query;

    if (queryError) {
      console.error("[export-registry-research] Query error:", queryError);
      
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

    const csvContent = toCSV(exportData || []);
    const exportHash = await generateHash(csvContent);

    const { data: logEntry, error: logError } = await supabaseAdmin
      .from("registry_exports_log")
      .insert({
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
      })
      .select("id")
      .single();

    if (logError) {
      console.error("[export-registry-research] Failed to log export:", logError);
    }

    const filename = `registry_research_export_${new Date().toISOString().slice(0, 10)}.csv`;
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Hash": exportHash,
        "X-Row-Count": String(rowCount),
        "X-Export-Log-Id": logEntry?.id || "",
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
