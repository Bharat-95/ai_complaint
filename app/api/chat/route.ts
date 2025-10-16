import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const STANDARD_REFUSAL =
  "I can’t answer that because it isn’t related to your Rental Housing Tribunal complaint or its details. Would you like me to connect you to an agent?";

const GREETING_REPLY =
  "Hi! I can help with your Rental Housing Tribunal (Western Cape) matter. I can guide you on lodging a complaint, required documents, tenant/landlord rights, mediation/hearings, deposits, timelines, and case updates. What would you like to do?";

function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase();
  // quick pleasantry/greeting patterns
  return /^(hi|hello|hey|howdy|good (morning|afternoon|evening)|yo)\b/.test(t) ||
         /(how are you|what's up|whats up|sup)\b/.test(t);
}

function heuristicInScope(text: string): boolean {
  const t = text.toLowerCase();
  const allow = [
    "complaint",
    "tribunal",
    "western cape",
    "rht",
    "tenant",
    "landlord",
    "lease",
    "deposit",
    "mediation",
    "hearing",
    "documents",
    "forms",
    "processing time",
    "case number",
    "reference number",
    "notice",
    "eviction",
    "inspection",
    "repairs",
    "rent arrears",
  ];
  return allow.some((k) => t.includes(k));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as Array<{ role: string; content: string }>;
    const last = messages[messages.length - 1]?.content ?? "";

    // Always allow a friendly greeting, but steer back to scope
    if (isGreeting(last)) {
      return Response.json({ reply: GREETING_REPLY });
    }

    // No API key: simple heuristic + mock response
    if (!process.env.OPENAI_API_KEY) {
      if (!heuristicInScope(last)) {
        return Response.json({ reply: STANDARD_REFUSAL, outOfScope: true });
      }
      return Response.json({
        reply: `Mock reply (no OPENAI_API_KEY set). You asked: "${last}"`,
      });
    }

    // Gatekeeper classification via LLM
    const gate = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a strict classifier. Reply ONLY with 'IN' or 'OUT'. 'IN' if the user's message is about a Rental Housing Tribunal (Western Cape) complaint or its details (lodging, forms, documents, rights, mediation, deposits, timelines, hearings, inspections, repairs, rent arrears, evictions, case numbers). Otherwise reply 'OUT'.",
          },
          { role: "user", content: last },
        ],
      }),
    });

    if (gate.ok) {
      const data = await gate.json();
      const verdict = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();
      if (verdict === "OUT") {
        return Response.json({ reply: STANDARD_REFUSAL, outOfScope: true });
      }
    } else if (!heuristicInScope(last)) {
      return Response.json({ reply: STANDARD_REFUSAL, outOfScope: true });
    }

    // In-scope: generate real answer
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a concise, helpful assistant specialised in South African rental housing law and the Western Cape Rental Housing Tribunal. Provide practical, step-by-step guidance. Include a brief disclaimer that this is not legal advice.",
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!resp.ok) return new Response(await resp.text(), { status: resp.status });

    const reply = (await resp.json()).choices?.[0]?.message?.content ?? "(No reply)";
    return Response.json({ reply });
  } catch (e) {
    console.error(e);
    return new Response("Bad Request", { status: 400 });
  }
}
