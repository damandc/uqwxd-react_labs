# AURA — App Skeleton

Reference architecture for the AURA concept (see `../VIRAL_STRATEGY_AURA.md`).
This is a **skeleton**, not a shippable build — it shows the security boundary,
the data model, and the BFF contract. No secrets live in the client.

```
aura/
├── client/            Expo / React Native app — anon JWT only, ZERO provider keys
│   ├── App.js
│   └── src/
│       ├── lib/       api client (talks to BFF) + anonymous identity
│       ├── screens/   AuraScreen (capture+render), VotesScreen (paywall)
│       └── components/ AuraCard
├── bff/               Serverless functions — the ONLY place keys exist
│   ├── functions/     generateAura, castVote, revealVoter
│   └── lib/           anthropic + supabase-admin clients
├── supabase/
│   └── schema.sql     tables + Row-Level Security (voter identity unreadable client-side)
└── .env.example       server-side env (never committed with real values)
```

## The security boundary (non-negotiable)

| Secret | Lives in | Never in |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | BFF secret manager | client bundle, client `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | BFF secret manager | client bundle |
| Supabase **anon/publishable** key | client (safe — RLS-gated) | — |
| Anonymous voter identity | server-only column, RLS-locked | any client response |

The reveal (who voted) is computed **server-side only**, after the BFF verifies
an active `AURA+` entitlement. A client cannot read voter identity by inspecting
the network tab — the column is unreadable under RLS and the BFF never returns it
without a verified receipt. That single rule kills the unmask exploit that has
nuked every prior anonymous-feedback app.

## Dependency guardrail

Every package below was chosen by hand. Do **not** `npm install` anything an LLM
suggests without verifying the exact name and publisher first
(slopsquatting/typosquatting is a supply-chain landmine). Pinned, vetted deps:

- client: `expo`, `react`, `react-native`, `expo-camera`, `expo-haptics`, `@supabase/supabase-js`
- bff: `@anthropic-ai/sdk`, `@supabase/supabase-js`

`npm install` has **not** been run in this skeleton — that's intentional.

## Run order (when you wire it up)

1. `supabase/schema.sql` → apply to your Supabase project (RLS on every table).
2. `bff/` → deploy `functions/*` to Firebase Cloud Functions / AWS Lambda / Vercel,
   with `ANTHROPIC_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` in the secret manager.
3. `client/` → set `EXPO_PUBLIC_BFF_URL` + the Supabase anon key, then `expo start`.
