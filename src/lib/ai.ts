// PatentSale — AI section-summary generation.
//
// Uses z-ai-web-dev-sdk (backend only — never import this from a client component).
// The admin can trigger on-demand AI summary generation for a given listing;
// these summaries appear on the marketplace card so buyers can gauge interest
// at a glance without opening the full record.
//
// Phase B (Prompt 3) will reuse this exact function to auto-generate summaries
// at listing-publish time for automated records.
import ZAI from "z-ai-web-dev-sdk";

export interface PatentSummaryInput {
  title: string;
  abstract?: string | null;
  claims?: string | null;
  fieldOfUse?: string | null;
}

export interface PatentSummaryOutput {
  summaryAbstract: string;
  summaryClaims: string;
  summaryField: string;
}

const SYSTEM_PROMPT = `You are a patent analyst writing concise, plain-English summaries that help a non-specialist buyer quickly gauge commercial interest. Write each summary in 1-2 short sentences (max ~40 words). Be concrete, avoid jargon, and do not invent facts not present in the source. If a section is missing or empty, write a single honest sentence noting insufficient information rather than fabricating.`;

function buildUserPrompt(p: PatentSummaryInput): string {
  return `Summarize this patent for a commercial marketplace buyer.

TITLE: ${p.title}

ABSTRACT:
${p.abstract || "(not provided)"}

CLAIMS (may be long; summarize the essential protected idea):
${p.claims ? p.claims.slice(0, 6000) : "(not provided)"}

FIELD OF USE:
${p.fieldOfUse || "(not provided)"}

Return STRICT JSON only, no markdown, with exactly these keys:
{"summaryAbstract": string, "summaryClaims": string, "summaryField": string}

- summaryAbstract: what the patent does, in plain language.
- summaryClaims: the essential protected idea / commercial moat.
- summaryField: the industries/applications where this could be deployed.`;
}

export async function generatePatentSummary(
  input: PatentSummaryInput
): Promise<PatentSummaryOutput> {
  const zai = await ZAI.create();
  const res = await zai.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
    temperature: 0.3,
    max_tokens: 600,
  });

  const content = res.choices?.[0]?.message?.content ?? "";

  // The model may wrap JSON in prose; extract the first {...} block.
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI returned no parseable JSON");
  }
  const parsed = JSON.parse(match[0]) as Partial<PatentSummaryOutput>;

  return {
    summaryAbstract: (parsed.summaryAbstract || "").trim() || "Summary unavailable.",
    summaryClaims: (parsed.summaryClaims || "").trim() || "Summary unavailable.",
    summaryField: (parsed.summaryField || "").trim() || "Summary unavailable.",
  };
}
