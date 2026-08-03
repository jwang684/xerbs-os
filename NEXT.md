# NEXT

Working notes on where the project is and what comes next. See
`docs/product/` for the full sprint records.

## Now

- **Sprint 3 — Consumer Platform.**
  - **Phase 1 — Patient Portal vertical slice: complete** (read-only portal +
    self-service contact editing). See
    [docs/product/09-sprint-3.md](docs/product/09-sprint-3.md).
- **AI Engine — foundation: complete (framework only).** `src/ai/` — engine,
  modules, providers, knowledge, prompts (filesystem templates), typed results,
  config layer, and `createAIEngine()` bootstrap.
- **AI Engine — AssessmentModule: complete (first real module).** Pipeline is
  Patient Input → AssessmentModule → AssessmentResult. Real `assessment.md`
  prompt (organizes findings only — no diagnosis/treatment/formula), OpenAI
  provider behind the `AIProvider` abstraction, registered in the bootstrap.
  Requires `OPENAI_API_KEY` (+ `OPENAI_MODEL`) at runtime. Next: SummaryModule.

## Next candidates (Sprint 3, Phase 2+)

- **Patient onboarding / account linking**: let a patient register or claim an
  existing `patients` record (establish `patients.user_id`) without creating
  duplicate records. Invitation-based linking from the clinic side.
- **Role-aware landing**: after login, route patients to `/patient` and clinic
  users to the clinic app; today `/login` always lands on the clinic app.
- **Record/clinic selector polish**: persist the active record across pages once
  multi-clinic patients are common (Phase 1 defaults to the single record).
- Then, per the roadmap: AI Assessment, Orders, Shopping, Checkout — each its own
  vertical slice.

## Guardrails (unchanged)

- One phase at a time; stop for review after each.
- repository → service → REST → frontend; no shortcuts.
- Tenant isolation for clinic APIs (`getAuthContext`); patient isolation for the
  portal (`getPatientContext`, resolved from the session, never by org or a
  trusted URL id).
- Migrations are append-only. Every phase passes lint, typecheck, tests, build,
  then commits once.
