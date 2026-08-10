# Noosphere CRM system handover

Release baseline: CRM Intelligence release candidate, 10 August 2026. The release tag and production commit must be recorded after the final commit is created.

## Purpose

Noosphere CRM is a relationship-led real-estate intelligence system for a small operating team. It manages leads, referral channels, companies and contacts, buildings and premises, opportunities, proposals, documents and meaningful activity footprints. It is not intended to become a complete public property database.

## Technology and operation

- Next.js 16, React 19 and TypeScript
- PostgreSQL accessed through raw parameterised SQL using `pg`
- Local and production application port: `3001`
- Database setting: `NOOSPHERE_DATABASE_URL`
- Single administrative login remains the current operating model
- Production process: PM2 process `noosphere-crm`
- Health check: `GET /api/health`

## Current navigation

- **Noosphere Intelligence**: AI-oriented business pulse, pipeline and referral performance
- **Leads**: captured or imported prospects, qualification and conversion preparation
- **Opportunities**: requirements, parties, proposed options, activities and documents
- **Properties**: the main Buildings/Premises workspace and flat premises listing
- **Connections**: companies, contacts and the expandable referral channel tree
- **Activities**: the consolidated chronological activity register
- **Settings**: configuration, users and import workbench access
- **+ Create**: lead, opportunity, company, contact, building, premises and activity

Desktop keeps the full top navigation and Settings. Mobile keeps the five-item bottom navigation (Home, Opportunities, Properties, Connections and Activities), a compact **+ Create** control and a working hamburger menu for Leads, Opportunities, Buildings, Companies and Activities. Administrative Settings and CSV upload controls are intentionally unavailable on mobile.

## Core business rules

### Connections and referrals

- Companies and contacts remain separate records; a contact is normally dependent on a selected company.
- Contact-company affiliations support a person connected with more than one company.
- Referral direction is explicit: the source party **refers** the introduced party.
- The channel tree supports multiple tiers, branch expansion and opportunity counts.
- Referral performance attributes opportunities through the recorded referral branch.

### Buildings and premises

- A Building is the location/parent record; Premises is the transactable space.
- Building Type represents the building category. Land Use remains a separate town-planning value and must not be overwritten by commercial classification.
- Premises classification uses Asset Class, Subtype, Market Mode and Offer Type.
- Current Market Mode supports lease and sale selections.
- Current Listing Status uses Available, Leased, Sold and Withdrawn.
- Square feet and square metres convert in both create and edit workflows.
- English premises name can be generated from Building + Floor + Unit and remains editable.
- Traditional and Simplified Chinese premises names are generated from the corresponding building name + Floor + Unit and remain available for proposal content.
- Source Type defaults to Direct. Available Date and Last Verified Date default to the creation date for new premises.
- Commission is one free-text commercial statement; payer-specific commission fields are retired from the UI.

### Opportunities

Workspace tabs are:

1. Overview
2. Parties
3. Proposed
4. Activity
5. Documents

Current opportunity stages are Qualifying, Sourcing, Proposal Reviewing, Negotiating, Closed Won and Closed Lost. Probability is derived from stage; it is not a separately maintained field. Closed Won and Closed Lost reveal their corresponding reason field.

The Opportunity header is deliberately compact. It shows Opportunity Name with Company and Contact beneath it, followed by an eye-catching monitoring panel for Status, derived Probability and Expected Close. Indicative Value was removed from the header.

Opportunity Overview is a responsive three-part workspace:

- **Client**: Company, dependent Contact, Lead/Opp Source, Owner and Transaction
- **Requirement**: structured requirements plus Paste Requirements for conversational intake
- **AI**: Current Position and expandable SWOT based on recorded requirements, parties, premises, proposals and activity footprints

Wide desktop uses three columns. Tablet places Client across the top with Requirement and AI beneath it. Mobile stacks Client, Requirement and AI. This information hierarchy should be preserved during visual fine-tuning.

Proposed-premises status records the client journey: Reviewing, Inspected, Negotiating, Selected or Rejected. Adding a premises already means it has been proposed. Property proposals support search across all premises and suggested matches ordered by score.

On mobile, the three Overview sections stack while internal Client and Requirement fields use compact two-column grids where practical; Special Requirement remains full-width. The Proposed tab replaces the workstation table with stacked premises cards showing the premises, operator, area/capacity, price, tour date, status, preference and remarks. Selection, proposal generation, comparison selection and the full line editor remain available. Desktop retains the dense editable comparison table.

### Activities and remarks

- **Remarks** hold stable profile or standing information.
- **Activities** hold dated calls, emails, meetings, introductions, inspections, decisions and follow-up footprints.
- Company, Contact, Building, Premises and Opportunity Activity pages use the same layout: Meaningful Activity on the left and an always-visible Record Activity form on the right.
- Old Notes-tab URLs redirect to Activities; the separate Notes tabs are removed.
- Opportunity tours are normally managed through Proposed Premises and one Opportunity Activity. `activity_premises` remains available only for historical or exceptional multi-premises links.

### Languages and proposals

- Building proposal content supports English, Traditional Chinese and Simplified Chinese.
- Proposal-oriented building fields are Building Introduction, Location Advantages, Accessibility and Facilities/Highlights.
- Display mode may prioritise English and Traditional Chinese; all three languages remain stored for proposal generation.
- AI translation and narrative assistance are prepared in the UI, but external AI automation should be treated as a future integration unless production credentials and controls are explicitly configured.

## Leads and email

The Leads module supports owner, status, source, sender/contact/company details, email metadata, requirement notes, AI digest, office-space requirement, lease-expiry intelligence and conversion references. IMAP ingestion, sent-email capture and multi-virtual-staff automation are deferred; no production mail automation should be assumed.

## Import and export

The Import Workbench supports Buildings, Premises, Companies, Contacts, Relationships, Opportunities, Opportunity Parties, Opportunity Proposed Premises, Activities, Activity Premises and Leads.

- Downloadable templates expose current fields.
- Old production headings remain accepted through aliases where mapped.
- Hidden legacy fields are retained for backward compatibility but omitted from clean templates/exports.
- Blank cells normally mean no update; use the explicit clear-value operation to erase a value.
- Business IDs and `external_ref` are the preferred matching controls.
- JSON fields export as valid JSON rather than `[object Object]`. Raw CSV escaping may show doubled quotation marks; this is expected and remains re-importable.
- `relationships.csv` currently owns only Company/Contact referral-network links (`Refers` and `Represents`). Building and Premises role lines remain structured fields in their own templates; Opportunity parties/referrers remain in the Opportunity and Opportunity Parties files. Do not remove those fields during migration.
- See [production-to-upgraded-crm-migration.md](import/production-to-upgraded-crm-migration.md) and [DATA-DICTIONARY.md](DATA-DICTIONARY.md).

## Performance baseline

On 10 August 2026, fourteen principal routes were tested in a real local browser with no application errors. Warm local development loads were generally 0.3–0.9 seconds; Premises Detail was approximately 0.5 seconds. Development first-load compilation is not representative of the production build. Mobile Dashboard and Opportunity Proposed were additionally verified at 390px with no horizontal overflow. Unused dashboard reports and duplicate premises-detail queries were removed before this baseline.

## Deferred work

- IMAP incoming/sent email ingestion and opt-out handling
- Multiple authenticated CRM users and role-scoped access
- Multiple virtual sales staff and channel-specific outbound email
- Production AI translation, requirement extraction, summaries and follow-up automation
- Town Planning API integration for zoning/land/site information
- Further KPI calibration after sufficient production activity data exists

## Continuation rule

Cursor or Codex can continue from the same repository after deployment. Work from the frozen tagged commit, create a separate change commit, run migrations and verification locally, and never use a production database as the development database.

For the immediate Cursor continuation, read [CURSOR-HANDOVER.md](CURSOR-HANDOVER.md) before editing.
