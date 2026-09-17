# UCM Care Coordination — Product Requirements
**Patient Triage & Readmission Risk Orchestration Layer**
Version 0.1 · Draft · September 2026 · Fast Forward Workshop

---

## 1. Problem Statement

UChicago Medicine (UCM) experiences a disproportionately high rate of 30-day emergency department readmissions. When a patient is admitted to the ED, they are nearly guaranteed to be readmitted — driven less by clinical failure and more by a fragmented post-discharge engagement system with no single owner and no unified strategy.

> *"There is no unifying body cohesively defining a strategy, and so progress is significantly hindered because there is no single source of truth consolidating that information."*

Patient engagement responsibility is split across two disconnected worlds:
- **Clinical operations** — Epic, MyChart
- **Marketing and access** — Salesforce Health Cloud, Marketing Cloud, Agentforce

Care coordinators work in Salesforce, but the data they need lives in Epic. This disconnect means high-risk patients routinely fall through the cracks.

A dedicated post-discharge nursing team already exists to call high-risk patients — but they have no reliable way to prioritize their queue, no risk scoring surfaced to their workflow, and no single place to log outcomes. Staffing shortages compound the problem: coordinators cannot reach everyone, and the current system gives them no help deciding who matters most.

---

## 2. Product Vision

A React-based **care coordination orchestration layer** that sits between Epic and Salesforce — surfacing the right patient, to the right coordinator, with the right next action, at the right time.

It does not replace either system. It does not require a new integration architecture to be solved first. It makes the data that already exists actionable within the workflow that already exists.

**Design Principle:** This tool surfaces decisions — it does not make them. Care coordinators remain in control of every action. AI-generated recommendations are clearly labeled and always dismissible.

The initial version targets the most impactful moment in the readmission cycle: the **48–72 hours immediately following ED discharge**. A coordinator who can reach the right high-risk patient within that window — confirm medications, schedule follow-up, address social barriers — meaningfully reduces the probability of return.

---

## 3. Goals & Success Metrics

### Primary Goals

| Metric | Target | Type |
|---|---|---|
| 30-day readmission rate | ↓ 15% vs. baseline (rolling 12mo) | North Star |
| High-risk patients contacted within 48h of discharge | ≥ 80% | Leading Indicator |
| High-risk patients unassigned at 24h post-discharge | 0 | Operational Target |

### Secondary Goals

| Metric | Target |
|---|---|
| Coordinator time spent switching between Epic and Salesforce | ↓ 60% |
| High-risk patients with confirmed PCP follow-up within 7 days | ≥ 75% |
| Daily active use among assigned coordinators at 60 days | ≥ 90% |

---

## 4. Personas

Full detail in [personas.html](personas.html).

| Persona | Role | Priority | Core Need |
|---|---|---|---|
| **Sarah Lin** | Care Coordinator, RN | Primary | Know who to call first; log outcomes without switching systems |
| **James Porter** | CC Manager | Primary | Real-time visibility into unassigned high-risk patients and team workload |
| **Dr. David Reyes** | Chief Medical Officer | Secondary | Executive narrative — proof of impact to champion to leadership |

---

## 5. User Stories

### Care Coordinator

**CC-01**
> As a care coordinator, I want to open the app and immediately see a risk-ordered list of my assigned patients so that I know who needs attention first without consulting multiple systems.

Acceptance Criteria:
- List sorted by risk score descending by default
- Each row shows: patient name, MRN, diagnosis, days since discharge, risk badge (High/Medium/Low), primary next best action
- Data refreshes every 30 minutes from Epic via Data Cloud

**CC-02**
> As a care coordinator, I want to log a call outcome directly in the app so that I don't have to re-enter the information in Salesforce Health Cloud separately.

Acceptance Criteria:
- Outcome options: Reached, Left Voicemail, No Answer, Refused, Escalate
- Free-text notes field (500 char max)
- Writes to Salesforce Health Cloud activity record within 60 seconds
- Logged event appears in patient timeline immediately

**CC-03**
> As a care coordinator, I want AI-generated next best actions labeled clearly as recommendations so that I can make my own clinical judgment about whether to act on them.

Acceptance Criteria:
- All Agentforce-generated actions labeled "Recommended by Agentforce"
- Every recommendation dismissible with one click + optional reason
- Dismissed recommendations do not re-surface unless patient state changes

### Care Coordination Manager

**MGR-01**
> As a CC manager, I want to see all high-risk patients with no assigned coordinator, flagged at the top of my dashboard, so that I can close that gap before it becomes a readmission.

Acceptance Criteria:
- Distinct "Needs Assignment" alert panel at top of manager view
- Inline assignment from dropdown of available coordinators
- Assignment reflected immediately in coordinator's queue

**MGR-02**
> As a CC manager, I want a daily summary of team activity so that I can run my morning huddle from a single source of truth.

Acceptance Criteria:
- KPI tiles: High/Medium/Low counts, unassigned count, % contacted within 48h
- Per-coordinator table: caseload, high-risk count, calls today, uncontacted, last activity
- Data updates in real time as coordinators log calls

### CMO / Executive

**EX-01**
> As the CMO, I want to see a rolling 30-day readmission trend with a sample patient journey that shows how the system reduced risk, so that I can make a credible case to executive leadership.

Acceptance Criteria:
- Line chart of rolling 30-day readmission rate, last 12 months, comparable to prior period
- One fully traced anonymized patient journey from discharge to safe resolution
- Filterable by risk tier and discharge unit

---

## 6. Scope

> **Guiding Principle:** v1 demonstrates art-of-the-possible. We show what a unified view looks like with existing data and existing systems. We are not solving the Epic–Salesforce integration.

### In Scope
- Coordinator triage view — risk-ordered patient queue
- Risk score display surfaced from Data Cloud
- Next best action panel powered by Agentforce
- Patient detail view with merged Epic + Salesforce timeline
- Call outcome logging (writes to Salesforce Health Cloud)
- Patient assignment and reassignment by managers
- Manager dashboard: KPI tiles, team caseload, unassigned alerts
- Executive summary view with trend line and patient journey trace
- Agentforce-triggered SMS via Marketing Cloud (initiation only)
- MyChart follow-up scheduling deep link

### Out of Scope — v1
- Solving or replacing the Epic–Salesforce sync architecture
- Building a new risk scoring model (consume existing Data Cloud score)
- Clinical documentation or charting
- Direct Epic write-back (read-only from Epic in v1)
- Patient-facing features beyond scheduling deep link
- Inpatient or pre-discharge workflows
- Automated outbound calling or IVR
- Custom ML model training
- Mobile-native app (responsive web only)

---

## 7. Functional Requirements

### F1 — Coordinator Triage Queue
| Requirement | Detail |
|---|---|
| Risk-ordered patient list | Sorted by risk score descending. Filters: risk tier, days since discharge, call status. |
| Risk score display | 0–100 composite score from Data Cloud. Inputs visible. Data freshness timestamp shown. |
| Patient quick view | Detail panel: demographics, diagnosis, discharge date, Epic medications, last contact, next best actions. |
| Filter chips | All · High Risk · Uncontacted · No Follow-Up Scheduled · Escalate Flagged. Counts update in real time. |

### F2 — Next Best Actions (Agentforce)
| Requirement | Detail |
|---|---|
| NBA panel per patient | Up to 3 prioritized actions: type, rationale, timing, execution mode (manual vs. automated). |
| Automated action triggers | One-click trigger for automated actions (e.g., SMS). Confirmation shown; action logged to timeline. |
| Dismiss & reason | Any NBA dismissible. Reason optional. Does not re-surface unless patient signal changes. |
| AI attribution | All Agentforce content labeled. Reasoning shown (e.g., "No PCP follow-up — high readmission correlation"). |

### F3 — Patient Timeline
| Requirement | Detail |
|---|---|
| Unified event feed | Chronological merge: Epic clinical events + Salesforce engagement events. Source labeled on each. |
| Call log entry | Outcome + notes from timeline. Writes to Salesforce Health Cloud activity record. |
| Data freshness indicator | Banner if Epic data > 4 hours old. Last-sync timestamp always visible. |

### F4 — Manager Dashboard
| Requirement | Detail |
|---|---|
| KPI summary tiles | High/Medium/Low counts, unassigned (red if > 0), % contacted within 48h, rolling readmission rate. |
| Unassigned patient alert | Alert panel: high-risk unassigned patients, inline assignment dropdown. |
| Team caseload table | Per-coordinator: caseload, high-risk count, calls today, uncontacted, last activity. Sortable. |
| Reassignment | Manager reassigns any patient. Logged to timeline. Coordinator notified in-app. |

### F5 — Executive Summary View
| Requirement | Detail |
|---|---|
| 30-day readmission trend | Line chart, 12-month rolling, comparable to prior period. Filterable. |
| Patient journey trace | Anonymized end-to-end journey: discharge → safe resolution, all system touchpoints. |
| System contribution view | Engagement actions by source system to demonstrate orchestration value. |

---

## 8. Integration Architecture

```
Epic EHR ──────────────► Salesforce Data Cloud ──────────────► Care Coordination App
                         (unified patient profile,                  (React layer)
                          risk score 0–100)
                                                                      ↕
                                                           Salesforce Health Cloud
                                                           (read + write: call logs,
                                                            assignments, cases)
                                                                      ↕
                                                                 Agentforce
                                                            (NBA recommendations)
                                                                  ↙     ↘
                                                    Marketing Cloud    MyChart
                                                     (SMS triggers)   (deep link)
```

| System | Direction | Data |
|---|---|---|
| Epic EHR | Read-only via Data Cloud | Diagnoses, discharge events, medications, vitals flags, prior admissions |
| Salesforce Data Cloud | Read | Unified patient profile, risk score (0–100), freshness timestamp |
| Salesforce Health Cloud | Read + Write | Assignments, call logs, coordinator notes, case status |
| Agentforce | Read | NBA recommendations per patient with reasoning labels |
| Marketing Cloud | Write (trigger only) | SMS/email journey triggers for opted-in patients |
| MyChart | Deep link out | Pre-populated scheduling link for PCP follow-up |

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Triage queue loads < 2s for up to 200 patients. Score refresh runs in background without blocking UI. |
| Availability | 99.5% uptime 6am–8pm CT. Graceful degradation if Data Cloud or Agentforce unavailable — show last known state with staleness banner. |
| Security & HIPAA | PHI over TLS 1.2+. Auth via Salesforce SSO. RBAC: coordinator sees assigned patients only; manager sees team; CMO sees aggregate only. Full audit log. |
| Accessibility | WCAG 2.1 AA. Keyboard navigation. Risk badges use color + text (never color alone). |
| Browser Support | Chrome/Edge latest, Safari 16+. Responsive at 1280px+. |
| Data Freshness | Epic data max 4h lag. Health Cloud writes reflected within 60s. Staleness always visible. |

---

## 10. Constraints

### Organizational
- **Unionized workforce.** Coordinators and social workers are union members. Any change perceived as replacing job functions requires formal labor relations engagement. Tool must be designed as assistant, not agent.
- **No single data owner.** UCM has no body that owns cross-system patient engagement data. This product does not create one — but it will surface pressure to establish one.
- **CMO influence, not authority.** CMO is a champion but does not operationally own care coordination. Adoption requires the operational leadership chain.

### Technical
- **Epic–Salesforce sync delay.** Up to 4-hour lag. App must communicate this and cannot promise real-time clinical data.
- **Epic read-only in v1.** No Epic write access. Clinical record updates remain in Epic.
- **Agentforce readmission use case in flight.** Not yet production-ready. NBA panel must be buildable against a mock contract.
- **Risk score is a black box.** App should display score inputs and as-of date — not treat the score as authoritative without context.

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Coordinator resistance due to union concerns about AI displacement | High | High | Design NBAs as explicitly advisory. Co-design sessions with coordinator leads before dev. |
| Coordinators acting on stale Epic risk scores | High | Medium | Always display data-as-of timestamp. Staleness banner when > 4h old. Train coordinators that score is a guide. |
| Agentforce readmission NBAs not ready for build | Medium | Medium | Build NBA panel against mocked data contract first. Swap in live output when available. |
| No organizational owner → no adoption post-demo | Medium | High | CMO sponsors governance conversation. Demo includes recommended ownership model slide. |
| Risk score model changes break coordinator mental model | Low | Medium | Display score inputs alongside score. Version-stamp the model. Alert users on model update. |
| UCM community context (South Side Chicago) not in risk model | Medium | Medium | Flag as known limitation. Coordinator notes field allows qualitative context the model may miss. |

---

## 12. Open Questions

1. **Who owns the risk score model?** Is there a validated, production-ready model in Data Cloud today, or does one need to be defined?
   *Owner: Slalom + UCM Data Team*

2. **What is the Agentforce NBA data contract?** What fields and recommendation types will it return? We need a contract — even mocked — to build against.
   *Owner: Slalom + UCM Agentforce Team*

3. **How are coordinators currently assigned patients in Salesforce?** Is there an existing assignment model in Health Cloud, or is it informal?
   *Owner: UCM Operations + Salesforce Admin*

4. **What is the union engagement process for new tooling?** Who initiates it and what lead time is required before pilot?
   *Owner: UCM HR / Labor Relations*

5. **What Epic data is currently flowing into Data Cloud?** We need a confirmed field list to scope what the risk score and timeline can actually show.
   *Owner: UCM IT / Epic Integration Team*

6. **Is the CMO the right executive sponsor, or is the COO?** The operational problem sits closer to the COO. The right adoption sponsor may differ from the right demo sponsor.
   *Owner: Slalom Account Team + UCM*
