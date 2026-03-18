import { describe, it, expect } from 'vitest';
import {
  classifyClinicalOutcome,
  CLINICAL_OUTCOME_LABELS,
  CLINICAL_OUTCOME_LABEL_UNAVAILABLE,
} from '../clinicalOutcomeClassification';

// ── Canonical examples from spec (section 13) ─────────────────────

describe('classifyClinicalOutcome — canonical examples', () => {
  it('Example 1: delta_eva=5, delta_ifn=4 → very_favorable', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 8, followup_eva: 3,
      baseline_ifn: 7, followup_ifn: 3,
    });
    expect(result.classification).toBe('very_favorable');
    expect(result.delta_eva).toBe(5);
    expect(result.delta_ifn).toBe(4);
    expect(result.reason).toBe('eva_only');
  });

  it('Example 2: delta_eva=3, delta_ifn=0 → favorable downgraded to partial', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 8, followup_eva: 5,
      baseline_ifn: 7, followup_ifn: 7,
    });
    expect(result.classification).toBe('partial');
    expect(result.delta_eva).toBe(3);
    expect(result.delta_ifn).toBe(0);
    expect(result.reason).toBe('eva_plus_ifn_downgrade');
  });

  it('Example 3: delta_eva=1, IFN improved → partial (never upgraded)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 6, followup_eva: 5,
      baseline_ifn: 6, followup_ifn: 4,
    });
    expect(result.classification).toBe('partial');
    expect(result.delta_eva).toBe(1);
    expect(result.delta_ifn).toBe(2);
    expect(result.reason).toBe('eva_only');
  });

  it('Example 4: delta_eva=0 → limited', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 7, followup_eva: 7,
    });
    expect(result.classification).toBe('limited');
    expect(result.delta_eva).toBe(0);
    expect(result.reason).toBe('eva_only');
  });

  it('Example 5: delta_eva=-1 (worsening) → limited', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 5, followup_eva: 6,
    });
    expect(result.classification).toBe('limited');
    expect(result.delta_eva).toBe(-1);
    expect(result.reason).toBe('eva_only');
  });

  it('Example 6: baseline_eva=null → classification null, reason unavailable_missing_eva', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: null, followup_eva: 4,
    });
    expect(result.classification).toBeNull();
    expect(result.reason).toBe('unavailable_missing_eva');
    expect(result.delta_eva).toBeNull();
    expect(result.delta_ifn).toBeNull();
  });

  it('Example 7: delta_eva=4, baseline_ifn=null → very_favorable, no IFN modifier', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 8, followup_eva: 4,
      baseline_ifn: null, followup_ifn: 5,
    });
    expect(result.classification).toBe('very_favorable');
    expect(result.delta_eva).toBe(4);
    expect(result.delta_ifn).toBeNull();
    expect(result.reason).toBe('eva_only');
  });
});

// ── EVA threshold boundaries ───────────────────────────────────────

describe('classifyClinicalOutcome — EVA primary thresholds', () => {
  it('delta_eva=4 → very_favorable', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 8, followup_eva: 4 }).classification)
      .toBe('very_favorable');
  });

  it('delta_eva=5 → very_favorable', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 9, followup_eva: 4 }).classification)
      .toBe('very_favorable');
  });

  it('delta_eva=3 → favorable', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 7, followup_eva: 4 }).classification)
      .toBe('favorable');
  });

  it('delta_eva=2 → favorable', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 6, followup_eva: 4 }).classification)
      .toBe('favorable');
  });

  it('delta_eva=1 → partial', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 5, followup_eva: 4 }).classification)
      .toBe('partial');
  });

  it('delta_eva=0 → limited', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 4, followup_eva: 4 }).classification)
      .toBe('limited');
  });

  it('delta_eva=-1 → limited', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 3, followup_eva: 4 }).classification)
      .toBe('limited');
  });

  it('delta_eva=-5 (large worsening) → limited', () => {
    expect(classifyClinicalOutcome({ baseline_eva: 2, followup_eva: 7 }).classification)
      .toBe('limited');
  });
});

// ── IFN downgrade behavior ─────────────────────────────────────────

describe('classifyClinicalOutcome — IFN downgrade', () => {
  it('very_favorable + delta_ifn<0 → favorable (downgraded)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 9, followup_eva: 4,    // delta_eva=5 → very_favorable
      baseline_ifn: 5, followup_ifn: 7,    // delta_ifn=-2 → worsening
    });
    expect(result.classification).toBe('favorable');
    expect(result.reason).toBe('eva_plus_ifn_downgrade');
    expect(result.delta_ifn).toBe(-2);
  });

  it('favorable + delta_ifn<0 → partial (downgraded)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 8, followup_eva: 5,    // delta_eva=3 → favorable
      baseline_ifn: 4, followup_ifn: 6,    // delta_ifn=-2 → worsening
    });
    expect(result.classification).toBe('partial');
    expect(result.reason).toBe('eva_plus_ifn_downgrade');
  });

  it('very_favorable + delta_ifn=0 → favorable (downgraded, boundary)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 9, followup_eva: 4,    // delta_eva=5 → very_favorable
      baseline_ifn: 6, followup_ifn: 6,    // delta_ifn=0 → no improvement
    });
    expect(result.classification).toBe('favorable');
    expect(result.reason).toBe('eva_plus_ifn_downgrade');
    expect(result.delta_ifn).toBe(0);
  });

  it('very_favorable + delta_ifn>0 → very_favorable (not downgraded)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 9, followup_eva: 4,    // delta_eva=5 → very_favorable
      baseline_ifn: 7, followup_ifn: 4,    // delta_ifn=3 → improvement
    });
    expect(result.classification).toBe('very_favorable');
    expect(result.reason).toBe('eva_only');
  });

  it('partial + delta_ifn<0 → partial (never downgraded from partial)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 5, followup_eva: 4,    // delta_eva=1 → partial
      baseline_ifn: 3, followup_ifn: 8,    // delta_ifn=-5 → bad IFN
    });
    expect(result.classification).toBe('partial');
    expect(result.reason).toBe('eva_only');
  });

  it('limited + delta_ifn<0 → limited (never downgraded from limited)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 5, followup_eva: 5,    // delta_eva=0 → limited
      baseline_ifn: 2, followup_ifn: 8,    // delta_ifn=-6 → bad IFN
    });
    expect(result.classification).toBe('limited');
    expect(result.reason).toBe('eva_only');
  });

  it('IFN never upgrades classification', () => {
    // partial EVA, great IFN improvement → still partial
    const result = classifyClinicalOutcome({
      baseline_eva: 5, followup_eva: 4,    // delta_eva=1 → partial
      baseline_ifn: 9, followup_ifn: 0,    // delta_ifn=9 → huge IFN improvement
    });
    expect(result.classification).toBe('partial');
  });
});

// ── Missing / null data rules ──────────────────────────────────────

describe('classifyClinicalOutcome — missing data', () => {
  it('followup_eva=null → unavailable_missing_eva', () => {
    const result = classifyClinicalOutcome({ baseline_eva: 7, followup_eva: null });
    expect(result.classification).toBeNull();
    expect(result.reason).toBe('unavailable_missing_eva');
  });

  it('both EVA null → unavailable_missing_eva', () => {
    const result = classifyClinicalOutcome({ baseline_eva: null, followup_eva: null });
    expect(result.classification).toBeNull();
    expect(result.reason).toBe('unavailable_missing_eva');
  });

  it('missing IFN → EVA-only classification (no modifier)', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 9, followup_eva: 4,   // delta_eva=5 → very_favorable
      baseline_ifn: undefined, followup_ifn: undefined,
    });
    expect(result.classification).toBe('very_favorable');
    expect(result.reason).toBe('eva_only');
    expect(result.delta_ifn).toBeNull();
  });

  it('only baseline_ifn missing → IFN modifier not applied', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 8, followup_eva: 4,   // delta_eva=4 → very_favorable
      baseline_ifn: null, followup_ifn: 3,
    });
    expect(result.classification).toBe('very_favorable');
    expect(result.reason).toBe('eva_only');
  });

  it('only followup_ifn missing → IFN modifier not applied', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 8, followup_eva: 4,   // delta_eva=4 → very_favorable
      baseline_ifn: 7, followup_ifn: null,
    });
    expect(result.classification).toBe('very_favorable');
    expect(result.reason).toBe('eva_only');
  });

  it('IFN not available from IFN alone — classification stays null when EVA missing', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: null, followup_eva: null,
      baseline_ifn: 8, followup_ifn: 2,
    });
    expect(result.classification).toBeNull();
    expect(result.reason).toBe('unavailable_missing_eva');
  });
});

// ── Invalid range validation ───────────────────────────────────────

describe('classifyClinicalOutcome — invalid range validation', () => {
  it('baseline_eva > 10 → unavailable_invalid_range', () => {
    const result = classifyClinicalOutcome({ baseline_eva: 11, followup_eva: 5 });
    expect(result.classification).toBeNull();
    expect(result.reason).toBe('unavailable_invalid_range');
  });

  it('followup_eva < 0 → unavailable_invalid_range', () => {
    const result = classifyClinicalOutcome({ baseline_eva: 7, followup_eva: -1 });
    expect(result.classification).toBeNull();
    expect(result.reason).toBe('unavailable_invalid_range');
  });

  it('baseline_eva = 0 is valid (boundary)', () => {
    const result = classifyClinicalOutcome({ baseline_eva: 0, followup_eva: 0 });
    expect(result.classification).toBe('limited');
  });

  it('followup_eva = 10 is valid (boundary)', () => {
    const result = classifyClinicalOutcome({ baseline_eva: 10, followup_eva: 10 });
    expect(result.classification).toBe('limited');
  });

  it('IFN out of range → IFN modifier skipped, EVA classification kept', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 9, followup_eva: 4,   // delta_eva=5 → very_favorable
      baseline_ifn: 50, followup_ifn: 20, // out of 0-10 range
    });
    expect(result.classification).toBe('very_favorable');
    expect(result.reason).toBe('eva_only');
    expect(result.delta_ifn).toBeNull();
  });

  it('IFN negative value → IFN modifier skipped', () => {
    const result = classifyClinicalOutcome({
      baseline_eva: 8, followup_eva: 5,   // delta_eva=3 → favorable
      baseline_ifn: -1, followup_ifn: 3,
    });
    expect(result.classification).toBe('favorable');
    expect(result.reason).toBe('eva_only');
  });
});

// ── Multiple follow-ups (independence) ────────────────────────────

describe('classifyClinicalOutcome — multiple follow-ups', () => {
  it('D7 and D90 follow-ups classified independently', () => {
    // D7: small improvement
    const d7 = classifyClinicalOutcome({ baseline_eva: 8, followup_eva: 7 });
    // D90: large improvement
    const d90 = classifyClinicalOutcome({ baseline_eva: 8, followup_eva: 3 });

    expect(d7.classification).toBe('partial');
    expect(d90.classification).toBe('very_favorable');
  });

  it('earlier follow-ups do not affect later ones', () => {
    const baseline = 7;

    const m1 = classifyClinicalOutcome({ baseline_eva: baseline, followup_eva: 6 });
    const m3 = classifyClinicalOutcome({ baseline_eva: baseline, followup_eva: 4 });
    const m6 = classifyClinicalOutcome({ baseline_eva: baseline, followup_eva: 7 }); // regression

    expect(m1.classification).toBe('partial');
    expect(m3.classification).toBe('favorable');
    expect(m6.classification).toBe('limited');
  });
});

// ── Binary responder logic coexistence ────────────────────────────

describe('classifyClinicalOutcome — coexistence with binary responder logic', () => {
  it('does not affect existing delta calculation (deltaPain = followup - baseline)', () => {
    // This test confirms the domain function uses baseline-followup (positive=improvement)
    // while the existing report uses followup-baseline (negative=improvement)
    // The two calculations are independent and parallel
    const baselinePain = 8;
    const followupPain = 3;

    const legacyDeltaPain = followupPain - baselinePain;          // -5 (existing logic)
    const classificationResult = classifyClinicalOutcome({
      baseline_eva: baselinePain,
      followup_eva: followupPain,
    });

    expect(legacyDeltaPain).toBe(-5);                             // existing responder threshold
    expect(classificationResult.delta_eva).toBe(5);              // new classification delta
    expect(classificationResult.classification).toBe('very_favorable');
  });

  it('50% responder and very_favorable can coexist independently', () => {
    const baselinePain = 8;
    const followupPain = 3;

    const pctImprovement = ((baselinePain - followupPain) / baselinePain) * 100; // 62.5% → responder
    const classResult = classifyClinicalOutcome({ baseline_eva: baselinePain, followup_eva: followupPain });

    expect(pctImprovement).toBeGreaterThanOrEqual(50);
    expect(classResult.classification).toBe('very_favorable');
  });
});

// ── Label lookup ──────────────────────────────────────────────────

describe('CLINICAL_OUTCOME_LABELS', () => {
  it('returns exact canonical labels per spec', () => {
    expect(CLINICAL_OUTCOME_LABELS.very_favorable).toBe('Resposta muito favorável');
    expect(CLINICAL_OUTCOME_LABELS.favorable).toBe('Resposta favorável');
    expect(CLINICAL_OUTCOME_LABELS.partial).toBe('Resposta parcial');
    expect(CLINICAL_OUTCOME_LABELS.limited).toBe('Resposta limitada');
  });

  it('CLINICAL_OUTCOME_LABEL_UNAVAILABLE is correct', () => {
    expect(CLINICAL_OUTCOME_LABEL_UNAVAILABLE).toBe('Classificação indisponível');
  });
});

// ── Historical backfill consistency ───────────────────────────────

describe('classifyClinicalOutcome — backfill consistency', () => {
  it('is deterministic: same inputs always produce same output', () => {
    const params = { baseline_eva: 7, followup_eva: 4, baseline_ifn: 6, followup_ifn: 5 };
    const r1 = classifyClinicalOutcome(params);
    const r2 = classifyClinicalOutcome(params);
    const r3 = classifyClinicalOutcome(params);

    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
  });

  it('is idempotent: recomputing does not change result', () => {
    const params = { baseline_eva: 6, followup_eva: 3, baseline_ifn: 5, followup_ifn: 5 };
    const first = classifyClinicalOutcome(params);
    const second = classifyClinicalOutcome(params);

    expect(first.classification).toEqual(second.classification);
    expect(first.reason).toEqual(second.reason);
    expect(first.delta_eva).toEqual(second.delta_eva);
    expect(first.delta_ifn).toEqual(second.delta_ifn);
  });

  it('leaves null when minimum data not available (backfill safe)', () => {
    const noEva = classifyClinicalOutcome({ baseline_eva: null, followup_eva: null });
    expect(noEva.classification).toBeNull();
  });

  it('applies IFN only when both baseline and followup IFN are present', () => {
    const withoutIfn = classifyClinicalOutcome({ baseline_eva: 8, followup_eva: 4 });
    const withIfnImproved = classifyClinicalOutcome({ baseline_eva: 8, followup_eva: 4, baseline_ifn: 7, followup_ifn: 4 });
    const withIfnStagnant = classifyClinicalOutcome({ baseline_eva: 8, followup_eva: 4, baseline_ifn: 7, followup_ifn: 7 });

    expect(withoutIfn.classification).toBe('very_favorable');
    expect(withIfnImproved.classification).toBe('very_favorable');
    expect(withIfnStagnant.classification).toBe('favorable');  // downgraded
  });
});
