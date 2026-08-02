# AI Modules

## Overview

Modules perform medical reasoning.

Every module has exactly one responsibility.

Modules never communicate directly.

The Engine coordinates all modules.

---

# Current Modules

Assessment

Clinical Summary

Diagnosis

Formula Recommendation

Prescription

Follow-up

---

# Module Contract

Every module must

- accept structured input
- return structured output
- never access database
- never call provider
- never mutate state
- never call another module

---

# Module Structure

```
module/

schema.ts

prompt.ts

service.ts

types.ts

tests/
```

---

# Input

Modules receive

- AI Context
- Knowledge
- Configuration

Nothing else.

---

# Output

Modules return

Structured Result

Example

```
DiagnosisResult

FormulaResult

AssessmentResult
```

---

# Knowledge

Modules never own knowledge.

Knowledge is injected.

---

# Error Handling

Modules return

- Success
- Validation Error
- Unsupported Case

Modules never retry.

The Engine performs retries.

---

# Testing

Every module must have

- unit tests
- schema validation
- prompt tests
- provider-independent tests

---

# Future Modules

Modules can be added without modifying existing modules.

Open/Closed Principle applies.
