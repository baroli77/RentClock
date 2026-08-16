# RentClock agent instructions

## Project

RentClock is a compliance deadline tracker for small landlords in England.

Repository:
`/home/ollie/projects/RentClock`

Stack:
- Next.js
- Supabase
- Stripe
- Resend
- Vercel

## Sources of truth

- Database schema/history: `supabase/migrations`
- Compliance rules/status logic: `lib/compliance.js`
- Current implementation: repository code
- Product knowledge: `~/.hermes/skills/rentclock/references/`

## Safety

Do not without explicit authorization:

- push directly to main,
- merge,
- deploy,
- change production Supabase data,
- change live Stripe configuration,
- change production Vercel environment variables,
- send live external email,
- publish external marketing content,
- spend money.

## Code-change workflow

1. Inspect current branch/status.
2. Create a descriptive branch.
3. Make the smallest appropriate change.
4. Run relevant tests/lint/build.
5. Inspect the diff.
6. Report findings and risks.
7. Stop before merge/deploy unless explicitly authorized.

## Architecture rules

- Keep compliance logic shared rather than duplicating rules.
- Treat `supabase/migrations` as authoritative.
- Keep Stripe billing state server-controlled.
- Keep service-role secrets server-side.
- Preserve RLS ownership boundaries.
- Preserve reminder idempotency/deduplication.
- Use Europe/London semantics for UK compliance calendar dates where appropriate.
- Do not normalise `properties.payload` without a clear reason and migration plan.

## Legal/compliance work

Product logic is not automatically legal truth.

For current legal claims:
- verify authoritative current sources,
- distinguish law from guidance/good practice,
- report uncertainty,
- do not silently rewrite compliance rules based on memory.

## Audits

When asked to audit:
- default to read-only,
- rank findings by severity/user impact,
- cite file/line evidence,
- distinguish confirmed bugs from hypotheses,
- do not "fix as you go" unless asked.
