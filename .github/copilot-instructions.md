# Copilot Instructions — Noosphere CRM

## Preserve the existing architecture

- Preserve the existing Next.js architecture, database relationships, UI components, styling, and application functionality. Make focused changes and avoid unrelated refactors.
- Reuse established project patterns, components, and helpers when implementing enhancements. Inspect relevant code and dependencies before changing behavior.
- Do not modify database schemas until dependencies and impacts have been reviewed and the user has explicitly approved the change.

## Mandatory Business ID architecture

The canonical Business ID architecture in `.cursor/rules/business-id-architecture.mdc` is mandatory. Read and follow it before making any ID-related change.

- Never redesign, rename, replace, remap, or introduce an alternative to the existing Business ID system without explicit user approval.
- Preserve one business ID per entity. Use business IDs in all user-facing surfaces, imports, exports, relationships, and API responses; database numeric primary keys are internal only.
- Use the existing `business_id` source of truth and established helpers, including `sqlExport*Id` and `resolveBusinessId`. Do not add ID formats, resolver chains, mapping layers, or fallbacks to numeric or legacy IDs.
- If a requested change would violate these rules or the frozen architecture, stop and ask for explicit approval before proceeding.

## Change and delivery boundaries

- Do not commit, push, or deploy automatically. Do so only when the user explicitly asks.
- Follow the user’s stated scope. Do not modify application source files when the task is limited to instructions, documentation, or configuration.
- Before making consequential or potentially breaking changes, explain the impact and obtain approval where required above.
