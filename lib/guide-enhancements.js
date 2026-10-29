import { REGISTRATION_GUIDE } from "./registration-guide.js";

export const GUIDE_ENHANCEMENTS = {
  "prs-database-registration": REGISTRATION_GUIDE,
  "section-8-notice-landlords-2026": {
    title: "Section 8 Possession After 1 May 2026: Process for Landlords",
    description:
      "Section 21 has gone for assured periodic tenancies in England. Use this process map before serving a section 8 notice: ground, evidence, notice period, service and court.",
    updated: "2026-08-27",
    readMins: 9,
    intro:
      "Section 21 is no longer available for assured periodic tenancies in England. Possession now means a valid statutory ground, the correct section 8 notice, lawful service and \u2014 if the tenant stays \u2014 a court order. This page is a working sequence, not a substitute for advice on your tenancy.",
    sections: [
      {
        h: "The working process",
        p: ["Do the jobs in this order. Skipping the evidence or serving the wrong form is how landlords create a delay they then blame on the court."],
        steps: [
          "Confirm the tenancy is an assured periodic tenancy in England and that section 21 is not available.",
          "Choose the ground that actually matches the facts. Write down the evidence that proves each condition of that ground.",
          "Check deposit protection, prescribed information, gas/EICR/EPC records and any other compliance that can undermine possession.",
          "Read the current official notice-period table for that ground. Do not reuse a pre-May 2026 template.",
          "Complete the current prescribed section 8 form, naming the ground and attaching or referring to the required particulars.",
          "Serve the notice using a method you can prove, and diary the earliest date proceedings can start.",
          "If the tenant remains after that date, apply for a possession order. The notice itself does not evict anyone.",
          "Keep the notice, proof of service, rent schedule and compliance documents together for the claim.",
        ],
      },
      {
        h: "A legal ground is required",
        p: [
          "The section 8 notice must identify one or more statutory grounds for possession. Common examples include selling, moving in, serious rent arrears, tenancy breaches, property damage and antisocial behaviour.",
          "A ground is not a label to pick from a menu. Its conditions and evidence must actually be satisfied. Some grounds are mandatory if proved; others leave the decision to the court. If you cannot point to the evidence today, you do not have a ground today.",
        ],
      },
      {
        h: "Check these records before the notice",
        p: ["Possession claims go badly when the paperwork is incomplete. Before service, confirm what you can prove about this tenancy and this property."],
        steps: [
          "Deposit protected in an approved scheme and prescribed information given within 30 days of receipt.",
          "Current gas safety record where gas duties apply, and evidence it was given to the tenant.",
          "Current EICR and any required remedial completion evidence.",
          "Current EPC where one is required.",
          "Rent account showing the arrears calculation if an arrears ground is used.",
          "Written tenancy terms and any Renters\u2019 Rights information you were required to give.",
          "Access or inspection notes if disrepair or damage is part of the case.",
        ],
      },
      {
        h: "Notice periods depend on the ground",
        p: [
          "The minimum notice is ground-specific and can vary considerably. Official guidance says it is often at least two months and can be up to four months, while serious antisocial behaviour can allow proceedings to begin much sooner.",
          "Check the current prescribed form and official table at the time of service. Reusing an old template after the 2026 reforms is an excellent method of producing expensive waste paper.",
        ],
      },
      {
        h: "Selling and moving-in restrictions",
        p: [
          "The new selling and landlord-occupation grounds cannot be used for that reason during the first 12 months of a tenancy. They also carry conditions after possession that affect reletting or remarketing.",
          "Student accommodation has a separate ground with specific eligibility and advance-notice conditions. Do not assume every student letting qualifies.",
        ],
      },
      {
        h: "Court action still matters",
        p: [
          "A notice does not itself remove the tenant. If the tenant remains after the notice expires, the landlord must apply for a possession order and follow the lawful process.",
          "Deposit compliance and other statutory requirements can affect possession. Get case-specific advice before serving notice; this guide is a starting map, not litigation instructions.",
        ],
      },
    ],
    faqs: [
      { q: "Can landlords still use section 21?", a: "No, not for assured periodic tenancies from 1 May 2026." },
      { q: "Does a section 8 notice end the tenancy automatically?", a: "No. If the tenant stays, the landlord normally needs a court possession order." },
      { q: "What should I check before serving the notice?", a: "That the chosen ground matches the facts, the notice period is current, and core compliance records such as deposit protection and safety certificates will not undermine the claim." },
      { q: "Can I use a selling or moving-in ground immediately?", a: "Not for that reason during the first 12 months of the tenancy. Check the current official conditions and any post-possession restrictions." },
    ],
  },
};
