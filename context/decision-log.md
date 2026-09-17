# Decision Log — UCM Care Coordination

Tracks decisions that change the **PRD** or **how personas show up in the product**.
Not a changelog — cosmetic and copy changes are out of scope. If a decision doesn't
alter scope, a requirement, or a persona's experience, it doesn't belong here.

**Status key:** `Active` · `Superseded` · `Open` (decided in principle, not yet built) · `Revisit`

---

## D-001 · Three personas, two of them primary
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom + workshop team

Care Coordinator (Sarah Lin) and Care Coordination Manager (James Porter) are both **primary**.
CMO (Dr. Reyes) is **secondary** — a demo and sponsorship audience, not a daily user.

**Why:** The transcript identifies the CMO as the internal champion who "likes flashy," but the
operational problem lives with coordinators and their managers. Designing primarily for the CMO
would produce a dashboard nobody uses daily.

**Affects:** `prd.md` §4 Personas, §5 User Stories. Establishes that manager and coordinator views
get equal design investment; executive view is narrative-first.

---

## D-002 · Custom React orchestration layer, not a Salesforce-native app
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom

Build a standalone React application that reads from both Epic (via Data Cloud) and Salesforce,
rather than building inside Salesforce with SLDS components.

**Why:** A Salesforce-native build implicitly takes Salesforce's side in the "death match" and
inherits its sync constraints. A neutral layer above both systems is the only position from which
conflicts between them can be arbitrated.

**Trade-off accepted:** Higher integration burden and a new surface for coordinators to learn,
against the transcript's explicit warning that the solution "must live within their existing
workflows." Mitigated by keeping the tool single-purpose and writing back to Salesforce so no
double entry is required.

**Affects:** `prd.md` §2 Vision, §8 Integration Architecture, §10 Constraints.

---

## D-003 · v1 does not attempt to fix the Epic–Salesforce integration
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Account team (from transcript)

Scope explicitly excludes solving or replacing the sync architecture. The product demonstrates
what becomes possible when the data is joined at the point of decision.

**Why:** Direct quote from the session — *"The goal of this isn't necessarily to solve for the
death match. The goal is to show art of the possible."* Attempting the integration would consume
the entire engagement and produce nothing demonstrable.

**Affects:** `prd.md` §6 Scope (Out of Scope), §11 Risks.

---

## D-004 · AI recommendations are advisory and always dismissible
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Workshop team

Every Agentforce-generated next best action is labeled as a recommendation, shows its reasoning,
and can be dismissed in one click with an optional reason.

**Why:** Coordinators and social workers are unionized. The transcript warns they "are going to
push back pretty hard from having parts of their job turned over to AI." A tool that appears to
make clinical decisions will not be adopted regardless of accuracy.

**Affects:** `prd.md` §2 Design Principle, §7 F2, §11 Risks (top-ranked risk).
**Persona impact:** Directly shapes Sarah Lin's experience — she is positioned as the decision-maker,
the system as her assistant.

---

## D-005 · Separate HTML page per persona, with a routing launcher
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom

Rather than one app with role switching, the prototype ships `coordinator.html`, `manager.html`,
and `executive.html`, launched from `index.html`.

**Why:** Workshop demo format. Each persona's view can be opened directly, shown in isolation, and
reasoned about without navigating role state. The launcher doubles as a persona summary for the room.

**Affects:** Prototype structure only — not a production architecture recommendation.
**Revisit when:** Moving from prototype to build. Production should be one app with RBAC per
`prd.md` §9 Non-Functional.

---

## D-006 · Role-based color theming across views
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Claude, accepted by Tom

Coordinator view is UCM maroon, manager view is blue, executive view is dark neutral.

**Why:** During a live demo it must be instantly obvious which persona's screen is being shown.
Ambiguity here wastes presenter time re-orienting the room.

**Affects:** Presentation only. No PRD impact.

---

## D-007 · Data provenance is structural, not decorative
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom

Every value on screen carries a source tag. A fixed color language identifies the originating
system: Epic teal, Salesforce blue, Agentforce violet, Marketing Cloud orange. **UCM maroon is
reserved exclusively for the orchestration layer** — maroon on screen means "this app did that work."

**Why:** The product's entire claim is that it joins two systems. If provenance is a grey footnote,
the claim is asserted rather than demonstrated.

**Sub-decision — Epic is rendered teal, not its brand red:** Epic's actual brand red is nearly
indistinguishable from UCM maroon, which would collapse the single most important distinction
in the visual system.

**Affects:** `design-system.html` §Data Provenance. Adds a requirement to `prd.md` §7 that
source attribution accompany displayed values.

---

## D-008 · The risk score is presented as composable arithmetic
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom

The score is shown as *clinical subtotal (Epic) + engagement subtotal (Salesforce) = unified score*,
with each contributing factor tagged by source and point weight.

**Why:** This is the single clearest proof of the product thesis — neither system can produce this
number alone. It also addresses the PRD constraint that the score not be a black box.

**Affects:** `prd.md` §7 F1 (risk score display must show inputs and weights), §10 Constraints
(risk model transparency), §12 Open Question 1.
**Persona impact:** Gives Sarah Lin a reason to trust the ordering of her queue, and gives her
language to explain prioritization to a skeptical colleague.

---

## D-009 · Conflicts between Epic and Salesforce are surfaced, not hidden
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom

Where the two systems disagree, the app shows both values, states which one it chose, and explains
the rule applied. Unresolvable conflicts are escalated for manual review rather than silently picked.

**Why:** Hidden reconciliation is indistinguishable from a bug when it's wrong. Showing the
arbitration is what makes the orchestration layer trustworthy — and it is the most concrete
demonstration of "remediating" the two systems.

**Affects:** `prd.md` §7 (new requirement — conflict display and resolution rules), §9
Non-Functional (audit log must record resolution decisions), §12 Open Questions (resolution
rules need UCM sign-off).
**Persona impact:** New surface for James Porter — a reconciliation health panel quantifying
conflicts resolved, conflicts pending, and patients only visible when both systems are joined.

---

## D-010 · Manager actions propagate to the coordinator in real time
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom

A shared session layer carries manager actions — assignment, reassignment, direct messages,
priority flags — into the coordinator's view without a reload. Coordinator actions (call logged,
message acknowledged) propagate back to the manager's activity feed.

**Why:** The two primary personas were previously demonstrated in isolation, which under-sold the
product. The handoff *between* them is the actual operational loop — a manager spotting an
unassigned high-risk patient and getting it into a coordinator's hands is the mechanism by which
this product prevents readmissions.

**Affects:** `prd.md` §5 (new user stories for delegation and messaging), §7 (new feature area —
F6 Delegation & Messaging), §9 Non-Functional (real-time propagation requirement).
**Persona impact:** Significant for both primaries. Sarah Lin gains an inbox and newly-assigned
patient alerts. James Porter's assignment control becomes consequential rather than illustrative.

**Prototype limitation:** Implemented with `localStorage` and cross-tab events. Production requires
a real-time backend (Salesforce Platform Events or similar).

---

## D-011 · Executive metrics are placeholders, explicitly
**Date:** 2026-09-17 · **Status:** Open · **Flagged by:** Claude

The executive view shows specific figures — 214 readmissions avoided, $3.2M cost avoided, 18.4%
readmission rate. These are invented for demo plausibility and are **not sourced from UCM data**.

**Why flagged:** A CMO view is meaningless without concrete numbers, but these numbers will be
read as real if presented without caveat. Risk of over-promising in a client setting.

**Required before client demo:** Either replace with UCM-supplied baseline figures, or add a
visible "illustrative" watermark to the executive view.

**Affects:** `prd.md` §3 Goals & Metrics — targets need validation against actual UCM baseline.

---

## D-012 · PRD in markdown; design system and personas in HTML
**Date:** 2026-09-17 · **Status:** Active · **Decided by:** Tom

**Why:** The PRD is a working document that will be edited, diffed, and pasted into other tools.
The design system and personas are reference artifacts whose value is partly visual.

**Affects:** Documentation format only.

---

## Open Threads

Carried from `prd.md` §12 — decisions that cannot be made without UCM input:

| # | Question | Blocks |
|---|---|---|
| 1 | Who owns the risk score model? Does a validated one exist? | D-008 — the score composition shown is illustrative until confirmed |
| 2 | What is the Agentforce NBA data contract? | D-004 — recommendation shape and reasoning fields |
| 3 | How are coordinators assigned patients in Salesforce today? | D-010 — delegation must map to an existing data model |
| 4 | What is the union engagement process for new tooling? | D-002, D-004 — adoption path |
| 5 | What Epic fields flow into Data Cloud today? | D-007, D-008 — scopes what can actually be displayed |
| 6 | Is the CMO or the COO the right executive sponsor? | D-001 — may reprioritize the executive view |
