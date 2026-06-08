import React, { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";

const t = {
  bg: "#080B0F", surface: "#0E1318", card: "#131920", border: "#1C2530",
  accent: "#F5A623", green: "#00D084", red: "#FF4757", blue: "#3B82F6",
  purple: "#8B5CF6", text: "#EEF2FF", muted: "#5A6478", dim: "#2A3545",
};

const s = {
  app: { fontFamily: "'DM Sans', sans-serif", background: t.bg, minHeight: "100vh", color: t.text },
  layout: { display: "flex", minHeight: "100vh" },
  sidebar: { position: "fixed", top: 0, left: 0, width: "220px", height: "100vh", background: t.surface, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", zIndex: 100, boxShadow: "4px 0 30px rgba(0,0,0,0.6)" },
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99 },
  main: { flex: 1, overflow: "auto" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: `1px solid ${t.border}`, background: t.surface, position: "sticky", top: 0, zIndex: 10 },
  content: { padding: "28px" },
  card: { background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "22px", marginBottom: "18px" },
  label: { display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: t.muted, textTransform: "uppercase", marginBottom: "8px" },
  input: { width: "100%", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "11px 14px", color: t.text, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "14px" },
  textarea: { width: "100%", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "11px 14px", color: t.text, fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", minHeight: "80px", marginBottom: "14px" },
  btn: (v = "primary") => ({ padding: "10px 20px", borderRadius: "8px", border: v === "ghost" ? `1px solid ${t.border}` : "none", cursor: "pointer", fontSize: "13px", fontWeight: "700", background: v === "primary" ? t.accent : v === "green" ? t.green : v === "red" ? t.red : v === "purple" ? t.purple : "transparent", color: ["primary","green","red","purple"].includes(v) ? "#000" : t.muted }),
  badge: (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "700", background: `${color}20`, color: color, letterSpacing: "1px", textTransform: "uppercase" }),
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", cursor: "pointer", border: "none", width: "100%", textAlign: "left", background: active ? `${t.accent}18` : "transparent", color: active ? t.accent : t.muted, fontSize: "13px", fontWeight: active ? "700" : "400", borderLeft: active ? `3px solid ${t.accent}` : "3px solid transparent" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
};

function PulsingDot({ color }) {
  return (
    <div style={{ position: "relative", width: "10px", height: "10px", flexShrink: 0 }}>
      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, position: "absolute" }} />
      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, position: "absolute", opacity: 0.4, animation: "ping 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes ping{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(2.2);opacity:0}}`}</style>
    </div>
  );
}

const defaultScript = {
  companyName: "J&K Delivery Services",
  ownerNumber: "(313) 662-4077",
  transferNumber: "(313) 662-4077",
  greeting: "Thank you for calling {companyName}. This is the AI assistant. How can I help you today? Press 0 at any time to speak with customer service.",
  hiringSpeech: "Yes, we are currently hiring CDL drivers. I can get you scheduled for orientation. Can I get your full name and best callback number?",
  hoursSpeech: "Our dispatch is available Monday through Friday 6 AM to 8 PM, and Saturday 7 AM to 3 PM.",
  locationSpeech: "Our main office is located at 4400 Industrial Drive, Chicago IL 60601.",
  transferSpeech: "Let me get you to our customer service team right away. One moment please.",
  closingSpeech: "Is there anything else I can help you with? Thank you for calling {companyName}. Have a great day!",
  bookingConfirm: "You are all set! Your appointment has been booked and you will receive a text confirmation shortly.",
  fallback: "I want to make sure you get the right help. Let me connect you with our team.",
};

const defaultCalls = [
  { id: 1, caller: "James Mitchell", phone: "(312) 555-0182", time: "Today 9:14 AM", duration: "2m 34s", intent: "Hiring Inquiry", status: "Booked", summary: "Caller asked about Class A openings. Booked orientation Jun 10.", transcript: [{ role: "ai", text: "Thank you for calling J&K Delivery Services. How can I help you today?" }, { role: "caller", text: "I am looking for a Class A driving job, are you hiring?" }, { role: "ai", text: "Yes we are hiring. I can schedule you for orientation. What is your name?" }] },
  { id: 2, caller: "Robert Sims", phone: "(773) 555-0088", time: "Yesterday 11:20 AM", duration: "4m 22s", intent: "Hiring Inquiry", status: "Booked", summary: "Class B driver inquiry. Booked interview for Jun 12.", transcript: [{ role: "ai", text: "Thank you for calling J&K Delivery Services. How can I help?" }, { role: "caller", text: "I got a Class B CDL and I am looking for work." }, { role: "ai", text: "We have Class B openings. Can I get your name and callback number?" }] },
  { id: 3, caller: "Tanya Brooks", phone: "(404) 555-0319", time: "Yesterday 3:45 PM", duration: "3m 08s", intent: "Load/Route Question", status: "Transferred", summary: "Driver asked about load assignment. Transferred to dispatch.", transcript: [{ role: "ai", text: "Thank you for calling J&K Delivery Services. How can I help?" }, { role: "caller", text: "I need to know about my load tomorrow." }, { role: "ai", text: "For load assignments I will connect you with dispatch now." }] },
];

// ─── LIVE VOICE COMPONENT ────────────────────────────────────────────────────
function LiveVoiceCall({ script, vapiKey, assistantId, onNewCall }) {
  const [callState, setCallState] = useState("idle");
  const [transcript, setTranscript] = useState([]);
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [intent, setIntent] = useState("");
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const vapiRef = useRef(null);
  const timerRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [transcript]);
  useEffect(() => {
    if (callState === "active") { timerRef.current = setInterval(() => setDuration(d => d + 1), 1000); }
    else { clearInterval(timerRef.current); if (callState === "idle") setDuration(0); }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const addLine = useCallback((role, text) => setTranscript(prev => [...prev, { role, text, id: Date.now() + Math.random() }]), []);

  const startCall = useCallback(async () => {
    if (!vapiKey) { setError("Paste your Vapi Public Key in the field above first."); return; }
    setError(""); setCallState("connecting"); setTranscript([]); setDuration(0); setIntent("");
    try {
      const vapi = new Vapi(vapiKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => { setCallState("active"); addLine("system", "Call connected — AI is live and listening"); });
      vapi.on("speech-start", () => { setIsSpeaking(true); setVolume(1); });
      vapi.on("speech-end", () => { setIsSpeaking(false); setVolume(0); });
      vapi.on("message", (msg) => {
        if (msg.type === "transcript" && msg.transcriptType === "final") {
          const role = msg.role === "assistant" ? "ai" : "caller";
          addLine(role, msg.transcript);
          if (role === "caller") {
            const lower = msg.transcript.toLowerCase();
            if (lower.includes("hiring") || lower.includes("job") || lower.includes("work")) setIntent("Hiring Inquiry");
            else if (lower.includes("hours") || lower.includes("location") || lower.includes("address")) setIntent("Hours & Location");
            else if (lower.includes("load") || lower.includes("route") || lower.includes("dispatch")) setIntent("Load/Route Question");
            if (lower.trim() === "0" || lower.includes("real person") || lower.includes("talk to") || lower.includes("operator")) {
              addLine("system", "Press 0 detected — transferring to owner...");
              setTimeout(() => { vapi.stop(); setCallState("transferred"); }, 1500);
            }
          }
        }
      });
      vapi.on("call-end", () => {
        setCallState("ended"); setVolume(0); setIsSpeaking(false);
        onNewCall({ caller: "Live Caller", phone: "Via Vapi", intent: intent || "General Inquiry", status: "Resolved", summary: "Live voice call completed via Vapi AI." });
      });
      vapi.on("error", (err) => {
        const msg = err?.message || "";
        if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid")) setError("Invalid API key. Make sure you are using the Public Key from Vapi.");
        else if (msg.includes("assistant")) setError("Assistant not found. Double-check your Assistant ID.");
        else if (msg.includes("microphone") || msg.includes("permission")) setError("Microphone permission denied. Please allow microphone access.");
        else setError("Error: " + (msg || "Check your public key and assistant ID."));
        setCallState("idle");
      });

      if (assistantId) {
        await vapi.start(assistantId);
      } else {
        await vapi.start({
          transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
          model: {
            provider: "openai", model: "gpt-4o-mini",
            messages: [{ role: "system", content: `You are a professional AI phone receptionist for ${script.companyName}. Be warm, concise, and professional. Start with: "${script.greeting.replace("{companyName}", script.companyName)}". If someone asks about jobs: ${script.hiringSpeech}. If someone asks about hours: ${script.hoursSpeech}. If someone asks about location: ${script.locationSpeech}. If someone asks about their route or load assignment: tell them to check their driver portal for their assigned route, or their dispatcher will have their route ready by 5 AM the morning of their shift. CRITICAL: Only transfer if you cannot help them. If the caller says 0, presses 0, says operator, real person, talk to someone, or asks for customer service — immediately use the transferCall tool to transfer to +13136624077. Say: One moment please, connecting you with our customer service team at J&K Delivery Services now. Please hold. Closing: ${script.closingSpeech.replace("{companyName}", script.companyName)}` }],
          },
          voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
          firstMessage: script.greeting.replace("{companyName}", script.companyName),
        });
      }
    } catch (err) {
      setError(err.message || "Could not start call. Check your Vapi Public Key.");
      setCallState("idle");
    }
  }, [vapiKey, assistantId, script, intent, addLine, onNewCall]);

  const endCall = () => { if (vapiRef.current) vapiRef.current.stop(); setCallState("ended"); setVolume(0); setIsSpeaking(false); };
  const reset = () => { setCallState("idle"); setTranscript([]); setIntent(""); setError(""); setDuration(0); };

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>Live Voice AI — Powered by Vapi</div>
          <div style={{ fontSize: "12px", color: t.muted }}>Real voice. Real AI. Caller speaks, AI listens and responds live.</div>
        </div>
        <span style={s.badge(callState === "active" ? t.green : callState === "connecting" ? t.accent : callState === "transferred" ? t.purple : callState === "ended" ? t.muted : t.dim)}>
          {callState === "active" ? "● LIVE" : callState === "connecting" ? "CONNECTING..." : callState === "transferred" ? "TRANSFERRED" : callState === "ended" ? "ENDED" : "READY"}
        </span>
      </div>

      {error && (
        <div style={{ background: `${t.red}15`, border: `1px solid ${t.red}40`, borderRadius: "10px", padding: "13px 18px", marginBottom: "16px", color: t.red, fontSize: "13px" }}>
          {error}
          <button onClick={() => setError("")} style={{ float: "right", background: "transparent", border: "none", color: t.red, cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>✕</button>
        </div>
      )}

      {callState === "idle" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📞</div>
          <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px" }}>Start a Live AI Voice Call</div>
          <div style={{ fontSize: "13px", color: t.muted, marginBottom: "28px" }}>Your microphone activates. The AI answers and speaks in real time.</div>
          <button style={{ ...s.btn("green"), padding: "14px 44px", fontSize: "14px" }} onClick={startCall}>🎙 Start Live Voice Call</button>
          <div style={{ fontSize: "11px", color: t.muted, marginTop: "12px" }}>Requires microphone · Powered by Vapi + ElevenLabs</div>
        </div>
      )}

      {callState === "connecting" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: "40px", marginBottom: "14px" }}>⏳</div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: t.accent }}>Connecting to AI Voice...</div>
          <div style={{ fontSize: "12px", color: t.muted, marginTop: "6px" }}>Loading voice model · Enabling microphone</div>
        </div>
      )}

      {(callState === "active" || callState === "ended") && (
        <>
          {callState === "active" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.surface, borderRadius: "10px", padding: "12px 16px", marginBottom: "14px", border: `1px solid ${t.green}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <PulsingDot color={t.green} />
                <div style={{ fontSize: "13px", fontWeight: "700", color: t.green }}>{isSpeaking ? "AI IS SPEAKING..." : "AI IS LISTENING..."}</div>
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, fontFamily: "monospace" }}>{fmtTime(duration)}</div>
            </div>
          )}
          <div style={{ background: t.surface, borderRadius: "10px", padding: "16px", height: "260px", overflowY: "auto", marginBottom: "14px", border: `1px solid ${t.border}` }}>
            {transcript.length === 0 && <div style={{ textAlign: "center", color: t.muted, fontSize: "13px", paddingTop: "80px" }}>Transcript appears here as conversation happens...</div>}
            {transcript.map((line, i) => (
              <div key={i} style={{ display: "flex", justifyContent: line.role === "caller" ? "flex-end" : line.role === "system" ? "center" : "flex-start", marginBottom: "10px" }}>
                {line.role === "system" ? <div style={{ fontSize: "11px", color: t.muted, fontStyle: "italic" }}>{line.text}</div> : (
                  <div style={{ maxWidth: "78%" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: line.role === "ai" ? t.accent : t.blue, letterSpacing: "1px", marginBottom: "4px" }}>{line.role === "ai" ? "AI ASSISTANT" : "CALLER"}</div>
                    <div style={{ background: line.role === "ai" ? `${t.accent}15` : `${t.blue}15`, border: `1px solid ${line.role === "ai" ? t.accent + "30" : t.blue + "30"}`, borderRadius: "8px", padding: "10px 13px", fontSize: "13px", lineHeight: "1.5" }}>{line.text}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {intent && <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}><span style={{ fontSize: "12px", color: t.muted }}>Detected intent:</span><span style={s.badge(t.purple)}>{intent}</span></div>}
          {callState === "active" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { addLine("system", `Transferring to owner at ${script.ownerNumber || "owner number not set"}...`); if (vapiRef.current) vapiRef.current.stop(); setCallState("transferred"); }} style={{ flex: 1, background: `${t.purple}18`, border: `1px solid ${t.purple}40`, borderRadius: "8px", padding: "11px", cursor: "pointer", color: t.purple, fontSize: "13px", fontWeight: "700" }}>
                ☎ Press 0 — Transfer to Customer Service
              </button>
              <button style={{ ...s.btn("red"), padding: "11px 20px" }} onClick={endCall}>End Call</button>
            </div>
          )}
          {callState === "ended" && <button style={{ ...s.btn("ghost"), width: "100%", padding: "12px" }} onClick={reset}>Start New Call</button>}
        </>
      )}

      {callState === "transferred" && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: "44px", marginBottom: "14px" }}>☎️</div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.purple, marginBottom: "6px" }}>Connected to Customer Service</div>
          <div style={{ fontSize: "13px", color: t.muted, marginBottom: "8px" }}>Caller is now speaking with customer service</div>
          <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>{script.ownerNumber || "Set customer service number in Script Builder"}</div>
          <button style={s.btn("ghost")} onClick={reset}>End & Start New Call</button>
        </div>
      )}
    </div>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────
function LiveCallPage({ script, onNewCall }) {
  const [vapiKey, setVapiKey] = useState(localStorage.getItem("vapi_key") || "");
  const [assistantId, setAssistantId] = useState(localStorage.getItem("vapi_assistant_id") || "");
  const [saved, setSaved] = useState(!!localStorage.getItem("vapi_key"));
  const keyRef = React.useRef(vapiKey);
  const asstRef = React.useRef(assistantId);

  const saveKeys = () => {
    localStorage.setItem("vapi_key", keyRef.current);
    localStorage.setItem("vapi_assistant_id", asstRef.current);
    setVapiKey(keyRef.current);
    setAssistantId(asstRef.current);
    setSaved(true);
  };

  return (
    <>
      <div style={{ ...s.card, border: `1px solid ${saved ? t.green + "40" : t.accent + "40"}`, background: saved ? `${t.green}08` : `${t.accent}08`, marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "700", color: saved ? t.green : t.accent, marginBottom: "10px" }}>
          {saved ? "✓ Vapi Connected" : "Connect Your Vapi Account"}
        </div>
        <div style={{ fontSize: "12px", color: t.muted, marginBottom: "16px" }}>
          {saved ? "Your API key is saved. You can update it below anytime." : "Paste your Vapi Public Key to enable live voice calls. Get it at vapi.ai → API Keys."}
        </div>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Vapi Public Key</label>
            <input style={s.input} type="password" placeholder="Paste your Vapi Public Key here" defaultValue={vapiKey} onChange={e => { keyRef.current = e.target.value; }} />
          </div>
          <div>
            <label style={s.label}>Assistant ID (optional)</label>
            <input style={s.input} placeholder="From Vapi Assistants page" defaultValue={assistantId} onChange={e => { asstRef.current = e.target.value; }} />
          </div>
        </div>
        <button style={s.btn("primary")} onClick={saveKeys}>Save & Connect</button>
        {saved && <span style={{ fontSize: "12px", color: t.green, marginLeft: "12px", fontWeight: "600" }}>Keys saved to this browser</span>}
      </div>

      <LiveVoiceCall script={script} vapiKey={vapiKey} assistantId={assistantId} onNewCall={onNewCall} />

      <div style={s.card}>
        <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>How to Go Live — 3 Steps</div>
        {[
          { n: "1", title: "Get Your Vapi Public Key", desc: "Go to vapi.ai → Sign in → Click API Keys in the sidebar → Copy your Public Key", color: t.accent },
          { n: "2", title: "Get Your Assistant ID", desc: "In Vapi → Click Assistants → Click your assistant → Copy the ID at the top of the page", color: t.blue },
          { n: "3", title: "Paste Both Above & Hit Save", desc: "Paste your Public Key and Assistant ID above → Click Save & Connect → Then hit Start Live Voice Call", color: t.green },
        ].map(item => (
          <div key={item.n} style={{ display: "flex", gap: "14px", padding: "14px 0", borderBottom: `1px solid ${t.border}20`, alignItems: "flex-start" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: `${item.color}20`, border: `1px solid ${item.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: item.color, flexShrink: 0 }}>{item.n}</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: t.muted, lineHeight: "1.6" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Dashboard({ calls }) {
  const intents = calls.reduce((acc, c) => { acc[c.intent] = (acc[c.intent] || 0) + 1; return acc; }, {});
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total Calls", value: calls.length, color: t.blue },
          { label: "Booked", value: calls.filter(c => c.status === "Booked").length, color: t.green },
          { label: "Resolved by AI", value: calls.filter(c => c.status === "Resolved").length, color: t.accent },
          { label: "Transferred", value: calls.filter(c => c.status === "Transferred").length, color: t.purple },
        ].map(st => (
          <div key={st.label} style={{ ...s.card, borderTop: `3px solid ${st.color}`, marginBottom: 0 }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: t.muted, textTransform: "uppercase", marginBottom: "8px" }}>{st.label}</div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: st.color, lineHeight: 1 }}>{st.value}</div>
          </div>
        ))}
      </div>
      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Recent Calls</div>
          {calls.slice(0, 6).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${t.border}20` }}>
              <div><div style={{ fontSize: "14px", fontWeight: "600" }}>{c.caller}</div><div style={{ fontSize: "12px", color: t.muted }}>{c.phone} · {c.time}</div></div>
              <span style={s.badge(c.status === "Booked" ? t.green : c.status === "Resolved" ? t.accent : t.purple)}>{c.status}</span>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Call Intents</div>
          {Object.entries(intents).map(([intent, count]) => (
            <div key={intent} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <div style={{ fontSize: "13px" }}>{intent}</div><div style={{ fontSize: "13px", color: t.accent, fontWeight: "700" }}>{count}</div>
              </div>
              <div style={{ background: t.border, borderRadius: "99px", height: "5px" }}>
                <div style={{ background: t.accent, borderRadius: "99px", height: "5px", width: `${(count / calls.length) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CallLog({ calls }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={s.grid2}>
      <div style={s.card}>
        <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>All Calls ({calls.length})</div>
        {calls.map(c => (
          <div key={c.id} onClick={() => setSelected(c)} style={{ padding: "13px", borderRadius: "8px", marginBottom: "8px", cursor: "pointer", background: selected?.id === c.id ? `${t.accent}15` : t.surface, border: `1px solid ${selected?.id === c.id ? t.accent + "40" : t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><div style={{ fontSize: "14px", fontWeight: "600" }}>{c.caller}</div><span style={s.badge(c.status === "Booked" ? t.green : c.status === "Resolved" ? t.accent : t.purple)}>{c.status}</span></div>
            <div style={{ fontSize: "12px", color: t.muted }}>{c.phone} · {c.time} · {c.duration}</div>
            <div style={{ fontSize: "12px", color: t.blue, marginTop: "3px" }}>{c.intent}</div>
          </div>
        ))}
      </div>
      <div>
        {selected ? (
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <div><div style={{ fontSize: "15px", fontWeight: "700" }}>{selected.caller}</div><div style={{ fontSize: "12px", color: t.muted }}>{selected.phone} · {selected.time}</div></div>
              <span style={s.badge(selected.status === "Booked" ? t.green : selected.status === "Resolved" ? t.accent : t.purple)}>{selected.status}</span>
            </div>
            <div style={{ background: t.surface, borderRadius: "8px", padding: "13px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", color: t.muted, marginBottom: "6px" }}>AI SUMMARY</div>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>{selected.summary}</div>
            </div>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", color: t.muted, marginBottom: "10px" }}>TRANSCRIPT</div>
            <div style={{ background: t.surface, borderRadius: "8px", padding: "14px", maxHeight: "280px", overflowY: "auto", border: `1px solid ${t.border}` }}>
              {selected.transcript.map((line, i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: line.role === "ai" ? t.accent : t.blue, letterSpacing: "1px", marginBottom: "3px" }}>{line.role === "ai" ? "AI ASSISTANT" : "CALLER"}</div>
                  <div style={{ fontSize: "13px", lineHeight: "1.5", paddingLeft: "8px", borderLeft: `2px solid ${line.role === "ai" ? t.accent + "40" : t.blue + "40"}` }}>{line.text}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ ...s.card, textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>📋</div>
            <div style={{ fontSize: "13px", color: t.muted }}>Select a call to view transcript</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScriptBuilder({ script, setScript }) {
  const [saved, setSaved] = useState(false);
  // Use local state to avoid losing focus on every keystroke
  const [local, setLocal] = useState(script);

  const update = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

  const save = () => {
    setScript(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const F = ({ label, k, multi }) => (
    <div>
      <label style={s.label}>{label}</label>
      {multi
        ? <textarea style={s.textarea} value={local[k]} onChange={e => update(k, e.target.value)} />
        : <input style={s.input} value={local[k]} onChange={e => update(k, e.target.value)} />}
    </div>
  );
  return (
    <>
      {saved && <div style={{ background: `${t.green}20`, border: `1px solid ${t.green}40`, borderRadius: "10px", padding: "13px 18px", marginBottom: "16px", color: t.green, fontSize: "13px", fontWeight: "700" }}>Script saved.</div>}
      <div style={s.grid2}>
        <div>
          <div style={s.card}>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Company Info</div>
            <F label="Company Name" k="companyName" />
            <F label="Customer Service Number (Press 0)" k="ownerNumber" />
            <F label="Dispatch / Transfer Number" k="transferNumber" />
            <div style={{ background: t.surface, border: `1px solid ${t.purple}40`, borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", color: t.purple, marginBottom: "4px" }}>PRESS 0 RULE</div>
              <div style={{ fontSize: "12px", color: t.muted, lineHeight: "1.6" }}>When caller presses 0 or says "customer service" or "real person" — AI transfers directly to the customer service number above.</div>
            </div>
          </div>
          <div style={s.card}>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Greeting & Closing</div>
            <F label="Opening Greeting (use {companyName})" k="greeting" multi />
            <F label="Closing Statement" k="closingSpeech" multi />
            <F label="Booking Confirmation" k="bookingConfirm" multi />
            <F label="Fallback Response" k="fallback" multi />
          </div>
        </div>
        <div>
          <div style={s.card}>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>Hiring Inquiries</div>
            <div style={{ fontSize: "12px", color: t.muted, marginBottom: "12px" }}>Triggered when caller asks about jobs</div>
            <F label="Hiring Response" k="hiringSpeech" multi />
          </div>
          <div style={s.card}>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Hours & Location</div>
            <F label="Hours Response" k="hoursSpeech" multi />
            <F label="Location Response" k="locationSpeech" multi />
          </div>
          <div style={s.card}>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Transfer / Dispatch</div>
            <F label="Transfer Message" k="transferSpeech" multi />
          </div>
        </div>
      </div>
      <button style={{ ...s.btn("primary"), padding: "13px 36px" }} onClick={save}>Save Script</button>
    </>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function PhoneSystem() {
  const [page, setPage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calls, setCalls] = useState(defaultCalls);
  const [script, setScript] = useState(defaultScript);

  const addCall = (call) => setCalls(prev => [{ id: prev.length + 1, duration: "—", time: "Just now", transcript: [], ...call }, ...prev]);

  const nav = [
    { key: "Dashboard", icon: "⬛" },
    { key: "Live Call", icon: "🎙" },
    { key: "Call Log", icon: "📋" },
    { key: "Script Builder", icon: "✏️" },
  ];

  return (
    <div style={s.app}>
      <div style={s.layout}>
        {sidebarOpen && (
          <>
            <div style={s.backdrop} onClick={() => setSidebarOpen(false)} />
            <div style={s.sidebar}>
              <div style={{ padding: "20px 18px", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "3px", color: t.accent, textTransform: "uppercase" }}>CDL Connect</div>
                <div style={{ fontSize: "16px", fontWeight: "700", marginTop: "3px" }}>AI Phone System</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
                  <PulsingDot color={t.green} />
                  <span style={{ fontSize: "12px", color: t.green, fontWeight: "600" }}>System Active</span>
                </div>
              </div>
              <div style={{ padding: "10px 0", flex: 1 }}>
                {nav.map(n => (
                  <button key={n.key} style={s.navItem(page === n.key)} onClick={() => { setPage(n.key); setSidebarOpen(false); }}>
                    <span>{n.icon}</span> {n.key}
                  </button>
                ))}
              </div>
              <div style={{ padding: "16px 18px", borderTop: `1px solid ${t.border}`, fontSize: "12px", color: t.muted }}>Powered by Chedda Mane AI</div>
            </div>
          </>
        )}
        <div style={s.main}>
          <div style={s.topbar}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <button onClick={() => setSidebarOpen(true)} style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: "7px", color: t.muted, cursor: "pointer", fontSize: "18px", padding: "5px 11px" }}>☰</button>
              <div style={{ fontSize: "17px", fontWeight: "700" }}>{page}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: `${t.green}15`, border: `1px solid ${t.green}30`, borderRadius: "20px", padding: "6px 14px" }}>
              <PulsingDot color={t.green} />
              <span style={{ fontSize: "12px", color: t.green, fontWeight: "700" }}>AI ANSWERING</span>
            </div>
          </div>
          <div style={s.content}>
            {page === "Dashboard" && <Dashboard calls={calls} />}
            {page === "Live Call" && <LiveCallPage script={script} onNewCall={addCall} />}
            {page === "Call Log" && <CallLog calls={calls} />}
            {page === "Script Builder" && <ScriptBuilder script={script} setScript={setScript} />}
          </div>
        </div>
      </div>
    </div>
  );
}
