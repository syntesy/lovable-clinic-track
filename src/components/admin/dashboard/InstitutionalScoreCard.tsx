import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

/* ── Tier logic ─────────────────────────────────────────── */
interface TierInfo {
  tier: string;
  label: string;
}

function getTier(score: number): TierInfo {
  if (score >= 90) return { tier: "I", label: "Institutional Excellence" };
  if (score >= 80) return { tier: "II", label: "Advanced Practice" };
  if (score >= 70) return { tier: "III", label: "Standard Compliance" };
  return { tier: "IV", label: "Development Required" };
}

/* ── Types ──────────────────────────────────────────────── */
export interface ScoreDimension {
  axis: string;
  value: number;   // 0–100
  fullMark?: number;
}

export interface InstitutionalScoreCardProps {
  score: number;           // 0–100, may have decimals
  dimensions?: ScoreDimension[];
}

/* ── Component ──────────────────────────────────────────── */
export function InstitutionalScoreCard({
  score,
  dimensions = [],
}: InstitutionalScoreCardProps) {
  const [open, setOpen] = useState(false);
  const { tier, label } = getTier(score);
  const pct = Math.min(Math.max(score, 0), 100);

  const radarData = dimensions.map((d) => ({
    ...d,
    fullMark: d.fullMark ?? 100,
  }));

  return (
    <>
      {/* ── Main Card ─────────────────────────────────── */}
      <Card
        className="bg-card border-border cursor-pointer transition-shadow hover:shadow-lg"
        onClick={() => dimensions.length > 0 && setOpen(true)}
      >
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            {/* Score number */}
            <motion.p
              className="text-5xl md:text-6xl font-extralight tracking-tight text-foreground text-center md:text-left tabular-nums"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              {score.toFixed(1)}
            </motion.p>

            {/* Bar + tier */}
            <div className="flex-1 space-y-3">
              {/* Gradient bar */}
              <div className="relative h-2 w-full rounded-full overflow-hidden bg-secondary">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, hsl(220 60% 35%), hsl(174 42% 55%))",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>

              {/* Tier label */}
              <p className="text-sm tracking-widest uppercase text-muted-foreground">
                Tier {tier}
                <span className="ml-2 text-xs font-normal normal-case opacity-70">
                  — {label}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Drill-down Modal ──────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground tracking-wide">
              Institutional Score — Breakdown
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Score + tier recap */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-extralight text-foreground tabular-nums">
                {score.toFixed(1)}
              </span>
              <span className="text-sm tracking-widest uppercase text-muted-foreground">
                Tier {tier}
              </span>
            </div>

            {/* Radar chart */}
            {radarData.length > 0 && (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="hsl(220 20% 28%)" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "hsl(0 0% 50%)", fontSize: 10 }}
                    />
                    <Radar
                      dataKey="value"
                      stroke="hsl(174 42% 55%)"
                      fill="hsl(174 42% 55%)"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Breakdown table */}
            <div className="space-y-2">
              {radarData.map((d) => (
                <div
                  key={d.axis}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{d.axis}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {d.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
