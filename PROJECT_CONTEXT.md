# Blend CRM Project Context

Last updated: 2026-09-09 (Africa/Johannesburg)

## Canonical system

- Repository: `blendproperty/blend-crm`
- Production: `https://crm.onpointoffices.co.za`
- Production branch: `main`
- Deployment: GitHub Actions builds and tests, then redeploys `/opt/blend-crm` with Docker Compose.
- Lead intake: Blend-owned websites and Google Ads submit to the CRM API; external IDs provide source-scoped deduplication.

## Current change: bulk assignment, Bedfordview routing and call-back reminders

### Implementation

- Implemented bulk assignment on `/leads` using selected rows and an active-user selector. Each changed assignment uses the existing assignment endpoint, activity logging and allocation email.
- Implemented Bedfordview routing to active CRM user Brad Shiffer (`brad@blendproperty.co.za`). Job/career auto-kill is evaluated first, so killed enquiries are never assigned to Brad.
- Implemented call-back follow-up tasks. Call-backs require a date/time in both the UI and API.
- Extended the five-minute SLA worker to email the task assignee when a call-back becomes due. The reminder contains the contact name, phone number and CRM link and is recorded once in Activity.
- Added a database migration for task type and reminder-delivery state.

### Testing and validation

- 2026-09-09: `npm test` passed 36/36 tests, including Bedfordview routing, job-enquiry precedence, required call-back dates and reminder content.
- 2026-09-09: `npm run typecheck`, `npm run lint`, `npm run build`, Prisma client generation and `docker compose -f compose.prod.yml config --quiet` passed.
- 2026-09-09: live read-only Team-page verification confirmed Brad Shiffer as active CRM agent `brad@blendproperty.co.za`.

### Commit and push

- Not committed or pushed yet at this checkpoint.

### Merge

- Not merged into `main` yet.

### Deployment and configuration

- Not deployed yet. Defaults are included for `LEAD_BEDFORDVIEW_ASSIGNEE_EMAIL=brad@blendproperty.co.za`; production may override this in its environment.

### Live production verification

- Existing production functionality remains live; this change is not yet live.
- After deployment, verify the bulk assignment control, migration, worker health, Bedfordview routing and a due call-back reminder.
- Existing active Bedfordview leads still need to be bulk-assigned to Brad after deployment. Verify Brad receives contact numbers in the resulting allocation emails.

### Outstanding gates

- Push and successful CI/deployment.
- Live bulk assignment of the existing Bedfordview lead set to Brad.
- End-to-end UAT of one new Bedfordview lead, one job enquiry and one short-dated call-back reminder.
- Provider delivery remains dependent on configured SMTP availability.

## Previously deployed controls

- Killed leads are recoverable in a separate Killed Leads view; manual killing requires a note and explicit job/career enquiries auto-kill.
- New external leads default to Boitumelo, receive a 30-minute unattended reminder and escalate visibility to Luke after 24 hours without changing ownership.
- Stage changes beyond New and Assigned require a note.
- Original source attribution and receiving website are displayed separately, including Google Ads UTM details.
