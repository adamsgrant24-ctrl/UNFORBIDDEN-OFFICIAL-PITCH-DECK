import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Volume2, 
  Briefcase, 
  Palette,
  Maximize, 
  Minimize,
  AlertCircle,
  Eye,
  Film,
  Layers,
  RefreshCcw,
  Zap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- Types & Constants ---

type SlideCategory = 'VISION' | 'BLUEPRINT' | 'REVENUE' | 'METHODOLOGY' | 'TECHNICAL' | 'INVESTOR' | 'TITLE';

interface SlideType {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  bgPrompt: string;
  category: SlideCategory;
}

const CATEGORY_COLORS: Record<SlideCategory, string> = {
  TITLE: 'border-white',
  VISION: 'border-amber-500',
  BLUEPRINT: 'border-blue-400',
  REVENUE: 'border-emerald-500',
  METHODOLOGY: 'border-red-500',
  TECHNICAL: 'border-zinc-400',
  INVESTOR: 'border-purple-500'
};

// --- Utils ---

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 2000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.error?.status || 500;
      const message = error?.message || error?.error?.message || "Unknown error";
      
      const isRetryable = 
        status === "RESOURCE_EXHAUSTED" || 
        status === 429 || 
        status === 500 || 
        status === "INTERNAL" || 
        message.toLowerCase().includes("rpc failed") ||
        message.toLowerCase().includes("internal error");

      if (i < maxRetries - 1 && isRetryable) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

// --- Specialized UI Components ---

const CastingTable = () => (
  <div className="overflow-x-auto w-full mt-4 border border-white/10 rounded-sm">
    <table className="w-full text-left text-xs md:text-sm border-collapse">
      <thead>
        <tr className="border-b border-white/20 bg-white/5 uppercase tracking-widest font-mono text-[10px]">
          <th className="p-4 text-white/40">Character</th>
          <th className="p-4 text-white/40">Status</th>
          <th className="p-4 text-white/40">Core Function</th>
        </tr>
      </thead>
      <tbody className="font-light">
        {[
          { name: "Luke (Teboho Mzisa)", status: "Attached", fn: "The Obsidian Shadow. Raw, visceral." },
          { name: "The Anchor (Annette Miller)", status: "Attached", fn: "Architect of Wisdom. Bridge to truth." },
          { name: "The Mother (Pamela Nomvete)", status: "Offer Pending", fn: "The Gatekeeper. Sterile power." },
          { name: "Zola (Nefisa Mkhabela)", status: "Offer Pending", fn: "The Mirror. Gilded cage success." },
          { name: "The Critic (John Kani)", status: "Offer Pending", fn: "The Labeler. Academic subtext." }
        ].map((char, idx) => (
          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td className="p-4 font-semibold">{char.name}</td>
            <td className={`p-4 ${char.status === 'Attached' ? 'text-emerald-400 font-bold' : 'text-amber-400/80 italic'}`}>{char.status}</td>
            <td className="p-4 text-white/50">{char.fn}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Roadmap = () => (
  <div className="flex flex-col gap-4 mt-8">
    {[
      { phase: "I: THE AWAKENING", budget: "R500,000 SEED", goal: "Festival Prestige (Sundance/Berlinale)" },
      { phase: "II: RESISTANCE", budget: "R2.5M - R5M", goal: "Intl Co-production (CT & London)" },
      { phase: "III: THE LEGACY", budget: "R10M+", goal: "Global Streaming Event (Netflix/A24)" }
    ].map((step, i) => (
      <div key={i} className="flex items-center gap-6 group">
        <div className="text-4xl font-black opacity-10 group-hover:opacity-30 transition-opacity font-mono">0{i+1}</div>
        <div className="flex-1 bg-white/5 p-6 rounded-sm border-l-2 border-white/10 backdrop-blur-sm group-hover:border-white/40 transition-all">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-bold tracking-widest uppercase text-sm">{step.phase}</h4>
            <span className="text-[10px] opacity-40 font-mono tracking-tighter">{step.budget}</span>
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest">{step.goal}</p>
        </div>
      </div>
    ))}
  </div>
);

const ActionCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
    {[
      { title: "TO SHATTER", role: "Luke", desc: "Destroy professional boundaries and clinical silence." },
      { title: "TO HOLD", role: "The Anchor", desc: "Remain the unmoving foundation, force new communication." },
      { title: "TO ENCLOSE", role: "The Mother", desc: "Maintain perimeter, treat emotion as a structural flaw." },
      { title: "TO LABEL", role: "The Critic", desc: "Categorize and strip power via academic subtext." },
      { title: "TO COMMODIFY", role: "The Patron", desc: "Hunt for investment, check specimen for 'quality'." }
    ].map((card, i) => (
      <div key={i} className="p-6 bg-white/5 border border-white/5 hover:border-white/20 transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-40 transition-opacity">
          <Eye size={12} />
        </div>
        <div className="text-[10px] font-mono opacity-30 mb-2 uppercase tracking-[0.2em]">{card.role}</div>
        <div className="text-xl font-black tracking-tight mb-3 underline decoration-white/10 underline-offset-8">{card.title}</div>
        <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider">{card.desc}</p>
      </div>
    ))}
  </div>
);

// --- Background Renderer ---

interface SlideBackgroundProps {
  prompt: string;
  isActive: boolean;
}

const SlideBackground: React.FC<SlideBackgroundProps> = ({ prompt, isActive }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchImage = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setErrorStatus(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await fetchWithRetry<GenerateContentResponse>(() => 
        ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `A hyper-prestigious cinematic film still from the movie UNFORBIDDEN. Cinematic lighting, 35mm anamorphic widescreen format, Kodak Vision3 500T color science. ${prompt}. High-end architectural noir, brutalist concrete textures, deep obsidian shadows, clinical museum vibes, Turpentine amber highlight accents, stark geometric shapes, atmospheric fog, luxury production value.` }] },
          config: { imageConfig: { aspectRatio: "16:9" } },
        })
      );
      
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
      } else {
        throw new Error("Missing binary asset data.");
      }
    } catch (error: any) {
      console.error("Asset generation failed:", error);
      const status = error?.status || error?.error?.status || "Error";
      setErrorStatus(`${status}: ${error?.message || "Generation Failed"}`);
    } finally {
      setLoading(false);
    }
  }, [prompt, loading]);

  useEffect(() => {
    if (isActive && !imageUrl && !loading && !errorStatus) {
      fetchImage();
    }
  }, [isActive, imageUrl, loading, errorStatus, fetchImage]);

  return (
    <div className="absolute inset-0 overflow-hidden z-0 bg-black">
      <AnimatePresence>
        {imageUrl ? (
          <motion.img
            initial={{ scale: 1.15, opacity: 0, filter: 'blur(20px)' }}
            animate={{ scale: 1, opacity: 0.55, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            src={imageUrl}
            className="w-full h-full object-cover grayscale-[0.05] contrast-[1.15]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-4 opacity-40">
                <div className="w-12 h-12 border-2 border-white/5 border-t-white/40 rounded-full animate-spin" />
                <span className="text-[10px] tracking-[0.8em] uppercase font-mono text-white/60">Rendering Narrative Space...</span>
              </div>
            )}
            {errorStatus && isActive && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 max-w-xs text-center p-8 bg-white/5 border border-white/10 backdrop-blur-xl rounded-sm"
              >
                <AlertCircle className="w-8 h-8 text-amber-500/50 mb-2" />
                <span className="text-[10px] tracking-widest uppercase text-white/40 font-mono mb-4 break-words px-4">{errorStatus}</span>
                <button 
                  onClick={() => fetchImage()}
                  className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 transition-all text-[10px] uppercase tracking-[0.4em] font-bold border border-white/10"
                >
                  <RefreshCcw size={14} /> RE-GENERATE ASSET
                </button>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-black/90 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
};

// --- Main Presentation App ---

const PresentationApp = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides: SlideType[] = [
    {
      id: 'title',
      category: 'TITLE',
      title: 'UNFORBIDDEN',
      subtitle: 'PART I: THE AWAKENING | A TRILOGY',
      bgPrompt: 'A vast brutalist concrete museum gallery at midnight. A single obsidian monolith stands in the center. Cold moonlight pierces through high skylights. Sharp shadows, high-end cinema cinematography.',
      content: (
        <div className="mt-16 space-y-4 text-center">
          <motion.h3 
            initial={{ opacity: 0, letterSpacing: '1.5em' }}
            animate={{ opacity: 0.6, letterSpacing: '0.8em' }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="text-xl font-light uppercase"
          >
            The Architectural Prospectus
          </motion.h3>
          <div className="pt-32 space-y-4">
            <p className="font-black tracking-[1em] text-sm uppercase text-white/90">BY AZA-KHEM</p>
            <div className="h-px w-48 bg-white/20 mx-auto my-8 shadow-[0_0_10px_white]" />
            <p className="text-[10px] opacity-40 font-mono uppercase tracking-[0.5em]">Confidential | 2026-2030 Portfolio</p>
          </div>
        </div>
      )
    },
    {
      id: 'vision',
      category: 'VISION',
      title: 'THE VISION',
      subtitle: 'The Transcendental Audit',
      bgPrompt: 'Extreme close up of a high-end cine lens reflecting a minimalist art studio. Warm amber light, deep blacks, high texture 35mm film grain.',
      content: (
        <div className="max-w-2xl space-y-12">
          <p className="text-3xl md:text-5xl leading-tight font-light italic text-white/90 border-l-2 border-amber-500/60 pl-10">
            "We are not merely filming; we are conducting a structural audit of the human soul."
          </p>
          <p className="text-sm uppercase tracking-[0.3em] leading-relaxed text-white/50">
            A trilogy exploring the terminal friction between the sterile <span className="text-white font-bold underline underline-offset-4 decoration-white/20">Vanguard Collective</span> and the <span className="text-amber-500 font-bold">Raw Truth</span> of biological authenticity.
          </p>
          <div className="grid grid-cols-3 gap-12 pt-16 border-t border-white/10">
            {['Shattering Silence', 'Biological vs Structural', 'The Unforbidden'].map((tag, i) => (
              <div key={i} className="space-y-2 group">
                <span className="text-[10px] uppercase opacity-30 font-mono tracking-[0.3em] group-hover:text-amber-500 transition-colors">{['Phase', 'Concept', 'Goal'][i]}</span>
                <p className="text-xs font-black uppercase tracking-tighter">{tag}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'blueprint',
      category: 'BLUEPRINT',
      title: 'MASTER BLUEPRINT',
      bgPrompt: 'Sharp geometric shadows on raw concrete walls. Stark cinematic noir lighting with hints of cold blue.',
      content: (
        <div className="space-y-16">
          <div className="space-y-6">
            <div className="flex items-center gap-4 opacity-30 font-mono text-[11px] uppercase tracking-[0.6em]">
              <Layers size={16} /> Narrative Framework
            </div>
            <p className="text-2xl md:text-3xl font-bold tracking-tight max-w-4xl leading-snug border-l border-white/20 pl-10 py-2">
              To find the "unforbidden" truth in his art, a rising painter must dismantle the glass-and-steel legacy of his mother’s empire.
            </p>
          </div>
          <CastingTable />
        </div>
      )
    },
    {
      id: 'roadmap',
      category: 'BLUEPRINT',
      title: 'TRILOGY ROADMAP',
      bgPrompt: 'Vintage film canisters on a dark glass table, moody atmospheric studio lighting, amber highlights.',
      content: (
        <div className="space-y-10">
          <p className="text-white/40 max-w-xl text-xs uppercase tracking-[0.4em] font-light leading-relaxed">
            Designed for exponential scalability, moving from raw local pulse to a global prestige event status.
          </p>
          <Roadmap />
        </div>
      )
    },
    {
      id: 'revenue',
      category: 'REVENUE',
      title: 'REVENUE ARCHITECTURE',
      bgPrompt: 'Macro shot of painter\'s hands covered in thick, viscous black oil paint. High contrast lighting, high production detail.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="space-y-10 group">
            <h4 className="text-sm font-black tracking-[0.7em] uppercase border-b border-white/10 pb-6 group-hover:border-amber-500/50 transition-colors">The Aza-Khem Asset</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-widest">
              The art created within UNFORBIDDEN is a tangible investment. Original works used in the film will be curated for auction post-premiere as tier-2 revenue assets.
            </p>
            <div className="inline-flex items-center gap-4 bg-white/5 px-8 py-4 text-[11px] font-mono text-emerald-400 border border-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.05)]">
              <TrendingUp size={16} /> Gallery-First Strategy
            </div>
          </div>
          <div className="space-y-10 group">
            <h4 className="text-sm font-black tracking-[0.7em] uppercase border-b border-white/10 pb-6 group-hover:border-blue-500/50 transition-colors">Franchise Lensing</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-widest">
              A meticulously selected cast of international icons allows for pre-sales in major global territories under the proven prestige-indie synergy model.
            </p>
            <div className="inline-flex items-center gap-4 bg-white/5 px-8 py-4 text-[11px] font-mono text-blue-400 border border-blue-400/20">
              <Briefcase size={16} /> Multi-Market Synergy
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'methodology',
      category: 'METHODOLOGY',
      title: 'ACTION CARD SYSTEM',
      bgPrompt: 'Flickering old film monitor showing a blurred face in profile, cinematic lighting, deep noir shadows.',
      content: (
        <div className="space-y-12">
          <div className="flex gap-6">
            <div className="bg-red-500/10 text-red-400 px-8 py-3 rounded-sm text-[11px] font-bold border border-red-500/30 uppercase tracking-[0.5em]">
              Precision vs Visceral Impulse
            </div>
          </div>
          <p className="text-white/40 max-w-3xl text-xs uppercase tracking-[0.3em] leading-loose">
            Seasoned technical mastery pitted against raw, unpredictable human energy to extract unscripted screen truth.
          </p>
          <ActionCards />
        </div>
      )
    },
    {
      id: 'technical',
      category: 'TECHNICAL',
      title: 'TECHNICAL TREATMENT',
      bgPrompt: 'Blue clinical laboratory lighting vs warm orange sparks from a torch. High contrast anamorphic lens flare.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
          <div className="space-y-8 group">
            <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity"><Film size={22} /><span className="text-[11px] uppercase font-bold tracking-[0.6em]">Lensing</span></div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60 leading-relaxed border-l border-white/10 pl-6">35mm Anamorphic. Clinical structural symmetry vs visceral handheld long-takes.</p>
          </div>
          <div className="space-y-8 group">
            <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity"><Palette size={22} /><span className="text-[11px] uppercase font-bold tracking-[0.6em]">Palette</span></div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60 leading-relaxed border-l border-white/10 pl-6">Sterile museum whites & cold blues bleeding into raw turpentine amber and obsidian.</p>
          </div>
          <div className="space-y-8 group">
            <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity"><Volume2 size={22} /><span className="text-[11px] uppercase font-bold tracking-[0.6em]">Sonic</span></div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60 leading-relaxed border-l border-white/10 pl-6">Minimalist concrete echoes vs high-fidelity organic noise and heavy low-frequency pulses.</p>
          </div>
        </div>
      )
    },
    {
      id: 'investor',
      category: 'INVESTOR',
      title: 'INVESTOR BRIEF',
      bgPrompt: 'A tailored charcoal suit hanging in a sterile raw concrete corridor. Sharp studio lighting, high fashion photography style.',
      content: (
        <div className="space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="bg-white/5 p-16 rounded-sm border border-white/5 space-y-12 backdrop-blur-3xl hover:bg-white/10 transition-colors">
              <h5 className="font-bold flex items-center gap-4 text-xs tracking-[0.6em] uppercase opacity-80"><Target size={20} className="text-emerald-400" /> Strategic Value</h5>
              <ul className="text-[11px] space-y-8 text-white/50 uppercase tracking-[0.4em] font-light">
                <li className="flex items-center gap-6 group"><div className="w-2 h-2 bg-emerald-500/50 rounded-full group-hover:scale-150 transition-transform" /> 25% DTI Rebate Qualification</li>
                <li className="flex items-center gap-6 group"><div className="w-2 h-2 bg-emerald-500/50 rounded-full group-hover:scale-150 transition-transform" /> Tier-1 Film Festival Pipeline</li>
                <li className="flex items-center gap-6 group"><div className="w-2 h-2 bg-emerald-500/50 rounded-full group-hover:scale-150 transition-transform" /> Global SVOD Premium License</li>
              </ul>
            </div>
            <div className="bg-white/5 p-16 rounded-sm border border-white/5 space-y-12 backdrop-blur-3xl hover:bg-white/10 transition-colors">
              <h5 className="font-bold flex items-center gap-4 text-xs tracking-[0.6em] uppercase opacity-80"><Zap size={20} className="text-blue-400" /> ROI & EXIT</h5>
              <ul className="text-[11px] space-y-8 text-white/50 uppercase tracking-[0.4em] font-light">
                <li className="flex items-center gap-6 group"><div className="w-2 h-2 bg-blue-500/50 rounded-full group-hover:scale-150 transition-transform" /> Market Buyout (A24/Neon/Searchlight)</li>
                <li className="flex items-center gap-6 group"><div className="w-2 h-2 bg-blue-500/50 rounded-full group-hover:scale-150 transition-transform" /> Art Secondary Market Gains</li>
                <li className="flex items-center gap-6 group"><div className="w-2 h-2 bg-blue-500/50 rounded-full group-hover:scale-150 transition-transform" /> Global Franchise Equity</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-12 border-t border-white/10 opacity-30">
            <p className="text-[10px] uppercase tracking-[1.5em] font-mono">UNFORBIDDEN | THE AWAKENING 2026-2027</p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = useCallback(() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1)), [slides.length]);
  const prevSlide = useCallback(() => setCurrentSlide(prev => Math.max(prev - 1, 0)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen]);

  const currentSlideData = slides[currentSlide];
  const progressPercent = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Background Layers */}
      {slides.map((s, i) => (
        <SlideBackground key={s.id} prompt={s.bgPrompt} isActive={i === currentSlide} />
      ))}

      {/* Nav & Branding Overlay */}
      <div className="absolute top-0 left-0 w-full p-12 md:p-20 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex items-center gap-12">
          <div className={`w-2 h-28 ${CATEGORY_COLORS[currentSlideData.category]} border-l-4 transition-all duration-1000 shadow-[0_0_30px_rgba(255,255,255,0.1)]`} />
          <div className="space-y-2">
            <motion.div 
              key={`cat-${currentSlide}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.4, x: 0 }}
              className="text-[12px] tracking-[1em] font-mono uppercase"
            >
              {currentSlideData.category}
            </motion.div>
            <div className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">UNFORBIDDEN</div>
          </div>
        </div>
        <div className="text-[12px] font-mono opacity-25 text-right tracking-[0.8em] uppercase leading-loose pt-2">
          PAGE {(currentSlide + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}<br />
          LONDON | CAPE TOWN | NYC
        </div>
      </div>

      {/* Primary Slide Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-12 md:p-40 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20, scale: 0.98, filter: 'brightness(3)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'brightness(1)' }}
            exit={{ opacity: 0, y: -20, scale: 1.02, filter: 'brightness(0.2)' }}
            transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
            className="w-full max-w-7xl pt-20"
          >
            {currentSlideData.subtitle && (
              <motion.span 
                initial={{ opacity: 0, letterSpacing: '2em' }}
                animate={{ opacity: 0.5, letterSpacing: '1.2em' }}
                transition={{ delay: 0.5, duration: 1.5 }}
                className="text-[12px] md:text-sm font-mono uppercase mb-12 block text-white/80"
              >
                {currentSlideData.subtitle}
              </motion.span>
            )}
            <h1 className={`text-6xl md:text-[10rem] font-black tracking-tighter leading-[0.8] mb-20 uppercase ${currentSlide === 0 ? 'text-center' : ''} drop-shadow-2xl`}>
              {currentSlideData.title}
            </h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 1.5 }}
              className={`transition-all duration-1000 ${currentSlide === 0 ? 'flex justify-center' : ''}`}
            >
              {currentSlideData.content}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Film Strip Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5 z-50">
        <motion.div 
          className="h-full bg-white/40 shadow-[0_0_20px_white]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "circOut" }}
        />
        <div className="absolute top-0 left-0 w-full h-full flex justify-around pointer-events-none opacity-20">
          {slides.map((_, i) => (
            <div key={i} className="w-px h-full bg-black" />
          ))}
        </div>
      </div>

      {/* Presentation Footer Controls */}
      <div className="absolute bottom-6 left-0 w-full p-12 md:p-20 flex justify-between items-end z-50">
        <div className="flex gap-10 items-center bg-white/5 backdrop-blur-3xl px-14 py-6 rounded-full border border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-1000 ${i === currentSlide ? 'bg-white scale-[4] shadow-[0_0_20px_white]' : 'bg-white/10 hover:bg-white/60'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-12">
          <div className="flex gap-4">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-8 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5 active:scale-90 group backdrop-blur-md"
            >
              <ChevronLeft size={28} className="group-active:translate-x-[-4px] transition-transform" />
            </button>
            <button 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="p-8 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5 active:scale-90 group backdrop-blur-md"
            >
              <ChevronRight size={28} className="group-active:translate-x-[4px] transition-transform" />
            </button>
          </div>
          
          <div className="w-px h-20 bg-white/10 mx-4" />
          
          <button 
            onClick={toggleFullscreen}
            className="p-8 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 opacity-40 hover:opacity-100 active:scale-90 backdrop-blur-md"
            title="Toggle Cinema Mode (F)"
          >
            {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App Bootstrap ---

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PresentationApp />);
}