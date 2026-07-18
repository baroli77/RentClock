import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cleanDraft, requireSeoAdmin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { admin } = await requireSeoAdmin(supabase);
    const { data: opportunity, error: findError } = await admin
      .from("seo_opportunities")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !opportunity) {
      return NextResponse.json({ error: "SEO opportunity not found." }, { status: 404 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Add OPENAI_API_KEY in Vercel before generating drafts." },
        { status: 503 }
      );
    }

    // The only data sent to OpenAI is the selected SEO content brief below.
    // No RentClock customer, property, certificate or reminder data is read.
    const prompt = `Create a high-quality UK landlord SEO content brief for RentClock, a SaaS that helps small landlords track compliance deadlines. Do not give personalised legal advice and do not invent laws, dates, penalties or sources. Be genuinely useful and avoid keyword stuffing. Write a publishable guide, not merely an outline: each section must contain two or three concise paragraphs of accurate, plain-English content. Flag facts that need verification rather than making them up.

Opportunity:
Title: ${opportunity.title}
Primary keyword: ${opportunity.primary_keyword}
Search intent: ${opportunity.search_intent}
Page type: ${opportunity.page_type}
Existing URL: ${opportunity.source_url || "None"}
Editor notes: ${opportunity.notes || "None"}

Return only valid JSON:
{
  "title": "SEO title under 60 characters where possible",
  "metaDescription": "Meta description under 155 characters",
  "slug": "guides/example-slug",
  "intro": "Two useful introductory sentences",
  "sections": [{"heading":"...","paragraphs":["paragraph one","paragraph two"]}],
  "faqs": [{"question":"...","answer":"..."}],
  "internalLinks": [{"anchor":"...","target":"/guides/..."}],
  "sourcesToVerify": ["Specific official source or legislation to fact-check before publication"]
}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        temperature: 0.35,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error?.message || "OpenAI could not create the draft.");
    }

    const output =
      result.output_text ||
      result.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text;
    const draft = cleanDraft(output);

    const nextStatus = opportunity.status === "published" ? "published" : "ready";
    const { data: saved, error: saveError } = await admin
      .from("seo_opportunities")
      .update({ draft, status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (saveError) throw new Error(saveError.message);
    return NextResponse.json({ opportunity: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to generate draft." },
      { status: 500 }
    );
  }
}
