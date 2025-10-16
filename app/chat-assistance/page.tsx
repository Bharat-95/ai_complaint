"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";


type ChatMessage = { role: "user" | "assistant"; content: string; outOfScope?: boolean };

export default function Page() {
   const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome! I can help you register complaints and navigate the Western Cape Rental Housing Tribunal. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const chips = [
    "📝 Lodge Complaint",
    "📄 Required Documents",
    "📋 Tenant Rights",
    "🤝 Mediation Process",
    "💰️ Deposit Issue",
    "⏱️ Processing Time",
  ];

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(toSend?: string) {
    const text = (toSend ?? input).trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { reply: string; outOfScope?: boolean };
      setMessages((m) => [...m, { role: "assistant", content: data.reply, outOfScope: data.outOfScope }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry — I couldn’t reach the AI service right now. Check your API key or server logs and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onChipClick(label: string) {
    const mapped: Record<string, string> = {
      "📝 Lodge Complaint":
        "Guide me to lodge a complaint with the Western Cape Rental Housing Tribunal. What steps and forms do I need?",
      "📄 Required Documents":
        "List the documents required to file a complaint with the Western Cape Rental Housing Tribunal.",
      "📋 Tenant Rights":
        "Summarise key tenant rights and common landlord obligations in South Africa.",
      "🤝 Mediation Process":
        "Explain the Tribunal mediation process, timelines, and what happens at a hearing.",
      "💰️ Deposit Issue":
        "My landlord won’t return my deposit. What should I do and what evidence helps?",
      "⏱️ Processing Time":
        "Typical processing time from submission to outcome at the Tribunal and factors that affect it.",
    };

    const prompt = mapped[label] ?? label;
    void send(prompt);
  }

  function connectToAgent() {
    window.location.href =
      "mailto:support@yourdomain.example?subject=Connect%20me%20to%20an%20agent%20(RHT)&body=Please%20call%20me%20about%20my%20rental%20housing%20issue.";
  }

  const goToFeedback = () => {
    router.push("/feedback")
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-teal-800 to-teal-300 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">

        <header className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-500 text-white">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-lg font-semibold">Rental Housing Tribunal Assistant</div>
              <div className="text-sm text-teal-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 inline-block" />
                <span>{loading ? "Thinking…" : "Online"}</span>
              </div>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={goToFeedback}
              aria-label="Close"
              className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </header>

  
        <main className="relative bg-white p-10 min-h-[56vh]">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">
              Welcome to the Rental Housing Tribunal!
            </h1>
            <p className="text-slate-500 max-w-xl">
              I'm here to help you register complaints and navigate the Rental Housing Tribunal process in the Western Cape. How can I assist you today?
            </p>
          </div>

        
          <div ref={chatRef} className="mt-6 max-h-[40vh] overflow-y-auto space-y-4 pr-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow relative " +
                    (m.role === "user"
                      ? "bg-teal-600 text-white rounded-tr-sm"
                      : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-sm")
                  }
                >
                  <div>{m.content}</div>
                  {m.outOfScope && m.role === "assistant" && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={connectToAgent}
                        className="px-3 py-1.5 text-xs rounded-full bg-teal-600 text-white shadow hover:opacity-90"
                      >
                        Connect me to an agent
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow bg-slate-50 text-slate-800 border border-slate-100">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" /> Thinking…
                  </span>
                </div>
              </div>
            )}
          </div>

        
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              {chips.map((label) => (
                <button
                  key={label}
                  onClick={() => onChipClick(label)}
                  className="px-4 py-2 rounded-full bg-teal-50 text-teal-700 border border-teal-100 shadow-sm hover:scale-[1.01] transition-transform text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </main>

        <div className="border-t border-slate-100 bg-white p-5 text-black">
          <div className="max-w-3xl mx-auto">
            <form
              className="flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 min-h-[56px] max-h-36 resize-none rounded-2xl border border-slate-100 p-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Emoji"
                  onClick={() => setInput((s) => (s ? s + " 🙂" : "🙂"))}
                  className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-xl"
                >
                  😊
                </button>
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={loading}
                  className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center shadow-lg disabled:opacity-60"
                >
                  ▶
                </button>
              </div>
            </form>
            <div className="mt-3 text-xs text-slate-400 text-center">
              You can also use the voice assistant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
