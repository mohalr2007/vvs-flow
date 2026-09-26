import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";

export const requestSchema = z.object({
  title: z.string(),
  summary: z.string(),
  urgency: z.enum(["Low", "Normal", "High", "Emergency"]),
  duration_min: z.number(),
  price_low: z.number(),
  price_high: z.number(),
  confidence: z.number(),
  needs_site_visit: z.boolean(),
  location_hint: z.string().nullable(),
  missing_fields: z.array(z.string()),
});
export type AiRequest = z.infer<typeof requestSchema>;

const SYSTEM = `You are the intake assistant for Ekström VVS, a solo plumber in Västerås, Sweden.
Structure a customer's plumbing request. Rules:
- title: short job name in English (max 5 words).
- summary: one sentence.
- urgency: Emergency only for active uncontrolled leaks/flooding; High for active leaks; else Normal/Low.
- duration_min: realistic on-site minutes, multiple of 15 (30–480).
- price_low/price_high: estimated SEK incl. VAT labour+basic parts (hourly 850 SEK). For renovations give site-visit 0/0.
- confidence: 0–100, how clearly the request maps to a known plumbing job. Unusual/vague requests must be below 60.
- needs_site_visit: true for renovations, installations or unclear problems.
- location_hint: area or address mentioned, else null.
- missing_fields: up to 3 short items still needed (e.g. "Exact address", "Photo of the leak"). Never ask for things already given.`;

export async function extractRequest(message: string, kind: string): Promise<{ data: AiRequest } | { error: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { error: "AI is not configured." };
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      return res;
    },
  });
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: SYSTEM,
      prompt: `Request type: ${kind}\nCustomer message:\n${message}`,
      experimental_output: Output.object({ schema: requestSchema }),
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    for await (const _ of result.textStream) { /* consume stream */ }
    const out = await result.experimental_output;
    const data = requestSchema.parse(out);
    data.confidence = Math.max(0, Math.min(100, Math.round(data.confidence)));
    data.duration_min = Math.max(30, Math.min(480, Math.round(data.duration_min / 15) * 15));
    data.missing_fields = data.missing_fields.slice(0, 3);
    return { data };
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) return { error: "The request could not be understood. Please add a few more details." };
    const status = (e as { statusCode?: number }).statusCode;
    console.error("AI intake failed", status, e);
    if (status === 402) return { error: "AI credits are exhausted. Your request can still be sent for manual review." };
    if (status === 429) return { error: "AI is busy right now. Please try again in a moment." };
    return { error: "AI understanding is temporarily unavailable. Your request can still be sent for manual review." };
  }
}
