// ---------------------------------------------------------------------------
// SEO guide articles. Each is structured content rendered by the guide page.
// Written to rank for real landlord compliance searches and funnel to signup.
// Keep facts verifiable; these are the pages that earn organic traffic.
// ---------------------------------------------------------------------------

export const GUIDES = [
  {
    slug: "prs-database-registration",
    title: "The PRS Database for Landlords: What It Is and How to Register",
    description:
      "The Renters' Rights Act introduces a national Private Rented Sector database. Here's who must register, what it means for landlords, and how to prepare before it opens.",
    updated: "2026-07-01",
    readMins: 6,
    intro:
      "The Renters' Rights Act 2025 creates a new national Private Rented Sector (PRS) database for England. Most private landlords will be legally required to register themselves and their properties on it. This guide explains what the database is, who it applies to, and how to get ahead of the deadline.",
    sections: [
      {
        h: "What is the PRS database?",
        p: [
          "The PRS database is a national digital register of private landlords and their rented properties in England, introduced under the Renters' Rights Act. It's intended to give tenants, councils and the new PRS ombudsman a single source of information about who is letting property and whether they meet their legal obligations.",
          "In practice it means most landlords will need to create an entry for themselves and register each property they let, keeping the details up to date. Certain compliance information is expected to be recorded against each property.",
        ],
      },
      {
        h: "Who has to register?",
        p: [
          "The requirement is expected to apply to private landlords letting residential property in England under the tenancy types covered by the Act. If you let a property to private tenants, you should assume you'll be in scope and plan accordingly.",
          "There are likely to be limited exceptions, and the precise scope is set out in regulations that follow the Act. Because the detail is still being finalised, the safest approach is to prepare to register rather than assume you're exempt.",
        ],
      },
      {
        h: "When does registration open?",
        p: [
          "The database is being introduced in phases following the Act, with the register expected to come into operation from late 2026 onwards. Exact dates are confirmed through secondary legislation and government announcements.",
          "Once it's live, letting a property without being properly registered is expected to carry financial penalties, so knowing your start date matters. Deadlines like this are exactly what RentClock is built to track — we'll flag PRS registration in your ledger the moment it applies to your properties.",
        ],
      },
      {
        h: "What will you need to register?",
        p: [
          "While the final data fields are set in regulations, landlords should expect to provide identifying details for themselves and each property, and to link relevant compliance records — the kind of information you should already be keeping: gas safety, electrical safety (EICR), energy performance (EPC) and deposit protection details.",
          "Having these documents organised and their renewal dates to hand will make registration far quicker. If they're currently scattered across your inbox and a filing cabinet, now is the time to get them in one place.",
        ],
      },
      {
        h: "How to prepare now",
        p: [
          "Three practical steps. First, gather your current certificates for every property and check none have lapsed. Second, record the renewal date for each so nothing expires just as the database launches. Third, watch for the confirmed commencement date and register promptly once it opens.",
          "RentClock does the first two for you: add your properties, attach each certificate, and it counts down every renewal — then adds PRS registration to your checklist as soon as it goes live.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is the PRS database the same as a landlord licence?",
        a: "No. Selective and additional licensing schemes run by individual councils are separate. The PRS database is a single national register introduced by the Renters' Rights Act, and you may need to comply with both.",
      },
      {
        q: "What happens if I don't register?",
        a: "Once the database is in force, letting a property without registering is expected to carry financial penalties. The precise amounts are set in regulations following the Act.",
      },
      {
        q: "When exactly does it open?",
        a: "The register is expected to come into operation from late 2026, with exact timing confirmed through secondary legislation. Check GOV.UK for the confirmed date, or let RentClock flag it for you.",
      },
    ],
  },
  {
    slug: "landlord-compliance-checklist-2026",
    title: "Landlord Compliance Checklist 2026 (England)",
    description:
      "Every legal obligation for private landlords in England in 2026 — gas, electrical, EPC, deposits, and the new Renters' Rights Act duties — with how often each is due.",
    updated: "2026-07-01",
    readMins: 8,
    intro:
      "Letting a property in England means meeting a stack of legal obligations, several of them on recurring deadlines, and 2026 adds new duties under the Renters' Rights Act. This checklist runs through what's required, how often, and where landlords most often slip up.",
    sections: [
      {
        h: "Gas safety (annual)",
        p: [
          "If your property has gas appliances, you must have them checked every 12 months by a Gas Safe registered engineer and obtain a Gas Safety Certificate (CP12). You must give tenants a copy within 28 days of the check, and provide it to new tenants before they move in.",
          "A useful quirk: if you renew within the final two months of the current certificate, the new expiry date runs from the old one rather than the inspection date — so you don't lose time by renewing early.",
        ],
      },
      {
        h: "Electrical safety — EICR (every 5 years)",
        p: [
          "Private landlords must have the fixed electrical installations inspected and tested at least every five years by a qualified person, and obtain an Electrical Installation Condition Report (EICR). Tenants must receive a copy within 28 days.",
          "If the report requires remedial work, you generally have 28 days (or sooner if specified) to complete it and confirm completion. Breaches can bring council penalties of up to £30,000.",
        ],
      },
      {
        h: "Energy performance — EPC (every 10 years)",
        p: [
          "You need a valid Energy Performance Certificate, renewed every ten years, and currently a minimum rating of band E to let the property lawfully. Minimum energy efficiency standards have been the subject of consultation and may tighten, so track both your certificate's expiry and its band.",
          "An in-date EPC on a property rated below the minimum is still a problem — the rating matters as much as the date.",
        ],
      },
      {
        h: "Deposit protection (within 30 days)",
        p: [
          "If you take a deposit, you must protect it in a government-approved scheme within 30 days of receiving it, and give the tenant the prescribed information. Get this wrong and you can face penalties of one to three times the deposit and lose the ability to regain possession by the usual route.",
        ],
      },
      {
        h: "Right to Rent and the 'How to Rent' guide",
        p: [
          "Before the tenancy starts you must check every adult occupier's right to rent and keep records. You must also give tenants the current government 'How to Rent' guide at the start of the tenancy.",
        ],
      },
      {
        h: "New Renters' Rights Act duties (2026 onwards)",
        p: [
          "The Renters' Rights Act, in force from 1 May 2026, brings additional obligations phasing in over the following years: a written statement of terms for new tenancies, a tenant information sheet for tenancies that pre-date the Act, mandatory PRS ombudsman membership, and registration on the new national PRS database.",
          "Because these land in stages, the practical challenge is simply knowing which duty applies to which tenancy and by when — precisely the kind of thing that's easy to miss when you're managing it in your head.",
        ],
      },
      {
        h: "Smoke and carbon monoxide alarms",
        p: [
          "You must have working smoke alarms and, where there's a fixed combustion appliance, carbon monoxide alarms, and ensure they work at the start of each tenancy. An annual test is sensible practice to stay on the right side of the rules.",
        ],
      },
    ],
    faqs: [
      {
        q: "How often does a gas safety certificate need renewing?",
        a: "Every 12 months, by a Gas Safe registered engineer. Renew within the final two months and the new certificate's expiry runs from the old date, so you don't lose time.",
      },
      {
        q: "What's the fine for a lapsed EICR?",
        a: "Local authorities can impose financial penalties of up to £30,000 for breaches of the electrical safety regulations.",
      },
      {
        q: "Does the Renters' Rights Act apply to existing tenancies?",
        a: "Yes — some duties apply to tenancies that pre-date the Act's commencement, such as providing a tenant information sheet, while others apply to new tenancies. Which applies depends on when the tenancy began.",
      },
    ],
  },
];

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}
