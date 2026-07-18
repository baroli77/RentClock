import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SEED_KEYWORDS = [
  "landlord compliance",
  "gas safety certificate landlord",
  "EICR landlord",
  "EPC landlord",
  "tenant deposit protection",
  "right to rent checks",
  "HMO licence",
  "landlord responsibilities",
];

const RELEVANT_PATTERNS = [
  /\blandlord\b/i,
  /\blandlord registration\b/i,
  /\btenancy deposit\b/i,
  /\bdeposit protection\b/i,
  /\bgas safety\b/i,
  /\bgas certificate\b/i,
  /\beicr\b/i,
  /\belectrical safety\b/i,
  /\bepc\b/i,
  /\bright to rent\b/i,
  /\bshare code\b/i,
  /\bhmo\b/i,
  /\bhouse in multiple occupation\b/i,
  /\brenters'? rights\b/i,
  /\bsection 21\b/i,
  /\bproperty licensing\b/i,
  /\bselective licensing\b/i,
  /\bfire safety\b/i,
];

function isRelevantGuideIdea(item) {
  const keyword = String(item.keyword || "").trim();
  const intent = String(item.search_intent_info?.main_intent || "").toLowerCase();
  if (!keyword || intent === "navigational") return false;
  return RELEVANT_PATTERNS.some((pattern) => pattern.test(keyword));
}

function suggestedTitle(keyword) {
  return `UK landlord guide: ${keyword.replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
}

function priorityFor(item) {
  const volume = Number(item.keyword_info?.search_volume || 0);
  const difficulty = Number(item.keyword_properties?.keyword_difficulty);
  const demandScore = Math.min(35, Math.round(Math.log10(Math.max(volume, 1)) * 8));
  const difficultyBonus = Number.isFinite(difficulty) ? Math.max(0, Math.round((70 - difficulty) / 5)) : 5;
  return Math.max(45, Math.min(95, 50 + demandScore + difficultyBonus));
}

export async function POST() {
  try {
    const supabase = await createClient();
    await requireSeoAdmin(supabase);

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) {
      return NextResponse.json(
        { error: "Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Vercel before researching keywords." },
        { status: 400 }
      );
    }

    const authorization = Buffer.from(`${login}:${password}`).toString("base64");
    const response = await fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{
        keywords: SEED_KEYWORDS,
        location_name: "United Kingdom",
        language_name: "English",
        filters: [["keyword_info.search_volume", ">", 20]],
        order_by: ["keyword_info.search_volume,desc"],
        limit: 30,
      }]),
      cache: "no-store",
    });

    const payload = await response.json();
    const task = payload?.tasks?.[0];
    if (!response.ok || payload?.status_code !== 20000 || !task || task.status_code !== 20000) {
      throw new Error(task?.status_message || payload?.status_message || "DataForSEO did not return keyword ideas.");
    }

    const seen = new Set();
    const ideas = (task.result?.[0]?.items || [])
      .filter(isRelevantGuideIdea)
      .map((item) => ({
        keyword: item.keyword,
        suggestedTitle: suggestedTitle(item.keyword),
        searchVolume: Number(item.keyword_info?.search_volume || 0),
        competition: item.keyword_info?.competition_level || null,
        difficulty: item.keyword_properties?.keyword_difficulty ?? null,
        intent: item.search_intent_info?.main_intent || "informational",
        priority: priorityFor(item),
      }))
      .sort((a, b) => b.priority - a.priority || b.searchVolume - a.searchVolume)
      .filter((item) => !seen.has(item.keyword.toLowerCase()) && seen.add(item.keyword.toLowerCase()))
      .slice(0, 12);

    return NextResponse.json({ ideas, cost: task.cost || null });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not research keyword ideas." },
      { status: 500 }
    );
  }
}
