/**
 * Builds a deterministic topic_key from intervention + pathology.
 * No AI involved — pure normalization.
 *
 * Format: "INTERVENTION|pathologia normalizada"
 * e.g. "PRP|Artrose de joelho"
 */

const INTERVENTION_MAP: Record<string, string> = {
  prp: "PRP",
  "plasma rico em plaquetas": "PRP",
  prf: "PRF",
  "fibrina rica em plaquetas": "PRF",
  ha: "HA",
  "acido hialuronico": "HA",
  "ácido hialurônico": "HA",
  epi: "EPI",
  "eletrolise percutanea": "EPI",
  "eletrólise percutânea": "EPI",
  mac: "MAC",
  fotobiomodulacao: "MAC",
  fotobiomodulação: "MAC",
  laser: "LASER",
  "ondas de choque": "SHOCKWAVE",
  shockwave: "SHOCKWAVE",
  proloterapia: "PROLOTHERAPY",
  prolotherapy: "PROLOTHERAPY",
  "celulas tronco": "STEM_CELLS",
  "células-tronco": "STEM_CELLS",
  "stem cells": "STEM_CELLS",
  ortobiologico: "ORTHOBIOLOGIC",
  ortobiológico: "ORTHOBIOLOGIC",
};

function normalizeIntervention(raw: string): string {
  const cleaned = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  return INTERVENTION_MAP[cleaned] || raw.toUpperCase().trim().replace(/\s+/g, "_");
}

function normalizePathology(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    // Capitalize first letter
    .replace(/^./, (c) => c.toUpperCase());
}

export function buildTopicKey(
  interventionCode: string,
  pathologyLabel: string
): string {
  const intervention = normalizeIntervention(interventionCode);
  const pathology = normalizePathology(pathologyLabel);
  return `${intervention}|${pathology}`;
}

export function parseTopicKey(topicKey: string): {
  intervention: string;
  pathology: string;
} {
  const [intervention = "", pathology = ""] = topicKey.split("|", 2);
  return { intervention, pathology };
}
