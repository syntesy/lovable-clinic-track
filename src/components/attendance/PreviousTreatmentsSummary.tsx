/**
 * Read-only summary of previous treatments for the attendance report.
 * Renders treatment labels, conditional details, and time bucket.
 */

const TREATMENT_LABELS: Record<string, string> = {
  PHYSIOTHERAPY: "Fisioterapia",
  NSAIDS: "AINEs",
  CORTICOSTEROID_IA: "Corticoide intra-articular",
  HYALURONIC_ACID: "Ácido hialurônico",
  ORTHOBIOLOGIC_PREV: "OrtoBiológico prévio",
  SHOCKWAVE: "Ondas de Choque",
  EPI: "Eletrólise Percutânea Intratissular",
  LASER: "Laser",
  SURGERY: "Cirurgia",
  NONE: "Nenhum",
  OTHER: "Outro",
};

const TIME_BUCKET_LABELS: Record<string, string> = {
  LT_1M: "< 1 mês",
  M1_3: "1–3 meses",
  M3_6: "3–6 meses",
  M6_12: "6–12 meses",
  Y1_2: "1–2 anos",
  GT_2Y: "> 2 anos",
  UNKNOWN: "Não sabe/não lembra",
};

const SHOCKWAVE_TYPE_LABELS: Record<string, string> = {
  FOCAL: "Focal",
  RADIAL: "Radial",
};

const LASER_INTENSITY_LABELS: Record<string, string> = {
  LOW: "Baixa intensidade",
  HIGH: "Alta intensidade",
};

const ORTHOBIOLOGIC_TYPE_LABELS: Record<string, string> = {
  PRP: "PRP",
  PRF: "PRF",
  BMAC: "BMAC",
  SVF: "SVF",
  EXOSOMES: "Exossomos",
  COMBINATION: "Combinação",
  OTHER: "Outro",
};

const EPI_US_GUIDED_LABELS: Record<string, string> = {
  YES: "Sim",
  NO: "Não",
  UNKNOWN: "Não informado",
};

const PHYSIO_TYPE_LABELS: Record<string, string> = {
  CONVENTIONAL: "Convencional",
  EXERCISE: "Exercício terapêutico estruturado",
  MANUAL: "Terapia manual",
  INVASIVE: "Fisioterapia invasiva",
  UNKNOWN: "Não informado",
};

const PHYSIO_DURATION_LABELS: Record<string, string> = {
  LT_4W: "< 4 semanas",
  M1_3: "1–3 meses",
  GT_3M: "> 3 meses",
  UNKNOWN: "Não informado",
};

interface PreviousTreatmentsData {
  treatments: string[];
  last_treatment_time_bucket: string | null;
  details: Record<string, unknown> | null;
}

interface PreviousTreatmentsSummaryProps {
  data: PreviousTreatmentsData | null | undefined;
}

export function PreviousTreatmentsSummary({ data }: PreviousTreatmentsSummaryProps) {
  if (!data || !data.treatments || data.treatments.length === 0) {
    return (
      <section className="mb-8 print:mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
          Tratamentos Prévios
        </h2>
        <p className="text-muted-foreground text-sm">
          Nenhum tratamento prévio registrado.
        </p>
      </section>
    );
  }

  const { treatments, last_treatment_time_bucket, details } = data;
  const d = (details ?? {}) as Record<string, Record<string, unknown>>;

  const shockwave = d.shockwave;
  const laser = d.laser;
  const orthoPrev = d.orthobiologic_prev;
  const epi = d.epi;
  const physio = d.physiotherapy;

  return (
    <section className="mb-8 print:mb-6">
      <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
        Tratamentos Prévios
      </h2>

      <ul className="space-y-2 print:text-sm">
        {treatments.map((t) => {
          const label = TREATMENT_LABELS[t] || t;
          const subItems: { label: string; value: string }[] = [];

          if (t === "PHYSIOTHERAPY" && physio) {
            const pType = physio.type as string | undefined;
            const pDur = physio.duration as string | undefined;
            if (pType && PHYSIO_TYPE_LABELS[pType]) {
              subItems.push({ label: "Tipo", value: PHYSIO_TYPE_LABELS[pType] });
            }
            if (pDur && PHYSIO_DURATION_LABELS[pDur]) {
              subItems.push({ label: "Duração", value: PHYSIO_DURATION_LABELS[pDur] });
            }
          }

          if (t === "SHOCKWAVE" && shockwave) {
            const sType = shockwave.type as string | undefined;
            if (sType && SHOCKWAVE_TYPE_LABELS[sType]) {
              subItems.push({ label: "Tipo", value: SHOCKWAVE_TYPE_LABELS[sType] });
            }
          }

          if (t === "LASER" && laser) {
            const lInt = laser.intensity as string | undefined;
            if (lInt && LASER_INTENSITY_LABELS[lInt]) {
              subItems.push({ label: "Intensidade", value: LASER_INTENSITY_LABELS[lInt] });
            }
          }

          if (t === "ORTHOBIOLOGIC_PREV" && orthoPrev) {
            const oType = orthoPrev.type as string | undefined;
            if (oType && ORTHOBIOLOGIC_TYPE_LABELS[oType]) {
              subItems.push({ label: "Tipo", value: ORTHOBIOLOGIC_TYPE_LABELS[oType] });
            }
            if (oType === "OTHER") {
              const oText = orthoPrev.other_text as string | undefined;
              if (oText) {
                subItems.push({ label: "Qual", value: oText });
              }
            }
          }

          if (t === "EPI" && epi) {
            const eGuided = epi.us_guided as string | undefined;
            if (eGuided && EPI_US_GUIDED_LABELS[eGuided]) {
              subItems.push({ label: "Guiada por US", value: EPI_US_GUIDED_LABELS[eGuided] });
            }
          }

          if (t === "OTHER") {
            const otherText = (details as Record<string, unknown>)?.other_text as string | undefined;
            if (otherText) {
              subItems.push({ label: "Descrição", value: otherText });
            }
          }

          return (
            <li key={t}>
              <span className="font-medium">• {label}</span>
              {subItems.length > 0 && (
                <ul className="ml-5 mt-1 space-y-0.5 text-muted-foreground">
                  {subItems.map((si) => (
                    <li key={si.label}>
                      {si.label}: {si.value}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {last_treatment_time_bucket && TIME_BUCKET_LABELS[last_treatment_time_bucket] && (
        <div className="mt-4 print:text-sm">
          <span className="text-muted-foreground font-medium">Tempo desde o último tratamento: </span>
          <span>{TIME_BUCKET_LABELS[last_treatment_time_bucket]}</span>
        </div>
      )}
    </section>
  );
}
