
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STANDARD_REFUSAL =
  "I can’t answer that because it isn’t related to your Rental Housing Tribunal complaint or its details. Would you like me to connect you to an agent?";

const GREETING_REPLY =
  "Hi! I can help with your Rental Housing Tribunal (Western Cape) matter. I can guide you on lodging a complaint, required documents, tenant/landlord rights, mediation/hearings, deposits, timelines, and case updates. What would you like to do?";



function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    /^(hi|hello|hey|howdy|good (morning|afternoon|evening)|yo)\b/.test(t) ||
    /(how are you|what's up|whats up|sup)\b/.test(t)
  );
}


const IN_SCOPE_KEYWORDS = [
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
  "processing",
  "processing time",
  "timeline",
  "case number",
  "reference number",
  "notice",
  "eviction",
  "inspection",
  "repairs",
  "rent arrears",
  "hearing date",
  "acknowledgement",
  "acknowledgment",
];

function heuristicInScopeSingle(text: string): boolean {
  const t = text.toLowerCase();
  return IN_SCOPE_KEYWORDS.some((k) => t.includes(k));
}


function heuristicInScopeHistory(messages: ChatMessage[]): boolean {
  const convo = messages.map((m) => m.content).join(" ").toLowerCase();


  const hasScopeKeywords = IN_SCOPE_KEYWORDS.some((k) => convo.includes(k));


  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const asksTime =
    !!lastUser &&
    /\b(time|how long|timeline|weeks?|months?|processing)\b/i.test(lastUser.content);

  const hasRhtContext =
    /tribunal|rental|tenant|landlord|lease|deposit|mediation|hearing|complaint|western cape|rht/i.test(
      convo
    );

  return hasScopeKeywords || (asksTime && hasRhtContext);
}


const CANNED_TIMELINE_MD =
  "### Processing time (approximate)\n" +
  "- Most matters take **a few weeks to a few months**, depending on case complexity and the Tribunal’s caseload.\n" +
  "- After you **submit** a complaint, you should receive an **acknowledgement**. Mediation/hearing dates follow.\n" +
  "- Keep copies of all documents and follow up if you don’t hear back in **4–6 weeks**.\n\n" +
  "_Disclaimer: This is general guidance, not legal advice._";


async function openAIChat(
  apiKey: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: { model?: string; temperature?: number; signal?: AbortSignal }
): Promise<string> {
  const model = opts?.model ?? "gpt-4o-mini";
  const temperature = opts?.temperature ?? 0.3;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
    }),
    signal: opts?.signal,
  });

  if (!resp.ok) {
    throw new Error(`OpenAI error ${resp.status}: ${await resp.text()}`);
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? "";
}



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as ChatMessage[];
    const last = messages[messages.length - 1]?.content ?? "";


    if (isGreeting(last)) {
      return Response.json({ reply: GREETING_REPLY, outOfScope: false });
    }

   
    if (!process.env.OPENAI_API_KEY) {
      const inScope = heuristicInScopeHistory(messages) || heuristicInScopeSingle(last);
      if (!inScope) {
        return Response.json({ reply: STANDARD_REFUSAL, outOfScope: true });
      }
      
      if (/\b(time|how long|timeline|weeks?|months?|processing)\b/i.test(last)) {
        return Response.json({ reply: CANNED_TIMELINE_MD, outOfScope: false });
      }
  
      return Response.json({
        reply: `Mock reply (no OPENAI_API_KEY set). You asked: "${last}"\n\n_Disclaimer: This is general guidance, not legal advice._`,
        outOfScope: false,
      });
    }


    const inScopeHeuristic = heuristicInScopeHistory(messages) || heuristicInScopeSingle(last);

    if (!inScopeHeuristic) {

      const ctxSnippet = messages
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n")
        .slice(0, 1200);

      const verdict = await openAIChat(
        process.env.OPENAI_API_KEY,
        [
          {
            role: "system",
            content:
              "You are a strict classifier. Reply ONLY with 'IN' or 'OUT'. 'IN' if the message is about a Western Cape Rental Housing Tribunal complaint or details (lodging, forms, documents, rights, mediation, deposits, timelines, hearings, inspections, repairs, rent arrears, evictions, case numbers). Otherwise 'OUT'.",
          },
          {
            role: "user",
            content:
              "Classify the user's latest message using this recent conversation context.\n\n" +
              "=== Context Start ===\n" +
              ctxSnippet +
              "\n=== Context End ===\n\n" +
              "Reply strictly with IN or OUT.",
          },
        ],
        { model: "gpt-4o-mini", temperature: 0 }
      );

      if (verdict.trim().toUpperCase() === "OUT") {
        return Response.json({ reply: STANDARD_REFUSAL, outOfScope: true });
      }
    
    }

 
    const system =
      "You are a concise, helpful assistant specialised in South African rental housing law and the Western Cape Rental Housing Tribunal. " +
      "Provide practical, step-by-step guidance. Always reply in clean Markdown with short headings and lists where useful. " +
      "Do NOT include any out-of-scope fallback; the server handles that. End with: _Disclaimer: This is general guidance, not legal advice._";


    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000);

    const reply = await openAIChat(
      process.env.OPENAI_API_KEY,
      [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      { model: "gpt-4o-mini", temperature: 0.3, signal: ctrl.signal }
    );

    clearTimeout(timeout);

  
    const clean = reply.includes(STANDARD_REFUSAL) ? reply.replace(STANDARD_REFUSAL, "").trim() : reply;

    return Response.json({ reply: clean || CANNED_TIMELINE_MD, outOfScope: false });
  } catch (e) {
    console.error(e);
   
    return new Response("Bad Request", { status: 400 });
  }
}
