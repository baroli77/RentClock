# RentClock

Compliance deadline tracker for small landlords in England. Next.js + Supabase + Stripe + Resend.

Everything below assumes you've created the accounts listed in **SETUP-GUIDE.md** (read that first): GitHub, Vercel, Supabase (London region), Stripe, Resend, and a domain.

---

## 1. Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

- **Supabase** → project dashboard → Settings → API. Copy the URL, `anon` key, and `service_role` key.
- **Stripe** → leave blank for local development if needed. Billing fails closed in production if its required variables are missing.
- **Resend** → leave blank for now too. The cron route will just refuse to run.
- **CRON_SECRET** → any long random string.

## 2. Database

The versioned source of truth is `supabase/migrations`. For a fresh local project, run `supabase db reset`; for a linked remote project, review `supabase migration list` and then run `supabase db push`. The standalone `supabase/schema.sql` and `supabase/seo-schema.sql` files are readable snapshots, not a replacement for migration history.

That creates: `profiles` (auto-created on signup via trigger, holds billing state), `properties` (one row per property, RLS locked to the owner), `reminders_sent` (duplicate-email protection), and a private `certs` storage bucket where users can only touch their own folder.

Then: Authentication → URL Configuration → set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to redirect URLs. (Repeat with your live domain later.)

## 3. Run it

```bash
npm run dev
```

Go to `http://localhost:3000`, sign in with your email, click the magic link, add a property. Sign out, sign in again — your data should still be there. That's auth + RLS working.

## 4. Stripe

1. Stripe dashboard (test mode) → Products → create "RentClock", recurring, £5.99/month and optionally £59.90/year. Copy the price IDs into `STRIPE_PRICE_ID` and `STRIPE_PRICE_ID_ANNUAL`.
2. Copy the test secret key into `STRIPE_SECRET_KEY`.
3. Install the Stripe CLI, then:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`. Restart `npm run dev`.
4. Test the full loop with card `4242 4242 4242 4242`:
   - Subscribe from the dashboard paywall → status should become `trialing` in the `profiles` table.
   - Cancel via the Billing link (Stripe portal — enable it once at Settings → Billing → Customer portal) → status should become `canceled` and the dashboard should lock.

Both directions must work before launch. This is the step people screw up.

## 5. Reminders

1. Verify your domain in Resend (add their DNS records), set `RESEND_API_KEY` and `REMINDER_FROM`.
2. Test manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/reminders
   ```
   Set a gas cert date so the deadline lands exactly 60/30/14/7/0 days out (or already overdue) and confirm the email arrives. Run it twice — the second run must NOT send a duplicate.
3. In production, Vercel runs it daily at 08:00 UTC via `vercel.json`. Set `CRON_SECRET` in Vercel env vars; Vercel sends it automatically as the Authorization header.

**What the daily cron does:** dated-deadline reminders every day (60/30/14/7/0 days out, plus an overdue nudge), and — on Mondays only — a nag for recurring certificates that have no date recorded at all. Emails are sent as HTML with a plain-text fallback (`lib/email.js`). The `reminders_sent` table dedups everything, using threshold `-1` for overdue and `-2` for the weekly nag.

## 6. Deploy

1. Push to GitHub, import the repo in Vercel.
2. Add every var from `.env.local` to Vercel → Settings → Environment Variables. Change `NEXT_PUBLIC_SITE_URL` to your live domain.
3. Add your domain in Vercel → Domains, follow the DNS instructions.
4. Supabase → Authentication → URL Configuration → add your live domain + `/auth/callback`.
5. Stripe → Developers → Webhooks → Add endpoint: `https://yourdomain.co.uk/api/webhook`, events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Copy the live `whsec_...` into Vercel env vars.
6. Flip Stripe to live mode, create the live product/price, swap in live keys.
7. Subscribe yourself with a real card. Confirm trial → access → reminder email → cancellation → lockout. Refund yourself.

## 7. Legal

- Register with the ICO (~£40/yr): ico.org.uk
- Add privacy policy + terms pages (GetTerms or similar is fine to start).
- The "not legal advice" line is already in the footer. Keep it there.

## Architecture notes

- `lib/compliance.js` — all statutory rules and status logic, shared by UI and cron. Change a renewal interval in one place.
- `properties.payload` is jsonb — the whole property object as the UI uses it. Don't normalise until you have a reason to.
- Billing state only ever changes via Stripe webhooks using the service-role client. Users can't write their own `subscription_status` — there's deliberately no RLS policy for it.
- If `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` are unset, local development remains accessible. Production fails closed so a configuration mistake cannot silently remove the paywall.

## SEO & guides

The site ships SEO-ready: per-page titles/descriptions, OpenGraph + Twitter cards,
canonical URLs, `sitemap.xml`, `robots.txt`, an SVG favicon (`app/icon.svg`), and
JSON-LD structured data (SoftwareApplication + FAQ on the homepage, Article + FAQ on
each guide).

**IMPORTANT:** Set `NEXT_PUBLIC_SITE_URL` to the real domain in Vercel. The sitemap is
revalidated hourly so newly published database guides can appear without a redeploy.

**Adding a guide** (your main SEO lever): edit `lib/guides.js` and add an object to the
`GUIDES` array — slug, title, description, intro, sections, and faqs. The listing page,
the article page, the sitemap, and the structured data all pick it up automatically. No
new files needed. Publish the PRS-database guide well before registration opens so it
ages into ranking.

**Still yours to do:** a proper OpenGraph share image (currently text cards only — add
`app/opengraph-image.png`, 1200×630, for rich social previews), and submitting your
sitemap to Google Search Console once live.
