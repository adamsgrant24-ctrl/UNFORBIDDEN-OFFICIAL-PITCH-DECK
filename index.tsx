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
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- Types & Constants ---

type SlideType = {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  bgPrompt: string;
  category: 'VISION' | 'BLUEPRINT' | 'REVENUE' | 'METHODOLOGY' | 'TECHNICAL' | 'INVESTOR' | 'TITLE';
};

const CATEGORY_COLORS = {
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
      const status = error?.status || error?.error?.status;
      const message = error?.message || error?.error?.message || "";
      
      const isRetryable = 
        status === "RESOURCE_EXHAUSTED" || 
        status === 429 || 
        status === 500 || 
        status === "INTERNAL" || 
        status === "UNKNOWN" || 
        message.toLowerCase().includes("rpc failed") ||
        message.toLowerCase().includes("internal error");

      if (i < maxRetries - 1 && isRetryable) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`API call failed (Attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`, error);
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
          <th className="p-4">Character</th>
          <th className="p-4">Casting Status</th>
          <th className="p-4">Function</th>
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
            <td className={`p-4 ${char.status === 'Attached' ? 'text-emerald-400' : 'text-amber-400/80'}`}>{char.status}</td>
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
  key?: React.Key;
}

const SlideBackground = ({ prompt, isActive }: SlideBackgroundProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isActive && !imageUrl && !loading && !errorStatus) {
      const fetchImage = async () => {
        setLoading(true);
        setErrorStatus(null);
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await fetchWithRetry<GenerateContentResponse>(() => 
            ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: `High-art prestige cinematic film still, 35mm anamorphic widescreen, Kodak Vision3 color stock. ${prompt}. Architectural noir, obsidian deep blacks, turpentine amber highlights, stark clinical museum lighting, highly textured raw concrete and polished glass, prestigious film production aesthetic, deep shadows, moody atmospheric fog.` }] },
              config: { imageConfig: { aspectRatio: "16:9" } },
            })
          );
          
          const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (part?.inlineData) {
            setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          } else {
            throw new Error("Missing asset data.");
          }
        } catch (error: any) {
          setErrorStatus(error?.status || error?.message || "Generation Failed");
        } finally {
          setLoading(false);
        }
      };
      fetchImage();
    }
  }, [isActive, prompt, imageUrl, loading, errorStatus]);

  return (
    <div className="absolute inset-0 overflow-hidden z-0 bg-black">
      <AnimatePresence>
        {imageUrl ? (
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            exit={{ opacity: 0 }}
            src={imageUrl}
            className="w-full h-full object-cover grayscale-[0.1] contrast-[1.1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-4 opacity-40">
                <div className="w-10 h-10 border border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-[10px] tracking-[0.5em] uppercase font-mono">Developing Visual Language...</span>
              </div>
            )}
            {errorStatus && (
              <div className="flex flex-col items-center gap-2 max-w-xs text-center p-6">
                <AlertCircle className="w-6 h-6 text-amber-500/30 mb-2" />
                <span className="text-[10px] tracking-widest uppercase text-white/20 font-mono">{errorStatus}</span>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-black/90 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent pointer-events-none" />
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
      bgPrompt: 'Vast clinical concrete museum hall at midnight, singular obsidian pillar in center, cold moonlight, anamorphic lens flares.',
      content: (
        <div className="mt-16 space-y-4 text-center">
          <motion.h3 
            initial={{ opacity: 0, letterSpacing: '1em' }}
            animate={{ opacity: 0.6, letterSpacing: '0.5em' }}
            transition={{ duration: 1.5 }}
            className="text-xl font-light uppercase"
          >
            The Architectural Prospectus
          </motion.h3>
          <div className="pt-32 space-y-2">
            <p className="font-black tracking-[0.8em] text-sm uppercase text-white/90">BY AZA-KHEM</p>
            <div className="h-px w-32 bg-white/20 mx-auto my-6" />
            <p className="text-[10px] opacity-40 font-mono uppercase tracking-[0.3em]">Confidential Investment Portfolio | 2026-2030</p>
          </div>
        </div>
      )
    },
    {
      id: 'vision',
      category: 'VISION',
      title: 'THE VISION',
      subtitle: 'The Transcendental Audit',
      bgPrompt: 'Extreme close up of a high-end cine lens reflecting a cold minimalist gallery, bokeh of warm amber studio light.',
      content: (
        <div className="max-w-2xl space-y-10">
          <p className="text-3xl leading-snug font-light italic text-white/90 border-l-2 border-amber-500/50 pl-10">
            "I am not merely directing a movie; I am conducting a creative audit of the human soul."
          </p>
          <p className="text-sm uppercase tracking-[0.2em] leading-loose text-white/40">
            Exploring the friction between the sterile <span className="text-white font-bold">Vanguard Collective</span> and the <span className="text-amber-500">Unfettered Truth</span> of raw authenticity.
          </p>
          <div className="grid grid-cols-3 gap-8 pt-10 border-t border-white/5">
            {['The Awakening', 'Architectural vs Biological', 'Unforbidden Truth'].map((tag, i) => (
              <div key={i} className="space-y-1">
                <span className="text-[10px] uppercase opacity-30 font-mono tracking-widest">{['Phase', 'Conflict', 'Goal'][i]}</span>
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
      bgPrompt: 'Low angle shot of a brutalist concrete skylight, geometric shadows cast on a textured wall, cinematic noir.',
      content: (
        <div className="space-y-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3 opacity-30 font-mono text-[10px] uppercase tracking-[0.4em]">
              <Layers size={14} /> Narrative Core
            </div>
            <p className="text-2xl font-bold tracking-tight max-w-3xl leading-tight border-l border-white/10 pl-6">
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
      bgPrompt: 'Stack of vintage black and white film canisters on a polished dark wood table, soft side-lighting.',
      content: (
        <div className="space-y-6">
          <p className="text-white/40 max-w-lg text-xs uppercase tracking-[0.2em] leading-relaxed">
            Designed for global scalability, moving from raw local pulse to a prestige international event status across three distinct chapters.
          </p>
          <Roadmap />
        </div>
      )
    },
    {
      id: 'revenue',
      category: 'REVENUE',
      title: 'REVENUE ARCHITECTURE',
      bgPrompt: 'Artist hands caked in obsidian black oil paint, high contrast studio lighting, fine art textures.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6 group">
            <h4 className="text-sm font-black tracking-[0.5em] uppercase border-b border-white/10 pb-4 group-hover:border-amber-500/40 transition-colors">The Aza-Khem Asset</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-wider">
              The art created within UNFORBIDDEN is a tangible investment. Original works used in the film will be auctioned post-premiere as tier-2 revenue assets.
            </p>
            <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 text-[10px] font-mono text-emerald-400 border border-emerald-400/20">
              <TrendingUp size={12} /> Gallery-First Exit Strategy
            </div>
          </div>
          <div className="space-y-6 group">
            <h4 className="text-sm font-black tracking-[0.5em] uppercase border-b border-white/10 pb-4 group-hover:border-blue-500/40 transition-colors">Franchise Lensing</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-wider">
              Cast of international "Vanguard" icons allows for pre-sales in US/EU markets under the proven "A24/NEON" synergy model.
            </p>
            <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 text-[10px] font-mono text-blue-400 border border-blue-400/20">
              <Briefcase size={12} /> Minimum Guarantees
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'methodology',
      category: 'METHODOLOGY',
      title: 'ACTION CARD SYSTEM',
      bgPrompt: 'Handheld gritty shot of a film monitor showing two actors in a close emotional conflict, heavy film grain.',
      content: (
        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="bg-red-500/10 text-red-400 px-5 py-2 rounded-sm text-[10px] font-bold border border-red-500/20 uppercase tracking-[0.3em]">
              Technical Mastery vs Raw Impulse
            </div>
          </div>
          <p className="text-white/40 max-w-2xl text-xs uppercase tracking-[0.2em] leading-loose">
            Bypassing the "rehearsed" to reach the "real." Seasoned precision (John Kani) pitted against raw, unpredictable energy (Teboho Mzisa) to create visceral screen truth.
          </p>
          <ActionCards />
        </div>
      )
    },
    {
      id: 'technical',
      category: 'TECHNICAL',
      title: 'TECHNICAL TREATMENT',
      bgPrompt: 'Splitscreen: Cold industrial blue glass museum vs warm flickering amber studio fire, anamorphic framing.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-5">
            <div className="flex items-center gap-3 opacity-40"><Film size={16} /><span className="text-[10px] uppercase font-bold tracking-[0.4em]">Lensing</span></div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60 leading-relaxed">35mm Anamorphic. Clinical symmetry for the elite. Handheld gritty wide-angles for the painter's descent.</p>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-3 opacity-40"><Palette size={16} /><span className="text-[10px] uppercase font-bold tracking-[0.4em]">Palette</span></div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60 leading-relaxed">Sterile Whites & Glass Blues transition into deep Turpentine Amber and Obsidian Black.</p>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-3 opacity-40"><Volume2 size={16} /><span className="text-[10px] uppercase font-bold tracking-[0.4em]">Sonic</span></div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60 leading-relaxed">Hyper-minimalist gallery echoes contrasted against visceral breathing and low-frequency "heat".</p>
          </div>
        </div>
      )
    },
    {
      id: 'investor',
      category: 'INVESTOR',
      title: 'INVESTOR BRIEF',
      bgPrompt: 'A solitary black tailored suit hanging in a stark raw concrete corridor, sharp cinematic spotlight.',
      content: (
        <div className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="bg-white/5 p-10 rounded-sm border border-white/5 space-y-8 backdrop-blur-md">
              <h5 className="font-bold flex items-center gap-3 text-xs tracking-[0.4em] uppercase opacity-70"><TrendingUp size={16} className="text-emerald-400" /> Value Prop</h5>
              <ul className="text-[10px] space-y-6 text-white/50 uppercase tracking-[0.2em] font-light">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full" /> 25% DTI South African Rebate</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full" /> Prestige-Genre Hybrid Appeal</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full" /> Accelerated Streaming Buy-out</li>
              </ul>
            </div>
            <div className="bg-white/5 p-10 rounded-sm border border-white/5 space-y-8 backdrop-blur-md">
              <h5 className="font-bold flex items-center gap-3 text-xs tracking-[0.4em] uppercase opacity-70"><Briefcase size={16} className="text-blue-400" /> Exit Strategy</h5>
              <ul className="text-[10px] space-y-6 text-white/50 uppercase tracking-[0.2em] font-light">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-blue-500/40 rounded-full" /> SVOD Post-Festival Auction</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-blue-500/40 rounded-full" /> Tier 2 Physical Art Revenue</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-blue-500/40 rounded-full" /> Global Theatrical Expansion</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/5 opacity-30">
            <p className="text-[9px] uppercase tracking-[1em] font-mono">UNFORBIDDEN TRUTH | THE AWAKENING 2026</p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = useCallback(() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1)), [slides.length]);
  const prevSlide = useCallback(() => setCurrentSlide(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Background with intelligent loading */}
      {slides.map((s, i) => (
        <SlideBackground key={s.id} prompt={s.bgPrompt} isActive={i === currentSlide} />
      ))}

      {/* Persistent Navigation & Branding */}
      <div className="absolute top-0 left-0 w-full p-8 md:p-14 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex items-center gap-8">
          <div className={`w-1 h-20 ${CATEGORY_COLORS[currentSlideData.category]} border-l-2 transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.1)]`} />
          <div className="space-y-1">
            <div className="text-[10px] tracking-[0.6em] font-mono opacity-30 uppercase">{currentSlideData.category}</div>
            <div className="text-3xl font-black tracking-tighter uppercase">UNFORBIDDEN</div>
          </div>
        </div>
        <div className="text-[10px] font-mono opacity-30 text-right tracking-[0.4em] uppercase leading-relaxed">
          PAGE {(currentSlide + 1).toString().padStart(2, '0')} // {slides.length.toString().padStart(2, '0')}<br />
          CPT | LON | NYC
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-8 md:p-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl py-20"
          >
            {currentSlideData.subtitle && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.5, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] md:text-xs font-mono tracking-[0.8em] uppercase mb-6 block"
              >
                {currentSlideData.subtitle}
              </motion.span>
            )}
            <h1 className={`text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-14 uppercase ${currentSlide === 0 ? 'text-center' : ''}`}>
              {currentSlideData.title}
            </h1>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
              className={`transition-all duration-1000 ${currentSlide === 0 ? 'flex justify-center' : ''}`}
            >
              {currentSlideData.content}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-14 flex justify-between items-end z-50">
        <div className="flex gap-5 items-center bg-black/40 backdrop-blur-xl px-8 py-4 rounded-full border border-white/5 shadow-2xl">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-1 h-1 rounded-full transition-all duration-700 ${i === currentSlide ? 'bg-white scale-[3] shadow-[0_0_10px_white]' : 'bg-white/10 hover:bg-white/40'}`}
              title={`Jump to Page ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-5 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="p-5 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="w-px h-14 bg-white/5 mx-2" />
          
          <button 
            onClick={toggleFullscreen}
            className="p-5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 opacity-40 hover:opacity-100"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
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