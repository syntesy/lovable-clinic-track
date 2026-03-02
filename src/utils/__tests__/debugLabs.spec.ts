import { describe, it, expect } from "vitest";
import { normalizeLabs, sanitizeUnit } from "@/utils/normalizeLabs";

describe("Debug HbA1c parsing", () => {
  it("should parse HbA1c with % unit", () => {
    const result = normalizeLabs("HbA1c: 5,7 % (Ref 4,0 - 5,6)");
    console.log("labs:", JSON.stringify(result.labs, null, 2));
    console.log("unmapped:", result.unmapped_lines);
    const hba1c = result.labs.find(l => l.name === "HbA1c");
    expect(hba1c).toBeDefined();
    expect(hba1c!.unit).toBe("%");
  });

  it("sanitizeUnit with %", () => {
    const r = sanitizeUnit("%");
    console.log("sanitizeUnit result:", r);
    expect(r.unit).toBe("%");
  });

  it("VALUE_PATTERN test", () => {
    const VALUE_PATTERN = /[:=]?\s*([\d]+[.,]?\d*)\s*([\w/%µμ^³²]+(?:\/[\w%µμ^³²]+)*)?/;
    const afterAlias = ": 5,7 % (Ref 4,0 - 5,6)";
    const m = afterAlias.match(VALUE_PATTERN);
    console.log("match:", m);
    expect(m).not.toBeNull();
    expect(m![2]).toBe("%");
  });

  it("B12 with garbage value", () => {
    const result = normalizeLabs("Vitamina B12 923172");
    console.log("B12 labs:", JSON.stringify(result.labs, null, 2));
    const b12 = result.labs.find(l => l.name === "Vitamina B12");
    if (b12) {
      console.log("B12 interpretable:", b12.is_interpretable, "reasons:", b12.blocking_reasons);
    }
  });
});
