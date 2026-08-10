# Xerbs AI Roadmap

## Vision

Build a modular, knowledge-driven clinical AI platform where every AI module owns exactly one clinical responsibility.

The platform is designed to be:

- Evidence-driven
- Explainable
- Traceable
- Modular
- Provider-independent
- Knowledge-driven
- Continuously evolving

Clinical reasoning must always be based on evidence rather than inference alone.

---

# Overall Progress

| Phase | Status |
|--------|--------|
| Phase 1 — Clinical Understanding | ✅ Completed |
| Phase 2 — Clinical Reasoning | 🚧 In Progress |
| Phase 3 — Clinical Treatment | ⬜ Planned |
| Phase 4 — Clinical Follow-up | ⬜ Planned |
| Phase 5 — Knowledge Expansion | ⬜ Planned |
| Phase 6 — Multimodal Intelligence | ⬜ Planned |
| Phase 7 — Continuous Learning | ⬜ Planned |

---

# Phase 1 — Clinical Understanding

**Status**

✅ Completed

### Modules

- Assessment
- Summary

### Goal

Transform structured patient information into an organized, prioritized clinical representation.

### Outcome

The system understands:

- Patient complaints
- Symptoms
- History
- Tongue findings
- Missing information
- Clinical priorities

without performing diagnosis or treatment.

---

# Phase 2 — Clinical Reasoning

**Status**

🚧 In Progress

### Modules

- Diagnosis

### Goal

Interpret the summarized clinical findings and perform syndrome differentiation.

### Outcome

The system produces:

- Syndrome differentiation
- Diagnostic reasoning
- Supporting evidence
- Diagnostic confidence

without selecting treatments.

---

# Phase 3 — Clinical Treatment

**Status**

⬜ Planned

### Modules

- Formula
- Prescription

### Goal

Transform diagnosis into an evidence-based treatment plan.

### Outcome

The system generates:

- Formula selection
- Herb composition
- Dosage recommendations
- Contraindication checks
- Structured prescription

Treatment selection remains independent from diagnosis generation.

---

# Phase 4 — Clinical Follow-up

**Status**

⬜ Planned

### Modules

- Follow-up
- Outcome Tracking

### Goal

Monitor treatment progress and recommend next clinical actions.

### Outcome

The system can:

- Evaluate patient progress
- Compare current and previous visits
- Recommend follow-up timing
- Suggest assessment updates
- Detect incomplete recovery

---

# Phase 5 — Knowledge Expansion

**Status**

⬜ Planned

### Modules

- Formula Library
- Herb Library
- Clinical Rules
- Contraindications
- Pattern Knowledge
- Evidence References

### Goal

Continuously expand medical knowledge without changing the AI framework.

### Outcome

Medical intelligence grows by enriching the Knowledge Base rather than modifying AI modules.

---

# Phase 6 — Multimodal Intelligence

**Status**

⬜ Planned

### Modules

- Tongue Image Analysis
- Pulse Analysis
- Face Diagnosis
- Voice Analysis
- Laboratory Analysis
- Wearable Data

### Goal

Expand the AI engine to understand multiple clinical evidence sources.

### Outcome

Assessment becomes multimodal while preserving the same runtime pipeline.

---

# Phase 7 — Continuous Learning

**Status**

⬜ Planned

### Modules

- Clinical Evaluation
- Prompt Optimization
- Knowledge Updates
- AI Benchmarking
- Quality Monitoring

### Goal

Improve clinical quality through evaluation rather than architectural changes.

### Outcome

The system continually improves while maintaining stable runtime behavior.

---

# Long-term Vision

Future platform capabilities include:

- AI Marketplace
- Third-party AI Modules
- External Knowledge Packages
- Clinical Plugin Ecosystem
- Multi-language Clinical AI
- Federated Knowledge Networks
- Research Assistant
- Clinical Decision Support APIs

These capabilities extend the platform without changing the core AI runtime.

---

# Guiding Principles

The roadmap follows the Xerbs AI Runtime Contract.

Every future capability must preserve the following principles:

- One module owns one clinical responsibility.
- Evidence flows forward only.
- Clinical confidence is evidence-driven.
- Results are immutable after generation.
- Knowledge is external to the AI Engine.
- AI providers remain interchangeable.
- Every output conforms to a predefined schema.
- Framework changes require architectural justification.
- Clinical capability is prioritized over framework expansion.

---

# Current Runtime Pipeline

Patient Input

↓

Assessment

↓

Summary

↓

Diagnosis

↓

Formula

↓

Prescription

↓

Follow-up

Each module consumes only the structured outputs of previous modules.

No module may bypass the runtime contract.
