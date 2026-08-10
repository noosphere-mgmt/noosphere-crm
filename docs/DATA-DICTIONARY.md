# Current data dictionary

This document describes current business-facing data groups. Database technical columns, timestamps and retired compatibility fields are intentionally not presented as UI fields.

## Companies

| Group | Current fields |
|---|---|
| Identity | Business ID, English/Traditional/Simplified company names, roles, coverage |
| Location/contact | Country, city, district, website, phone, email |
| Relationship management | Primary contact, relationship owner, relationship strength, last contact, last meeting, next follow-up, active |
| Profile | Industry, source, remarks |

Contacts belong to a company in the normal workflow. Company roles can include client, landlord, operator, agent/partner and other supported roles.

## Contacts

| Group | Current fields |
|---|---|
| Identity | Business ID, company, first name, last name, Chinese name, display name, title |
| Communication | Mobile, WhatsApp, WeChat, email, preferred language |
| Coverage | Contact role, multi-select coverage, locate at |
| Relationship management | Primary contact, last contact, next follow-up, active, remarks |

Affiliations allow additional company relationships without removing the primary company.

## Buildings

| Group | Current fields |
|---|---|
| Names | English, Traditional Chinese, Simplified Chinese building names |
| Building specification | Building Type, Grade, Year Built, Total Floors, Gross Area sq.ft./sq.m., Title |
| Site/planning | Site Area, Lot Number, Land Use/Zoning |
| Location | Country/city/district in three languages, Street Name, Street Number, addresses, MTR station, walking minutes |
| Relationships | Role, company, remarks; supported roles include Owner, Management Office, Occupant and Other |
| Proposal content | Building Introduction, Location Advantages, Accessibility, Facilities/Highlights in three languages |
| Source | Source URL, Last Verified Date |

Building Type is commercial classification. Land Use/Zoning is official planning information and must remain independent.

## Premises

| Group | Current fields |
|---|---|
| Identity | Business ID, linked building, editable English name, Traditional name, Simplified name |
| Classification | Asset Class, Subtype, Market Mode, Offer Type, Listing Status, Source Type |
| Specification | Floor, Unit, Capacity, Number of Rooms, Gross/Net Area sq.ft. and sq.m., Fit Out, View |
| Commercial terms | Currency, asking sale price/PSF, package monthly fee/rent PSF, management fee/PSF, government rates, deposit, rent-free period, contract term, available date |
| Source/relationship | Source URL, Last Verified Date, relationships, commission statement |
| Remarks | Premises remarks, listing/lease-term remarks, internal remarks |

Default Source Type is Direct. New premises default Available Date and Last Verified Date to the current date. View includes Open View. Fit-out choices include Fully Furnished, Partial Furnished, Well Furnished, Luxury Furnished, Ceiling & Carpet and Bareshell.

## Opportunities

| Group | Current fields |
|---|---|
| Identity | Business ID, opportunity name, owner, external reference |
| Client | Company, dependent primary contact, referring company/contact, Lead/Opp Source, owner and Transaction |
| Requirement | property preferences, workspace/subtype, district, capacity, area, budget range, target yield, funding, move-in date, lease term, requirement summary and remarks |
| Progress | Status, expected close date, lost reason, next action/date and compatibility workflow fields |

Current statuses: Qualifying, Sourcing, Proposal Reviewing, Negotiating, Closed Won and Closed Lost. Probability is derived from Status. Current Lead/Opp Source values are Direct, Partner Agents and eMarketing.

## Opportunity parties

Each row links an Opportunity to a Company and optional dependent Contact with a Role and Remarks. Role direction should be expressed clearly, such as Referring Agent. Partnership mode and payer-specific fee columns are retired from the current UI but retained for historical import compatibility.

## Proposed premises

Each row links one Opportunity with one Premises. Current client-journey statuses are Reviewing, Inspected, Negotiating, Selected and Rejected. Supporting fields include rank, proposed date/price, tour date, preference, client comment, advisor comment and remarks. Selected represents the successful/won premises choice.

## Activities

| Group | Current fields |
|---|---|
| Activity | Business/activity ID, date, time, type, subject, notes, owner, external reference, group ID |
| Links | Company, Contact, Opportunity, Premises |

Activities are the dated journal. Remarks on the parent entity remain stable profile information. `activity_premises` is an optional linking table for one activity connected with multiple premises; normal opportunity tours are managed through Proposed Premises plus an Opportunity Activity.

## Relationships

Relationships store directional links between company/contact entities: from entity, relationship type, to entity, status, start/end dates, source, notes and external reference. Referral direction is from the referring party to the introduced party.

## Leads

| Group | Current fields |
|---|---|
| Ownership/status | Lead ID, lead owner, status, source, assigned mailbox |
| Prospect | Company name/domain, contact name/title, sender/recipient email, phone, city/country |
| Email intelligence | Direction, subject, excerpt, message/thread IDs, received/sent time, last email time, opt-out |
| Qualification | Requirement notes, AI digest, office-space required, next lease expiry, qualification score/reason, next follow-up |
| Conversion | Converted company, contact and opportunity IDs, converted time |

Email ingestion and AI automation are not assumed to be active until the deferred production integration is completed.

## Import/export policy

- Current template fields are the maintained vocabulary.
- Match-only IDs are included to prevent duplicate updates.
- Name columns beside IDs are lookup helpers.
- Old aliases remain accepted where defined.
- Hidden legacy fields do not appear in clean templates.
- Automatically derived/system fields should not be manually maintained unless explicitly exposed.
- JSON relationship fields export as valid JSON, not display text.
- Raw CSV may double the JSON quotation marks for escaping. This is valid CSV and should round-trip through the importer.

### Relationship ownership by import object

- `relationships.csv`: Company/Contact referral-network links (`Refers`, `Represents`)
- Buildings: `building_relationships` JSON role lines (Owner, Management Office, Occupant, Other)
- Premises: `relationships` JSON role lines and operator/owner references
- Opportunities: client/referrer references, with additional parties in Opportunity Parties
- Proposed options: Opportunity Proposed Premises

These are not interchangeable in the current schema. Do not remove property or Opportunity association fields on the assumption that `relationships.csv` will recreate them.
