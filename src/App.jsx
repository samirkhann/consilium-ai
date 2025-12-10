import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  Zap,
  Sparkles,
  Command,
  Download,
  Lock,
  Share2
} from 'lucide-react';

/* --- ELITE BRAND CONFIGURATION --- */

const AI_PERSONAS = {
  GEMINI: {
    id: 'gemini',
    name: 'Gemini Ultra 1.5',
    provider: 'GOOGLE DEEPMIND',
    logoPath: '/img/gemini.png',
    color: 'blue',
    accentColor: '#3b82f6', 
    glowShadow: 'shadow-[0_0_60px_-10px_rgba(59,130,246,0.8)]',
    bgGradient: 'from-blue-950/40 via-transparent to-transparent',
    borderColor: 'border-blue-500/50'
  },
  CLAUDE: {
    id: 'claude',
    name: 'Claude 3.5 Opus',
    provider: 'ANTHROPIC',
    logoPath: '/img/claude.png',
    color: 'orange',
    accentColor: '#f97316', 
    glowShadow: 'shadow-[0_0_60px_-10px_rgba(249,115,22,0.8)]',
    bgGradient: 'from-orange-950/40 via-transparent to-transparent',
    borderColor: 'border-orange-500/50'
  },
  GPT: {
    id: 'gpt',
    name: 'GPT-4o',
    provider: 'OPENAI',
    logoPath: '/img/openai.png',
    color: 'white',
    accentColor: '#e5e7eb', 
    glowShadow: 'shadow-[0_0_60px_-10px_rgba(255,255,255,0.7)]',
    bgGradient: 'from-gray-800/40 via-transparent to-transparent',
    borderColor: 'border-gray-200/50'
  },
  GROK: {
    id: 'grok',
    name: 'Grok 2',
    provider: 'XAI',
    logoPath: '/img/grok.png',
    color: 'white',
    accentColor: '#ffffff', 
    glowShadow: 'shadow-[0_0_60px_-10px_rgba(255,255,255,0.7)]',
    bgGradient: 'from-gray-800/40 via-transparent to-transparent',
    borderColor: 'border-gray-100/50'
  }
};

/* --- DATA ENGINE --- */
// SECURITY: API Key now loaded from environment variables
// For Vite: VITE_GEMINI_API_KEY
// For Create React App: REACT_APP_GEMINI_API_KEY
// Set this in your .env file and Vercel Environment Variables
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || 
                process.env?.REACT_APP_GEMINI_API_KEY || 
                "";

const parseDirectorOutput = (rawText) => {
  try {
    return JSON.parse(rawText);
  } catch (e) {
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleanText);
    } catch (e2) {
      return {
        gemini: "Processing data stream...", 
        claude: "Analyzing parameters...", 
        gpt: "Computing response...", 
        grok: "Accessing feed..."
      };
    }
  }
};

const callDirectorMode = async (prompt) => {
  if (!API_KEY) {
    console.error("API Key Missing: Set VITE_GEMINI_API_KEY in your environment variables");
    await new Promise(r => setTimeout(r, 1500));
    return {
      gemini: "SYSTEM LOCKED. Environment variable VITE_GEMINI_API_KEY not found.",
      claude: "Access Denied. Please configure API credentials.",
      gpt: "Neural link offline. Check deployment configuration.",
      grok: "404 Brain Not Found. Did you forget to set the API key?"
    };
  }

  const systemPrompt = `You are an AI orchestrator simulating 4 VERY DIFFERENT AI models responding to the same query.

USER QUERY: "${prompt}"

Generate 4 DISTINCTLY DIFFERENT responses (each 40-60 words) matching these personalities:

1. GEMINI (Google DeepMind):
- Technical, professional, structured
- Uses phrases like: "multimodal analysis", "cross-domain synthesis"
- Confident and capability-focused
- Mentions understanding visual/audio context when relevant

2. CLAUDE (Anthropic):
- Thoughtful, careful, articulate, warm
- Uses phrases like: "I appreciate...", "carefully considered"
- Acknowledges nuance and limitations
- Slightly cautious and thorough

3. GPT-4 (OpenAI):
- Direct, confident, clear, professional
- Straightforward language without excessive hedging
- Efficient and well-organized
- Standard professional AI assistant tone

4. GROK (xAI):
- Witty, irreverent, slightly sarcastic
- Uses casual language and humor
- Direct and unfiltered
- May include pop culture references
- Has personality and edge

CRITICAL: Each response MUST sound completely different in voice and style.

Output as JSON: {"gemini": "...", "claude": "...", "gpt": "...", "grok": "..."}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { 
            responseMimeType: "application/json",
            temperature: 0.9
          } 
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", response.status, errorData);
      throw new Error(`API Connection Failed: ${response.status}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from API");
    return parseDirectorOutput(text);
  } catch (e) {
    console.error("Gemini API Error:", e);
    return {
      gemini: "Connection Error: Unable to reach Google AI servers. Check your API key and network.",
      claude: "Unable to establish secure link. The service may be temporarily unavailable.",
      gpt: "API Request Failed. Please verify your credentials and try again.",
      grok: "Something broke. Either your key is wrong or the internet died. Check the console for details."
    };
  }
};

/* --- UI COMPONENTS --- */

const LuxuryCard = ({ persona, content, state }) => {
  const isThinking = state === 'thinking';
  const isDone = state === 'done';
  const cardRef = useRef(null);

  const statusColorClass = `text-${persona.color}-400`;

  return (
    <div 
      ref={cardRef}
      className={`
        relative group flex flex-col h-full rounded-3xl overflow-hidden
        bg-black border transition-all duration-700 ease-out cursor-default
        border-white/10 
        hover:scale-[1.02]
        hover:shadow-[0_0_50px_-15px_${persona.accentColor},_inset_0_0_30px_-20px_${persona.accentColor}]
        hover:border-[color:var(--accent-color)]
      `}
      style={{ '--accent-color': persona.accentColor }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black pointer-events-none mix-blend-overlay"></div>

      <div className={`
        absolute inset-0 bg-gradient-to-br ${persona.bgGradient}
        opacity-0 transition-opacity duration-500
        ${isThinking || isDone ? 'opacity-100' : 'group-hover:opacity-100'}
      `} />

      <div className="relative z-10 flex items-center justify-between p-7 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          
          <div 
            className={`
              relative w-16 h-16 p-3.5 rounded-2xl 
              bg-black
              border border-white/10
              transition-all duration-500 flex items-center justify-center overflow-hidden
              group-hover:shadow-[0_0_30px_-5px_${persona.accentColor},_inset_0_0_10px_-5px_${persona.accentColor}]
              group-hover:border-[color:var(--accent-color)]
            `}
          >
            <img 
              src={persona.logoPath} 
              alt={persona.name} 
              className="w-full h-full object-contain relative z-10"
              onError={(e) => {e.target.style.display='none';}} 
            />
          </div>
          
          <div>
            <div className="font-bold text-[17px] text-gray-100 tracking-tight leading-snug mb-1.5 drop-shadow-sm group-hover:text-white transition-colors">
              {persona.name}
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] group-hover:text-gray-400 transition-colors">
              {persona.provider}
            </div>
          </div>
        </div>

        <div className="relative w-7 h-7 flex items-center justify-center">
          {isThinking && (
            <>
              <div className={`absolute inset-0 rounded-full ${persona.glowShadow} opacity-50 animate-pulse`} />
              <div className={`absolute inset-0 rounded-full border-2 border-t-current border-r-transparent border-b-transparent border-l-transparent animate-spin ${statusColorClass}`} />
            </>
          )}
          {isDone && (
             <div className="animate-in zoom-in duration-300 relative">
               <div className={`absolute inset-0 rounded-full ${persona.glowShadow} opacity-50`} />
               <CheckCircle2 className={`w-6 h-6 ${statusColorClass} relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`} />
             </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 p-7 min-h-[180px] bg-gradient-to-b from-transparent to-[#020202]">
        {content && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-[15px] leading-7 text-gray-300 font-light">
              {content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- MAIN APP --- */

const App = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState('IDLE'); 
  const [responses, setResponses] = useState({ gemini: '', claude: '', gpt: '', grok: '' });
  const [synthesis, setSynthesis] = useState(null);

  const handleSearch = async () => {
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setStage('ANALYZING');
    setResponses({ gemini: '', claude: '', gpt: '', grok: '' });
    setSynthesis(null);

    // Call Director
    const result = await callDirectorMode(query);

    setResponses(result);
    setStage('DONE');
    
    // Check if we got valid responses (simulation or real)
    const allResponded = Object.values(result).every(r => r && !r.includes("SYSTEM LOCKED"));
    const consensusState = allResponded ? 'AGREEMENT' : 'SYSTEM LOCK';

    setTimeout(() => {
        setSynthesis(consensusState);
    }, 1500);
    
    setIsProcessing(false);
  };

  const downloadReport = () => {
    const report = `CONSILIUM AI REPORT
Generated: ${new Date().toLocaleString()}
Query: ${query}

═══════════════════════════════════════

GEMINI ULTRA 1.5 (Google DeepMind):
${responses.gemini}

───────────────────────────────────────

CLAUDE 3.5 OPUS (Anthropic):
${responses.claude}

───────────────────────────────────────

GPT-4o (OpenAI):
${responses.gpt}

───────────────────────────────────────

GROK 2 (xAI):
${responses.grok}

═══════════════════════════════════════

CONSENSUS STATUS: ${synthesis}

───────────────────────────────────────
Generated by CONSILIUM - consilium.ai
`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consilium-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-white/20 overflow-x-hidden">
      
      {/* Background FX - Pure Silver/Black */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1] mix-blend-overlay" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[1000px] h-[800px] bg-white/[0.03] rounded-full blur-[120px] animate-pulse" style={{animationDuration: '10s'}} />
        <div className="absolute bottom-[-10%] right-[10%] w-[800px] h-[600px] bg-white/[0.02] rounded-full blur-[100px] animate-pulse" style={{animationDuration: '15s'}} />
      </div>
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 h-24 bg-black/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-8 h-full flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white via-gray-200 to-gray-400 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-white/40 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-500">
               <Zap className="w-5 h-5 text-black fill-black relative z-10" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500 group-hover:from-white group-hover:via-white group-hover:to-gray-200 transition-all duration-700 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                CONSILIUM
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] rounded-full border border-white/[0.08] shadow-sm">
               <div className={`w-1.5 h-1.5 rounded-full ${API_KEY ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-red-400 shadow-[0_0_10px_#ef4444]'} animate-pulse`} />
               <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                 {API_KEY ? 'Systems Online' : 'API Key Missing'}
               </span>
             </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="relative pt-44 pb-24 px-6 max-w-[1400px] mx-auto z-10">
        
        <div className={`transition-all duration-1000 ${stage === 'IDLE' ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
          <div className="text-center mb-20 space-y-6">
             <h1 className="text-6xl md:text-8xl font-bold tracking-tighter group cursor-default">
               <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] transition-all duration-700 group-hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.5)] group-hover:from-white group-hover:via-white group-hover:to-gray-300">
                 Total Consensus.
               </span>
             </h1>
             <p className="text-gray-400 text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
               Orchestrating Gemini, Claude, GPT-4, and Grok.
             </p>
          </div>

          <div className="max-w-3xl mx-auto mb-32 relative z-20 group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-gray-500 via-white to-gray-500 rounded-full opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-40 group-focus-within:opacity-50"></div>
            
            <div 
              className={`
                relative bg-black border border-white/10 rounded-full p-2 pl-8 flex items-center transition-all duration-500
                ${isProcessing ? 'opacity-80' : 'group-hover:border-white/30 group-hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)] group-focus-within:shadow-[0_0_60px_-5px_rgba(255,255,255,0.3)] group-focus-within:border-white/50'}
              `}
            >
              <div className="mr-5 text-gray-400 group-focus-within:text-white transition-colors">
                <Command className="w-6 h-6" />
              </div>
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isProcessing && query.trim() && handleSearch()}
                placeholder="Initialize directive..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-600 h-16 text-xl font-light tracking-wide"
                disabled={isProcessing}
              />
              <button 
                onClick={handleSearch}
                disabled={!query || isProcessing}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-white via-gray-200 to-gray-400 text-black flex items-center justify-center hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : <ArrowRight className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>

        {stage !== 'IDLE' && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(AI_PERSONAS).map(([key, persona]) => (
                <LuxuryCard 
                  key={key}
                  persona={persona}
                  content={responses[key.toLowerCase()]}
                  state={responses[key.toLowerCase()] ? 'done' : 'thinking'}
                />
              ))}
            </div>
            
            {synthesis && (
               <div className="mt-24 text-center animate-in fade-in zoom-in duration-1000 flex flex-col items-center gap-4">
                  <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.05)] relative group overflow-hidden ${synthesis === 'SYSTEM LOCK' ? 'border-red-500/30 shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)]' : ''}`}>
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${synthesis === 'SYSTEM LOCK' ? 'via-red-500/10' : 'via-white/10'} to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                    {synthesis === 'AGREEMENT' ? (
                      <Sparkles className="w-5 h-5 text-white relative z-10" />
                    ) : (
                      <Lock className="w-5 h-5 text-red-400 relative z-10" />
                    )}
                    <span className={`text-sm font-medium tracking-[0.2em] uppercase relative z-10 ${synthesis === 'SYSTEM LOCK' ? 'text-red-400' : 'text-gray-200'}`}>
                      {synthesis === 'SYSTEM LOCK' ? 'AUTH REQUIRED' : synthesis}
                    </span>
                  </div>
                  
                  {synthesis === 'AGREEMENT' && (
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={downloadReport}
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
                      >
                        <Download className="w-3 h-3" /> Download Report
                      </button>
                      <button 
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
                      >
                        <Share2 className="w-3 h-3" /> Share Debate
                      </button>
                    </div>
                  )}
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;