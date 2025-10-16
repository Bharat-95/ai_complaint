"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const VoiceAssistantPage = () => {
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [reply, setReply] = useState("");
  const recognitionRef = useRef<any>(null);


  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) { setSupported(false); return; }
    const recog = new Rec();
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = false;

    recog.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFinalText(transcript);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    recognitionRef.current = recog;
  }, []);


  const stopAll = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    try { window.speechSynthesis.cancel(); } catch {}
    setListening(false);
  }, []);


  useEffect(() => {
    const onVisibility = () => { if (document.hidden) stopAll(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stopAll);
    window.addEventListener("beforeunload", stopAll);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stopAll);
      window.removeEventListener("beforeunload", stopAll);
      stopAll();
    };
  }, [stopAll]);

  const speak = useCallback((text: string) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  }, []);

  useEffect(() => {
    const run = async () => {
      const text = finalText.trim();
      if (!text) return;
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
        });
        const data = await res.json();
        setReply(data.reply || "");
        speak(data.reply || "");
      } catch {
        const fallback = "Sorry, I couldn’t reach the service right now.";
        setReply(fallback);
        speak(fallback);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [finalText, speak]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    window.speechSynthesis.cancel();
    setReply("");
    setFinalText("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {}
  };

 
  const goToFeedback = () => {
    stopAll();
    const context = {
      last_user_utterance: finalText || "",
      last_ai_reply: reply || "",
      page: "voice-assistance",
    };
    sessionStorage.setItem("rht_feedback_context", JSON.stringify(context));
    router.push("/feedback");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#003C3C] via-[#00796B] to-[#00BFA6] text-white relative overflow-hidden">

      <div className="absolute top-6 flex items-center justify-between w-[90%] max-w-2xl bg-white/10 backdrop-blur-lg px-6 py-4 rounded-2xl shadow-md">
        <div>
          <h1 className="text-lg font-semibold">Rental Housing Tribunal Voice Assistant</h1>
          <p className="text-sm text-teal-100">
            {listening ? "Speak naturally, I'm listening..." : "Press to start speaking"}
          </p>
        </div>
        <button
          onClick={goToFeedback}
          className="text-white/70 hover:text-white text-xl font-bold"
          aria-label="Close"
        >
          ✕
        </button>
      </div>


      <div className="flex flex-col items-center justify-center mt-20">
        <div className={`w-56 h-56 rounded-full flex items-center justify-center transition-all duration-500 ${
          listening ? "bg-teal-400/30 animate-pulse shadow-[0_0_60px_10px_rgba(20,184,166,0.5)]" : "bg-white/10 shadow-inner"
        }`}>
          <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-teal-300 to-teal-600 shadow-2xl transition-all duration-500 ${
            listening ? "scale-110 animate-pulse" : "scale-100"
          }`} />
        </div>

        <div className="mt-8 text-center">
          {supported ? (
            listening ? <p className="text-teal-100 text-lg">🎤 Listening...</p>
            : loading ? <p className="text-teal-100 text-lg">🤔 Thinking...</p>
            : <p className="text-teal-100 text-lg">Tap below and speak naturally</p>
          ) : (
            <p className="text-red-300">Speech recognition not supported on this browser.</p>
          )}
        </div>

        <button
          onClick={startListening}
          disabled={!supported || listening}
          className={`mt-8 px-8 py-4 text-lg font-semibold rounded-full shadow-lg transition-transform ${
            listening ? "bg-emerald-400 text-white opacity-70 cursor-not-allowed"
                      : "bg-gradient-to-tr from-teal-600 to-teal-500 text-white hover:scale-[1.05]"
          }`}
        >
          {listening ? "Listening..." : "🎙️ Start Talking"}
        </button>

        <div className="mt-4 text-sm text-white/80">💡 Tip: Speak clearly and naturally</div>
      </div>

      <div className="absolute bottom-6 text-xs text-white/70">
        ⚡ Powered by <span className="text-white font-semibold">Nathan Digital AI</span>
      </div>
    </div>
  );
};

export default VoiceAssistantPage;
