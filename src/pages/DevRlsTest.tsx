import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TestResult {
  operation: string;
  success: boolean;
  data: unknown;
  error: string | null;
  timestamp: string;
}

export default function DevRlsTest() {
  const [attendanceId, setAttendanceId] = useState("");
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const addResult = (r: TestResult) =>
    setResults((prev) => [r, ...prev]);

  const testSelect = async () => {
    setLoading("select");
    const { data, error } = await supabase
      .from("attendance_previous_treatments")
      .select("*")
      .eq("attendance_id", attendanceId);
    addResult({
      operation: "SELECT",
      success: !error,
      data: data ?? [],
      error: error ? `${error.code}: ${error.message} — ${error.details}` : null,
      timestamp: new Date().toISOString(),
    });
    setLoading(null);
  };

  const testUpsert = async () => {
    setLoading("upsert");
    const payload = {
      attendance_id: attendanceId,
      treatments: ["Fisioterapia", "RLS-Test"],
      last_treatment_time_bucket: "menos_1_mes",
      details: { rls_test: true, ts: Date.now() },
    };
    const { data, error } = await supabase
      .from("attendance_previous_treatments")
      .upsert(payload, { onConflict: "attendance_id" })
      .select();
    addResult({
      operation: "UPSERT",
      success: !error,
      data: data ?? [],
      error: error ? `${error.code}: ${error.message} — ${error.details}` : null,
      timestamp: new Date().toISOString(),
    });
    setLoading(null);
  };

  const testUpdate = async () => {
    setLoading("update");
    const { data, error } = await supabase
      .from("attendance_previous_treatments")
      .update({ treatments: ["Updated-RLS-Test"], details: { updated: true, ts: Date.now() } })
      .eq("attendance_id", attendanceId)
      .select();
    addResult({
      operation: "UPDATE",
      success: !error,
      data: data ?? [],
      error: error ? `${error.code}: ${error.message} — ${error.details}` : null,
      timestamp: new Date().toISOString(),
    });
    setLoading(null);
  };

  const testDelete = async () => {
    setLoading("delete");
    const { data, error } = await supabase
      .from("attendance_previous_treatments")
      .delete()
      .eq("attendance_id", attendanceId)
      .select();
    addResult({
      operation: "DELETE",
      success: !error,
      data: data ?? [],
      error: error ? `${error.code}: ${error.message} — ${error.details}` : null,
      timestamp: new Date().toISOString(),
    });
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-foreground">🔒 RLS Test — attendance_previous_treatments</h1>
      <p className="text-sm text-muted-foreground">
        Usa o client anon/publishable (não service role). O usuário precisa estar logado.
      </p>

      <div className="flex gap-2">
        <Input
          placeholder="attendance_id (uuid)"
          value={attendanceId}
          onChange={(e) => setAttendanceId(e.target.value)}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={testSelect} disabled={!attendanceId || !!loading}>
          {loading === "select" ? "..." : "SELECT"}
        </Button>
        <Button size="sm" onClick={testUpsert} disabled={!attendanceId || !!loading}>
          {loading === "upsert" ? "..." : "UPSERT"}
        </Button>
        <Button size="sm" onClick={testUpdate} disabled={!attendanceId || !!loading}>
          {loading === "update" ? "..." : "UPDATE"}
        </Button>
        <Button size="sm" variant="destructive" onClick={testDelete} disabled={!attendanceId || !!loading}>
          {loading === "delete" ? "..." : "DELETE"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setResults([])}>
          Limpar
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((r, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-mono">{r.operation}</CardTitle>
                <Badge variant={r.success ? "default" : "destructive"} className="text-xs">
                  {r.success ? "OK" : "FAIL"}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(r.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {r.error && (
                <pre className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2 whitespace-pre-wrap">
                  {r.error}
                </pre>
              )}
              <pre className="text-xs text-foreground bg-muted p-2 rounded whitespace-pre-wrap max-h-48 overflow-auto">
                {JSON.stringify(r.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
