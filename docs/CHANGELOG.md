# Changelog

## CRM Intelligence release candidate — 10 August 2026

### Added

- Noosphere Intelligence dashboard with Business Pulse, pipeline funnel, AI guidance and top opportunity referrers
- Leads module and lead conversion preparation
- Multi-tier expandable channel tree with opportunity attribution and search expansion
- Opportunity workspace with Overview, Parties, Proposed, Activity and Documents
- Requirement paste-and-analyse workflow and opportunity insight/SWOT presentation
- Property matching with all-premises search and scored suggested matches
- Building and Premises workspaces, drawer navigation and responsive listings
- English, Traditional Chinese and Simplified Chinese property/proposal content
- Building and premises relationships
- Generated multilingual premises names and editable English name
- Bidirectional sq.ft./sq.m. area conversion and number formatting
- Unified Meaningful Activity timeline and inline Record Activity layout
- Opportunity document filing for PDF, JPG and PNG with view/delete controls
- Import/update/export support for eleven objects, including Leads and JSON relationship fields
- Mobile Proposed-premises cards with selection, key commercial facts and direct access to the full line editor
- Mobile working hamburger menu for Leads, Opportunities, Buildings, Companies and Activities

### Changed

- Main navigation consolidated around Leads, Opportunities, Properties, Connections and Activities
- Dashboard menu duplication removed; homepage is the dashboard
- Company-first Contact selection enforced in Opportunity Parties
- Premises classification simplified to Asset Class, Subtype, Market Mode and Offer Type
- Listing Status simplified to Available, Leased, Sold and Withdrawn
- Proposed-premises workflow simplified to Reviewing, Inspected, Negotiating, Selected and Rejected
- Commission reduced to a free-text business statement; payer-specific fields removed from the UI
- Property source defaults to Direct; new premises dates default to today
- Separate Notes tabs removed; dated updates now use Activities
- Old Notes URLs redirect to Activities
- Mobile and desktop layouts made denser and more navigable
- Dashboard and Premises Detail redundant database reads removed after performance audit
- Mobile dashboard, header, detail tabs and five-item bottom navigation refined
- Bottom navigation preserved above Company, Contact, Opportunity and Premises drawers
- Channel Tree made available in Connections on mobile with contained horizontal navigation
- CSV import/upload controls hidden on mobile while remaining available on desktop
- Mobile dashboard aligned to the desktop information hierarchy: AI Copilot, Business Pulse, Pipeline and Referral Performance
- Mobile Opportunity Overview stacks Client, Requirement and AI; internal fields retain compact two-column layouts where practical and Special Requirement stays full-width
- Mobile Proposed uses cards instead of the workstation table; desktop retains inline editing and comparison density
- Mobile administrative Settings removed; desktop Settings remains unchanged
- Opportunities restored as a direct bottom-navigation link; Leads is available from the hamburger menu
- Structured JSON exports now serialize relationship arrays correctly instead of producing `[object Object]`
- Opportunity lifecycle standardised to Qualifying, Sourcing, Proposal Reviewing, Negotiating, Closed Won and Closed Lost
- Opportunity header simplified to Name, linked Company/Contact and a prominent Status/Probability/Expected Close monitoring panel
- Opportunity Overview reorganised into responsive Client, Requirement and AI sections; wide desktop uses three columns
- Indicative Value removed from the Opportunity header; Transaction moved into the Client section

### Compatibility

- Production CSV headings remain accepted through import aliases where mapped
- Retired fields remain import-compatible but are hidden from new templates/exports
- Existing activity-premises data remains supported, although normal tours are managed in Opportunities
- Existing business IDs and external references remain the migration anchors
- `relationships.csv` remains the Company/Contact referral-network file; property role lines and Opportunity associations retain their object-specific import fields

### Verified

- Production build completed successfully
- All eleven import/export adapters passed schema verification
- Import lookup-field validation passed
- Fourteen principal routes loaded without application errors in browser testing
- Mobile Dashboard and Opportunity Proposed verified at 390px without horizontal overflow

### Deferred

- IMAP incoming/sent email ingestion and opt-out automation
- Multi-user authentication and role-based record access
- Multiple virtual staff and channel-specific outbound email
- Production AI credentials/workflows for translation, extraction and follow-up
- Town Planning API zoning/site integration
