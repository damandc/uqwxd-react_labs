# AURA — App Store Rejection Wargame

The anonymous-voting mechanic is the growth engine *and* the single biggest
review risk. Apple has a graveyard of NGL/Gas/Sendit clones — some pulled,
some throttled, some that survived. This is the honest threat model and the
build constraints that keep AURA on the right side of the line.

> **Bottom line:** shippable, but only if anonymous votes are treated as
> user-generated content from minute one — moderation, blocking, reporting, and
> a hard 17+ age gate are **launch features, not v2**. The weekly paywall is
> fine as long as it isn't bolted to a fake-engagement loop. Build it clean and
> approval is routine; cut these corners and it's a 4.3/1.1/1.2 rejection.

---

## The five real rejection vectors

### 1. Guideline 1.2 — Safety: User-Generated Content (THE big one)

Anonymous one-word votes are UGC. Apple **requires** all four of these for any
app hosting UGC, and reviewers test them live on anonymous-messaging apps:

- [ ] **A content filter** on submitted words (slurs, threats, sexual content) —
  server-side, in `castVote.js`, before the row is written.
- [ ] **A report mechanism** — the owner can flag any vote; flagged content is
  reviewable and removable.
- [ ] **A block mechanism** — the owner can block a voter so their future votes
  are suppressed (works even though the voter is "anonymous" — you hold
  `voter_id` server-side, so blocking is enforceable without unmasking).
- [ ] **Act on reports within 24h** — a moderation queue + a published contact.

**Why AURA is well-positioned:** because the BFF already stores `voter_id`
server-side (for the paid reveal), block/report enforcement is trivial — you can
suppress or ban a voter the owner never sees. Apps that built true zero-knowledge
anonymity *can't* enforce blocking and get stuck. Our architecture makes
compliance cheaper, not harder.

**Build constraint:** add `report_vote` and `block_voter` BFF endpoints + a
`blocked` table before submission. Non-negotiable.

### 2. Guideline 1.2 — Bullying / harassment surface

Apple specifically scrutinizes anonymous Q&A/messaging because of teen
cyberbullying precedent (this is what got Sarahah pulled and Sendit/NGL
throttled). Mitigations that demonstrably help approval:

- One-**word**-only votes (not free text) materially shrinks the harassment
  surface — keep it constrained. Free-text DMs would sharply raise risk.
- Filter on a curated allow/deny list, not just profanity regex.
- No notifications that quote raw negative content to minors.

### 3. Guideline 1.3 — Age rating (Kids / 17+)

Anonymous social → rate **17+** and gate it. Do **not** let it land in Kids
categories or under-13 funnels. An honest 17+ rating with an age gate is far
safer than a 12+ rating a reviewer disputes. (NGL settled with the FTC in 2024
over minors + deceptive AI-generated messages — see vector 5.)

### 4. Guideline 3.1.1 — In-App Purchase (the paywall)

The weekly AURA+ sub **must** use Apple IAP (StoreKit) for this digital unlock —
you cannot route the reveal payment through Stripe/web checkout. That's fine and
expected. Watch-outs that trigger 3.1.1 / 3.1.2 rejections:

- [ ] Weekly auto-renewable subscription, clearly disclosed price + terms on the
  paywall **before** purchase.
- [ ] No dark-pattern framing of the cliffhanger ("pay or lose your data").
- [ ] Server-side receipt verification → writes the `entitlements` row the BFF
  reads in `revealVoter.js`. (Already the architecture.)
- [ ] Restore-purchases flow present.

The curiosity paywall itself is **allowed** — gating a feature behind a sub is
standard. The risk is purely in disclosure and renewal clarity.

### 5. Guideline 2.3.1 / FTC — "fake" voters or AI posing as real people

**This is the landmine that actually cost money.** NGL paid a **$5M FTC
settlement (2024)** partly for sending AI-generated/computer-generated messages
that users believed came from real friends. Apple 2.3.1 (hidden/undocumented
features) compounds it.

**Hard rule for AURA:** the AI generates the user's *own* aura card (the selfie
verdict) — that's disclosed and fine. The AI must **never** fabricate votes or
seed fake "friends voted" activity. Every vote in the votes feed must be a real
human submission. If the feed is empty, it's empty. Faking the social proof is
both an Apple rejection and an FTC liability.

- [ ] Add a one-line disclosure: aura verdicts are AI-generated; friend votes are
  from real people.
- [ ] Zero synthetic votes, ever — no "starter" bots to warm the feed.

---

## What is genuinely fine (don't over-rotate)

- **Anonymous voting** as a category — permitted with the UGC controls above.
- **The curiosity paywall / cliffhanger** — gating reveals behind a sub is legal
  and Apple-compliant; it's a value exchange, not a dark pattern, as long as
  disclosure is clean.
- **Weekly micro-subscription pricing** — fully supported by StoreKit.
- **Parasitic Story-sticker sharing** — link stickers are an intended IG/Snap
  surface; no Apple issue.
- **Anonymous device identity / no signup** — Apple *prefers* minimal data
  collection. Our <5s onboarding is an asset here, not a risk.

---

## Pre-submission checklist (the gate before you ship)

| # | Item | Owner | Blocks submission? |
|---|------|-------|:---:|
| 1 | Word content filter in `castVote.js` | BFF | ✅ |
| 2 | `report_vote` endpoint + moderation queue | BFF | ✅ |
| 3 | `block_voter` endpoint + `blocked` table | BFF | ✅ |
| 4 | 17+ age rating + age gate | Client | ✅ |
| 5 | StoreKit weekly sub + receipt verification | Client + BFF | ✅ |
| 6 | Restore purchases | Client | ✅ |
| 7 | AI-disclosure copy (verdict AI / votes real) | Client | ✅ |
| 8 | Published abuse-contact + 24h response SLA | Ops | ✅ |
| 9 | No synthetic/seeded votes anywhere | BFF | ✅ |

Ship all nine and the anonymous mechanic clears review. Skip 1–3 or 9 and it
gets pulled — that's the difference between the clones that survived and the
ones that didn't.

> Not legal advice — App Review guidelines and FTC posture shift. Re-check
> Guideline 1.2 and the latest anonymous-social enforcement actions before each
> submission.
