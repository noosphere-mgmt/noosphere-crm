# Advisory Workspace UX

**Status:** UX-1 implemented (Opportunity workspace)  
**Constraint:** UI/UX only — backend, repos, and actions unchanged.

## North star

Replace list + read drawer with **workspace-first** URLs. One canonical full-page workspace per record.

## Opportunity workspace (UX-1)

**URL:** `/admin/opportunities/M######?tab=brief`

| Tab | Legacy alias | Content |
|-----|--------------|---------|
| Brief | `overview` | Requirement, parties summary, notes |
| Matches | — | Placeholder (R2 matching UI) |
| Shortlist | `premises` | Proposed premises |
| Parties | `parties`, `fees` | Parties + fees |
| Proposals | `proposals` | Placeholder (R3) |
| Timeline | `activities`, `notes` | Activities feed + remarks |

## Shell components

- `AdvisoryWorkspaceShell` — header, tabs, main, optional context panel
- `WorkspaceContextPanel` — AI placeholder (R4)

## Future phases

- UX-2: Property workspace
- UX-3: Company / Contact workspace
- UX-4: Dashboard command center
- UX-5: AI panel backend (R4)
