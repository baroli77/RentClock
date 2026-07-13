# RentClock — Setup Guide (start here)

This is the account-by-account setup the README refers to. Work top to bottom.
Nothing here needs coding — it's signups and copying keys. Budget an evening for
the accounts + first deploy, a weekend to have billing and reminders fully live.

Total fixed cost to launch: ~$20/month (Vercel Pro) + ~£10/year (domain) +
£40/year (ICO). Everything else has a free tier until you have real users.

---

## Order of play

1. Accounts (this file)
2. Then follow README.md for the actual build/deploy steps

---

## 1. GitHub — where your code lives
- Sign up at github.com (free).
- You'll push the RentClock code here; Vercel deploys from it.
- Easiest upload method: install GitHub Desktop (desktop.github.com), "Add Local
  Repository", point at your unzipped `rentclock-app` folder, commit, publish as
  **private**.

## 2. Vercel — hosting (points your domain at the app)
- Sign up at vercel.com using your GitHub login.
- IMPORTANT: RentClock takes payments, so it's a commercial project. Vercel's free
  "Hobby" tier bans commercial use — you need the **Pro** plan ($20/month). Start on
  Hobby to test if you like, but upgrade before taking a single real payment.
- You'll import your GitHub repo here later (README step 6).

## 3. Supabase — database, login, and document storage
- Sign up at supabase.com (free tier is fine to launch).
- Create a new project. **Region: London (eu-west-2)** — your users are in the UK.
- Save the database password it gives you somewhere safe.
- Settings → API: you'll copy three values later (Project URL, anon key,
  service_role key). Don't share the service_role key publicly — it bypasses security.

## 4. Stripe — subscriptions
- Sign up at stripe.com. "Sole trader" / your own name is fine to start.
- Stays in test mode until you're ready to launch — no real charges until you flip it.
- You'll create the £5.99/month and £59.90/year products later (README step 4).

## 5. Resend — reminder emails
- Sign up at resend.com (generous free tier).
- Later you'll verify your domain here so reminder emails come from
  reminders@yourdomain.co.uk instead of a spammy-looking address.

## 6. A domain name — your web address
- Buy from Cloudflare Registrar, Namecheap, or 123-reg (~£10/year).
- .co.uk reads as more trustworthy to UK landlords than .com — worth prioritising.
- You don't need this on day one; the free vercel.app URL works for testing. Buy it
  before you start marketing.

## 7. ICO registration — legal requirement (do before launch, not before testing)
- You store people's personal data, so UK law requires registering with the
  Information Commissioner's Office: ico.org.uk, ~£40/year, takes 10 minutes.
- Not optional once you have real users — the fine for not registering dwarfs the fee.

---

## Once all accounts exist

Open **README.md** and follow it from step 1. It covers: installing the code
locally, running the database schema, testing login, wiring Stripe (with the
critical webhook test), verifying reminder emails, deploying to Vercel, and
pointing your domain at it.

## The two things people get wrong (from the README, repeated because they matter)
- **Stripe webhooks:** test that subscribing unlocks the app AND that cancelling
  re-locks it. Both directions. This is the #1 place launches break.
- **Supabase redirect URLs:** every time your app gets a new URL (the vercel.app
  one, then your real domain), add it + `/auth/callback` to Supabase → Authentication
  → URL Configuration, or magic-link sign-in silently fails.
