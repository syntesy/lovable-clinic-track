/**
 * REGEN ENGINE - Motor Clínico em Camadas
 * 
 * Exportações públicas do motor.
 */

// Orquestrador principal
export { runRegenEngine, appendEngineOutputs, extractEngineOutputs } from "./orchestrator";

// Camadas individuais (para testes)
export { computeSafety } from "./safety-layer";
export { computeCRS } from "./crs-layer";
export { computeDIE, getValidLabsForBRS } from "./die-layer";
export { computeBRS } from "./brs-layer";
export { computeTOG } from "./tog-layer";
export { computePEE } from "./pee-layer";
