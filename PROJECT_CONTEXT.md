## 2026-10-28 - Verified Node 24.22.1 rollout (blend-crm)

- Implementation: supported patched Node 24.22.1 pinned by official Docker OCI digest; no business feature, schema, secret, credential, permission or network change. Existing validation retained and actual production image version asserted.
- Testing: source PR 6 at 961fd48367fe9e3f874d72141ec3ff5006be41b8 passed applicable regression, type/lint, production build and actual Docker image qualification. Prior failures and corrective evidence remain in the record. These are technical checks, not customer/business acceptance.
- Commit/push: scoped source and canonical context were published with remote context readback. Merge: normally checked PR 6 merged as 041539bed8036c8101277a397e64962c60523384. This evidence-only follow-up preserves all prior context and uses the established documentation-only [skip ci] path; it triggers no application release.
- Deployment/configuration: Normal CI/deploy run 40516207631 completed successfully; both web and SLA containers report v24.22.1. Public health and login returned 200. Exact production checkout 041539bed8036c8101277a397e64962c60523384 was read back. Rollback image retained; applicable database backup readable, full restore not newly tested. Shared-host maintenance by a separate owner is not attributed to this application update.
- Live production verification: 2026-10-27T13:59:57.434802+00:00; actual running Node v24.22.1, image sha256:1e7d95a7eff8f67451f933a467ba9046d12c205cb9c5a72e3135ebf77aecb849. Evidence retained under the rollout workspace. Runtime and public HTTP checks are separate from CI runner versions. No real customer transaction, outbound test message or financial execution performed.
- Remaining gates: all prior staff/customer/device/UAT, property/source-data accuracy, provider delivery, signing/payment/settlement, legal/privacy, finance, training, physical-access, offline and full-recovery/approval gates remain open. No organisation migration or paused REA work. No external tracker in scope.


## 2026-10-27 - Node.js 24.22.1 runtime patch candidate

- **Implementation:** pin the actual application Docker stages to official Node 24.22.1 Alpine OCI digest; qualify the built runtime in CI. Retain the existing supported production major. Existing tests and production build remain required. No business features, dependencies, schemas, secrets, provider, permission or network settings change.
- **Testing:** preparation/configuration checks only; hosted regression and actual Docker image checks pending. No local Node version is substituted for production qualification.
- **Commit/push:** isolated codex/node-patch-20261027 candidate; exact pushed SHA and remote context readback recorded after publication. Existing local work preserved.
- **Merge:** draft PR pending normal passing checks and repository review requirements.
- **Deployment/configuration:** pending established release; retain previous running image and checkout for rollback before restart. FOND already runs patched 24.22.1; its change makes that runtime reproducible. No deployment is claimed by this candidate record.
- **Live production verification:** pending exact production commit/image, in-container Node version, health and read-only public application routes; CI runner version alone is not evidence. Check companion workers where present.
- **Retained gates:** all existing customer/staff/device/UAT, source-data, provider delivery, finance, signing/payment, legal/privacy, training, physical-access, offline, recovery and approval gates remain. No real transactions or outbound test messages. No tracker in scope.

# Blend CRM Project Context

Last updated: 2026-10-19 (Africa/Johannesburg)

## 2026-10-19 - Close Midpoint QA lead and exclude labelled tests from commercial summaries

- Implementation/operations: at Brett Dovey's explicit request, closed the single exact Midpoint CLARITY-QA-20261019 record as KILLED with TEST ONLY reason, closed/killed timestamps and an audit activity; no deletion or contact change. Exact source/external-ID/test-label guards and a transaction restricted the operation to that record. Verified closed=true, zero open tasks and no active SLA eligibility. Added one shared null-safe reporting filter excluding TEST ONLY killed reasons from overview totals/conversion denominator/recent/source/stage summaries, Reports aggregates and source counts, and property/team lead counts. Killed-lead audit access retains the record. Existing genuine killed leads and null reasons remain reportable. No schema, routing, permissions, email or provider change.
- Testing: 36 existing tests passed; lint, typecheck and production build passed. Read-only tests/reporting-null-guard.sql passed against PostgreSQL fixture values, including null and genuine-killed reasons. Fresh source totals: 68 raw, 67 reportable, exactly one labelled test excluded, all 33 null reasons retained. These are dated verification counts, not static baselines.
- Commit/push: 2d011b3e637c403644ab982a60eaffdd2158e850 pushed to codex/clarity-test-closure-20261019 and origin/main with canonical context. This dated evidence follow-up is documentation only with CI skipped. Canonical context presence/content on intended remote main verified before handoff; unrelated changes preserved.
- Merge: normal non-force fast-forward ce04b6d..2d011b3; no PR merge.
- Deployment/configuration: CI and deploy run 39238904742 succeeded. Server checkout independently matches 2d011b3e637c403644ab982a60eaffdd2158e850; running web container restarted 2026-10-19T10:41:25Z and its compiled server chunks contain the TEST ONLY filter. No new configuration or migration.
- Live production verification: post-deployment production readback confirms the exact test is KILLED/closed/marked TEST ONLY, zero open tasks, and inactive for active SLA eligibility. Fresh live SQL using the null-safe report predicate confirms 68 raw / 67 reportable / exactly one excluded / 33 null reasons preserved. Running compiled filter and server commit verified. Authenticated report UI was not checked: browser opened the sign-in page with no active session. Raw audit history deliberately retains the test; GA4's historical submitted event is not retroactively erased by closing a CRM record.
- Outstanding gates: recipient inbox/device receipt remains unverified. Deployed commercial filters exclude the classified QA test; authenticated report UI/UAT remains unchecked. Midpoint form/loading follow-up d1ee7c46fa575790c8338c7946f54dc232993fcc deployed successfully in run 39240573306 with 199 hosted tests passed; canonical remote-main context follow-up 1aad365 verified. The visible email exit and loaded Google checkbox passed live checks. Mobile LCP did not improve in the comparison and abandonment outcomes remain unproven; those gates remain open in blendproperty/midpoint. Existing provider, data, training, approval and operational UAT gates remain open.

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
