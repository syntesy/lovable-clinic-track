// =========================================================
// REGENAPP EVIDENCE ENGINE™ - Batch Aggregation Function
// Computes aggregate statistics from Clinical Registry™
// READ-ONLY access to registry, APPEND-ONLY to evidence_*
// =========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// K-ANONYMITY THRESHOLD
const K_MIN = 10;

interface DimensionData {
  pathology_tag: string;
  technique_tag: string;
  region_tag: string | null;
}

interface AggregatedMetrics {
  n_cases_total: number;
  n_with_followup_30: number;
  n_with_followup_90: number;
  n_with_followup_180: number;
  n_with_followup_365: number;
  pain_baseline_mean: number | null;
  pain_baseline_median: number | null;
  pain_followup_90_mean: number | null;
  pain_followup_90_median: number | null;
  pct_improved_90: number | null;
}

// Normalize tag: UPPER + TRIM
function normalizeTag(tag: string | null): string {
  return (tag || '').trim().toUpperCase();
}

// Calculate median of an array
function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate mean of an array
function mean(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Round to 4 decimal places
function round4(n: number | null): number | null {
  return n !== null ? Math.round(n * 10000) / 10000 : null;
}

// Generate canonical hash for snapshot
async function generateCanonicalHash(data: Record<string, unknown>): Promise<string> {
  // Sort keys and create deterministic JSON
  const sortedKeys = Object.keys(data).sort();
  const canonicalObj: Record<string, unknown> = {};
  
  for (const key of sortedKeys) {
    const value = data[key];
    // Round decimals to 4 places
    if (typeof value === 'number' && !Number.isInteger(value)) {
      canonicalObj[key] = round4(value);
    } else if (value !== null && value !== undefined) {
      canonicalObj[key] = value;
    }
  }
  
  const jsonStr = JSON.stringify(canonicalObj);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(jsonStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user token for RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }).auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check admin role (governance level access)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (roleError || !roleData) {
      console.log(`[Evidence Engine] Access denied for user ${user.id} - no admin role`);
      return new Response(
        JSON.stringify({ error: "Acesso negado. Esta operação requer permissões de administrador." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[Evidence Engine] Access granted for admin user ${user.id}`);

    console.log(`[Evidence Engine] Starting batch computation by admin ${user.id}`);
    
    // Log batch start
    await supabaseAdmin.from('evidence_audit_log').insert({
      event_type: 'batch_started',
      user_id: user.id,
      metadata: { started_at: new Date().toISOString() },
    });

    const computedAt = new Date().toISOString();
    let dimensionsProcessed = 0;
    let snapshotsCreated = 0;

    // =========================================================
    // STEP 1: Get distinct dimensions from registry
    // =========================================================
    
    // Get all procedures with their baseline info
    const { data: procedures, error: procError } = await supabaseAdmin
      .from('registry_procedures')
      .select(`
        id,
        registry_case_id,
        procedure_type,
        procedure_date,
        registry_baseline!inner (
          primary_diagnosis,
          anatomical_region,
          initial_pain_score
        )
      `);

    if (procError) {
      console.error('[Evidence Engine] Error fetching procedures:', procError);
      throw procError;
    }

    console.log(`[Evidence Engine] Found ${procedures?.length || 0} procedures`);

    // Build dimension map from procedures
    const dimensionMap = new Map<string, { 
      pathology: string; 
      technique: string; 
      region: string | null;
      cases: Array<{
        registry_case_id: string;
        procedure_date: string;
        initial_pain_score: number | null;
      }>;
    }>();

    for (const proc of procedures || []) {
      // registry_baseline is returned as an array due to join, get first item
      const baselineArr = proc.registry_baseline as unknown as Array<{
        primary_diagnosis: string | null;
        anatomical_region: string | null;
        initial_pain_score: number | null;
      }>;
      
      const baseline = baselineArr?.[0];
      if (!baseline || !proc.procedure_type) continue;

      const pathology = normalizeTag(baseline.primary_diagnosis);
      const technique = normalizeTag(proc.procedure_type);
      const region = baseline.anatomical_region ? normalizeTag(baseline.anatomical_region) : null;
      
      // Skip empty pathology or technique
      if (!pathology || !technique) continue;

      const key = `${pathology}|${technique}|${region || ''}`;
      
      if (!dimensionMap.has(key)) {
        dimensionMap.set(key, {
          pathology,
          technique,
          region,
          cases: [],
        });
      }
      
      dimensionMap.get(key)!.cases.push({
        registry_case_id: proc.registry_case_id,
        procedure_date: proc.procedure_date,
        initial_pain_score: baseline.initial_pain_score,
      });
    }

    console.log(`[Evidence Engine] Found ${dimensionMap.size} unique dimensions`);

    // =========================================================
    // STEP 2: Process each dimension
    // =========================================================
    
    for (const [key, dimData] of dimensionMap) {
      console.log(`[Evidence Engine] Processing dimension: ${key}`);
      
      // Upsert dimension
      const { data: dimension, error: dimError } = await supabaseAdmin
        .from('evidence_dimensions')
        .upsert(
          {
            pathology_tag: dimData.pathology,
            technique_tag: dimData.technique,
            region_tag: dimData.region,
          },
          { onConflict: 'pathology_tag,technique_tag,region_tag' }
        )
        .select()
        .single();

      if (dimError) {
        console.error(`[Evidence Engine] Error upserting dimension ${key}:`, dimError);
        continue;
      }

      dimensionsProcessed++;

      // Get all case IDs for this dimension
      const caseIds = dimData.cases.map(c => c.registry_case_id);

      // =========================================================
      // STEP 3: Calculate metrics for all_time and last_12_months
      // =========================================================
      
      const timeWindows: Array<{ name: 'all_time' | 'last_12_months'; filter: (date: string) => boolean }> = [
        { 
          name: 'all_time', 
          filter: () => true 
        },
        { 
          name: 'last_12_months', 
          filter: (date: string) => {
            const procedureDate = new Date(date);
            const oneYearAgo = new Date();
            oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
            return procedureDate >= oneYearAgo;
          }
        },
      ];

      for (const tw of timeWindows) {
        // Filter cases by time window
        const filteredCases = dimData.cases.filter(c => tw.filter(c.procedure_date));
        const filteredCaseIds = filteredCases.map(c => c.registry_case_id);
        
        if (filteredCaseIds.length === 0) continue;

        // Fetch follow-ups for these cases
        const { data: followups, error: fupError } = await supabaseAdmin
          .from('registry_longitudinal_followups')
          .select('*')
          .in('registry_case_id', filteredCaseIds);

        if (fupError) {
          console.error(`[Evidence Engine] Error fetching followups:`, fupError);
          continue;
        }

        // Count follow-ups by timepoint
        const followupsByCase = new Map<string, Set<number>>();
        const followup90Scores: number[] = [];
        
        for (const fup of followups || []) {
          if (!followupsByCase.has(fup.registry_case_id)) {
            followupsByCase.set(fup.registry_case_id, new Set());
          }
          followupsByCase.get(fup.registry_case_id)!.add(fup.timepoint);
          
          // Collect D90 pain scores
          if (fup.timepoint === 90 && fup.pain_score !== null) {
            followup90Scores.push(fup.pain_score);
          }
        }

        // Calculate counts
        let n_with_30 = 0, n_with_90 = 0, n_with_180 = 0, n_with_365 = 0;
        
        for (const timepoints of followupsByCase.values()) {
          if (timepoints.has(30)) n_with_30++;
          if (timepoints.has(90)) n_with_90++;
          if (timepoints.has(180)) n_with_180++;
          if (timepoints.has(365)) n_with_365++;
        }

        // Calculate pain metrics
        const baselinePainScores = filteredCases
          .filter(c => c.initial_pain_score !== null)
          .map(c => c.initial_pain_score!);

        const metrics: AggregatedMetrics = {
          n_cases_total: filteredCaseIds.length,
          n_with_followup_30: n_with_30,
          n_with_followup_90: n_with_90,
          n_with_followup_180: n_with_180,
          n_with_followup_365: n_with_365,
          pain_baseline_mean: filteredCaseIds.length >= K_MIN ? round4(mean(baselinePainScores)) : null,
          pain_baseline_median: filteredCaseIds.length >= K_MIN ? round4(median(baselinePainScores)) : null,
          pain_followup_90_mean: filteredCaseIds.length >= K_MIN ? round4(mean(followup90Scores)) : null,
          pain_followup_90_median: filteredCaseIds.length >= K_MIN ? round4(median(followup90Scores)) : null,
          pct_improved_90: null,
        };

        // Calculate pct_improved_90 (pain reduction >= 2 points)
        if (filteredCaseIds.length >= K_MIN && followup90Scores.length > 0) {
          let improvedCount = 0;
          let eligibleCount = 0;
          
          for (const caseData of filteredCases) {
            if (caseData.initial_pain_score === null) continue;
            
            const caseFollowups = (followups || []).filter(
              f => f.registry_case_id === caseData.registry_case_id && f.timepoint === 90 && f.pain_score !== null
            );
            
            if (caseFollowups.length > 0) {
              eligibleCount++;
              const d90Pain = caseFollowups[0].pain_score;
              if (caseData.initial_pain_score - d90Pain >= 2) {
                improvedCount++;
              }
            }
          }
          
          if (eligibleCount > 0) {
            metrics.pct_improved_90 = round4((improvedCount / eligibleCount) * 100);
          }
        }

        // Get next version number
        const { data: versionData, error: versionError } = await supabaseAdmin
          .rpc('get_next_snapshot_version', {
            p_dimension_id: dimension.id,
            p_time_window: tw.name,
          });

        if (versionError) {
          console.error(`[Evidence Engine] Error getting version:`, versionError);
          continue;
        }

        const version = versionData || 1;

        // Generate canonical hash
        const hashData = {
          dimension_id: dimension.id,
          time_window: tw.name,
          version,
          computed_at: computedAt,
          ...metrics,
        };
        
        const canonicalHash = await generateCanonicalHash(hashData);

        // Insert snapshot (append-only)
        const { error: snapError } = await supabaseAdmin
          .from('evidence_snapshots')
          .insert({
            dimension_id: dimension.id,
            time_window: tw.name,
            ...metrics,
            computed_at: computedAt,
            version,
            canonical_hash: canonicalHash,
          });

        if (snapError) {
          console.error(`[Evidence Engine] Error inserting snapshot:`, snapError);
          continue;
        }

        snapshotsCreated++;

        // Log snapshot creation
        await supabaseAdmin.from('evidence_audit_log').insert({
          event_type: 'snapshot_computed',
          user_id: user.id,
          metadata: {
            dimension_id: dimension.id,
            time_window: tw.name,
            version,
            n_cases_total: metrics.n_cases_total,
          },
        });
      }
    }

    // Log batch completion
    await supabaseAdmin.from('evidence_audit_log').insert({
      event_type: 'batch_completed',
      user_id: user.id,
      metadata: {
        completed_at: new Date().toISOString(),
        dimensions_processed: dimensionsProcessed,
        snapshots_created: snapshotsCreated,
      },
    });

    console.log(`[Evidence Engine] Batch completed: ${dimensionsProcessed} dimensions, ${snapshotsCreated} snapshots`);

    return new Response(
      JSON.stringify({
        success: true,
        dimensionsProcessed,
        snapshotsCreated,
        computedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Evidence Engine] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
