# AI Output Standard

## Goal

All AI modules must produce structured outputs.

Outputs should be machine-readable, versioned, and independent of any specific language model.

---

## General Rules

- Always return structured data.
- Never return free-form paragraphs as the primary output.
- Every output must include a schema version.
- Every output must include a confidence level.
- Every output must include safety notes when applicable.

---

## Confidence

Allowed values

- Low
- Medium
- High

Do not return percentages.

---

## Explanation

AI may generate explanations for users.

Explanations are never used as structured clinical data.

---

## Clinical Recommendation

Recommendations must be separated from observations.

Observation

↓

Reasoning

↓

Recommendation

Never merge them.

---

## Safety

When uncertainty is high,

recommend practitioner review.

Never claim certainty.

---

## Versioning

Every AI output must contain

schemaVersion

to support future compatibility.
