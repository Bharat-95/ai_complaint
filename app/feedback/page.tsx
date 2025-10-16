"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type FeedbackPayload = {
  rating: number | null;
  comment: string;
  want_contact: boolean;
  contact?: string;
  last_user_utterance?: string;
  last_ai_reply?: string;
  page: string;
};

export default function FeedbackPage() {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [wantContact, setWantContact] = useState(false);
  const [contact, setContact] = useState("");
  const [context, setContext] = useState<{ last_user_utterance?: string; last_ai_reply?: string; page?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rht_feedback_context");
      if (raw) setContext(JSON.parse(raw));
    } catch {}
  }, []);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const r = typeof rating === "number" ? Math.min(5, Math.max(1, rating)) : null;

      const row = {
        rating: r,
        comment,
        want_contact: wantContact,
        contact: wantContact ? contact.trim() || null : null,
        last_user_utterance: context.last_user_utterance ?? null,
        last_ai_reply: context.last_ai_reply ?? null,
        page: context.page || "voice-assistance",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
      };

      const { error: insertError } = await supabaseBrowser.from("rht_feedback").insert(row);
      if (insertError) throw new Error(insertError.message);

      setSubmitted(true);
      sessionStorage.removeItem("rht_feedback_context");
    } catch (e: any) {
      setError(e?.message || "Failed to save feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003C3C] via-[#00796B] to-[#00BFA6] text-white p-4">
      <div className="w-full max-w-lg bg-[#0E1F1F] text-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">How was your experience?</div>
            <div className="text-sm text-teal-200">Your feedback helps improve the voice assistant.</div>
          </div>
          <button onClick={close} className="text-white/70 hover:text-white text-xl font-bold" aria-label="Close">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
       
          <div>
            <div className="text-sm text-teal-100 mb-3">Overall rating</div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-full grid place-items-center border transition ${
                    rating && rating >= n ? "bg-teal-500 border-teal-400" : "bg-white/5 border-white/15 hover:bg-white/10"
                  }`}
                  aria-label={`Rate ${n}`}
                >{n}</button>
              ))}
            </div>
          </div>

      
          <div>
            <div className="text-sm text-teal-100 mb-2">Anything to share?</div>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What worked well? What could be better?"
              className="w-full rounded-xl bg-white/5 border border-white/15 p-3 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

         
          <div className="flex items-center gap-3">
            <input
              id="wantContact"
              type="checkbox"
              className="w-4 h-4 accent-teal-500"
              checked={wantContact}
              onChange={(e) => setWantContact(e.target.checked)}
            />
            <label htmlFor="wantContact" className="text-sm text-teal-100">
              I'm happy for an agent to contact me
            </label>
          </div>
          {wantContact && (
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone"
              className="w-full rounded-xl bg-white/5 border border-white/15 p-3 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          )}

          {error && <div className="text-sm text-rose-300 bg-rose-900/20 border border-rose-800/40 rounded-lg p-2">{error}</div>}
          {submitted && <div className="text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-2">Thanks! Your feedback was sent.</div>}
        </div>

        <div className="px-6 py-5 border-t border-white/10 flex justify-end gap-3">
          <button onClick={close} className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10">Skip</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 rounded-lg bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
