import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshCcw
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

// Added optional key property to SlideBackgroundProps to resolve TypeScript error in map() iteration
interface SlideBackgroundProps {
  prompt: string;
  isActive: boolean;
  key?: React.Key;
}

const SlideBackground = ({ prompt, isActive }: SlideBackgroundProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchImage = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // Create a new GoogleGenAI instance right before making an API call to ensure fresh key access
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await fetchWithRetry<GenerateContentResponse>(() => 
        ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `High-art prestige cinematic film still, 35mm anamorphic widescreen, Kodak Vision3 color stock. ${prompt}. Architectural noir, obsidian deep blacks, turpentine amber highlights, stark clinical museum lighting, highly textured raw concrete and polished glass, prestigious film production aesthetic, deep shadows, moody atmospheric fog.` }] },
          config: { imageConfig: { aspectRatio: "16:9" } },
        })
      );
      
      // Iterate through parts to find the image part (inlineData) as recommended
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
  }, [prompt]);

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
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.55 }}
            exit={{ opacity: 0 }}
            src={imageUrl}
            className="w-full h-full object-cover grayscale-[0.05] contrast-[1.15]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-4 opacity-40">
                <div className="w-10 h-10 border border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-[10px] tracking-[0.6em] uppercase font-mono text-white/60">Developing Visual Language...</span>
              </div>
            )}
            {errorStatus && isActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 max-w-xs text-center p-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-sm"
              >
                <AlertCircle className="w-6 h-6 text-amber-500/50 mb-2" />
                <span className="text-[10px] tracking-widest uppercase text-white/40 font-mono mb-4">{errorStatus}</span>
                <button 
                  onClick={fetchImage}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-all text-[10px] uppercase tracking-widest font-bold"
                >
                  <RefreshCcw size={12} /> Retry Generation
                </button>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/95 to-transparent pointer-events-none" />
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
      bgPrompt: 'Vast clinical concrete museum hall at midnight, singular obsidian pillar in center, cold moonlight, anamorphic lens flares, high contrast.',
      content: (
        <div className="mt-16 space-y-4 text-center">
          <motion.h3 
            initial={{ opacity: 0, letterSpacing: '1.2em' }}
            animate={{ opacity: 0.7, letterSpacing: '0.6em' }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="text-xl font-light uppercase"
          >
            The Architectural Prospectus
          </motion.h3>
          <div className="pt-32 space-y-2">
            <p className="font-black tracking-[0.8em] text-sm uppercase text-white/90">BY AZA-KHEM</p>
            <div className="h-px w-40 bg-white/20 mx-auto my-6" />
            <p className="text-[10px] opacity-40 font-mono uppercase tracking-[0.4em]">Confidential | 2026-2030 Portfolio</p>
          </div>
        </div>
      )
    },
    {
      id: 'vision',
      category: 'VISION',
      title: 'THE VISION',
      subtitle: 'The Transcendental Audit',
      bgPrompt: 'Macro cine lens reflecting a cold minimalist gallery, bokeh of warm amber studio light, 35mm grain.',
      content: (
        <div className="max-w-2xl space-y-12">
          <p className="text-3xl md:text-4xl leading-tight font-light italic text-white/90 border-l-2 border-amber-500/60 pl-10">
            "I am not merely directing a movie; I am conducting a creative audit of the human soul."
          </p>
          <p className="text-sm uppercase tracking-[0.25em] leading-relaxed text-white/40">
            Exploring the friction between the sterile <span className="text-white font-bold">Vanguard Collective</span> and the <span className="text-amber-500">Unfettered Truth</span> of raw authenticity.
          </p>
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/10">
            {['The Awakening', 'Architectural vs Biological', 'Unforbidden Truth'].map((tag, i) => (
              <div key={i} className="space-y-1">
                <span className="text-[10px] uppercase opacity-30 font-mono tracking-[0.2em]">{['Phase', 'Conflict', 'Goal'][i]}</span>
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
      bgPrompt: 'Geometric shadows cast by brutalist skylights onto a raw concrete wall, cinematic noir lighting.',
      content: (
        <div className="space-y-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 opacity-30 font-mono text-[10px] uppercase tracking-[0.5em]">
              <Layers size={14} /> Narrative Core
            </div>
            <p className="text-2xl font-bold tracking-tight max-w-3xl leading-snug border-l border-white/20 pl-8">
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
      bgPrompt: 'Vintage film canisters on a dark glass table, moody atmospheric lighting, amber highlights.',
      content: (
        <div className="space-y-8">
          <p className="text-white/40 max-w-lg text-xs uppercase tracking-[0.3em] font-light">
            Designed for global scalability, moving from raw local pulse to a prestige international event status.
          </p>
          <Roadmap />
        </div>
      )
    },
    {
      id: 'revenue',
      category: 'REVENUE',
      title: 'REVENUE ARCHITECTURE',
      bgPrompt: 'Painter\'s hands caked in thick black oil paint, macro textures, high contrast spotlight.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-8 group">
            <h4 className="text-sm font-black tracking-[0.6em] uppercase border-b border-white/10 pb-4 group-hover:border-amber-500/50 transition-colors">The Aza-Khem Asset</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-widest">
              The art created within UNFORBIDDEN is a tangible investment. Original works used in the film will be auctioned post-premiere as tier-2 revenue assets.
            </p>
            <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-3 text-[10px] font-mono text-emerald-400 border border-emerald-400/20">
              <TrendingUp size={14} /> Gallery-First Exit Strategy
            </div>
          </div>
          <div className="space-y-8 group">
            <h4 className="text-sm font-black tracking-[0.6em] uppercase border-b border-white/10 pb-4 group-hover:border-blue-500/50 transition-colors">Franchise Lensing</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-widest">
              Cast of international "Vanguard" icons allows for pre-sales in global markets under the proven prestige-indie synergy model.
            </p>
            <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-3 text-[10px] font-mono text-blue-400 border border-blue-400/20">
              <Briefcase size={14} /> Multi-Market pre-sales
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'methodology',
      category: 'METHODOLOGY',
      title: 'ACTION CARD SYSTEM',
      bgPrompt: 'Flickering film monitor showing blurred faces in conflict, raw cinematic grain, deep shadows.',
      content: (
        <div className="space-y-10">
          <div className="flex gap-4">
            <div className="bg-red-500/10 text-red-400 px-6 py-2 rounded-sm text-[10px] font-bold border border-red-500/30 uppercase tracking-[0.4em]">
              Precision vs Raw Impulse
            </div>
          </div>
          <p className="text-white/40 max-w-2xl text-xs uppercase tracking-[0.25em] leading-loose">
            Seasoned technical mastery pitted against raw, unpredictable energy to create visceral screen truth.
          </p>
          <ActionCards />
        </div>
      )
    },
    {
      id: 'technical',
      category: 'TECHNICAL',
      title: 'TECHNICAL TREATMENT',
      bgPrompt: 'Cold industrial blue glass against warm amber flame, anamorphic lens bokeh.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40"><Film size={18} /><span className="text-[10px] uppercase font-bold tracking-[0.5em]">Lensing</span></div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60 leading-relaxed">35mm Anamorphic. Clinical symmetry vs visceral handheld wide-angles.</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40"><Palette size={18} /><span className="text-[10px] uppercase font-bold tracking-[0.5em]">Palette</span></div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60 leading-relaxed">Sterile Whites & Blues bleeding into Turpentine Amber and Obsidian.</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40"><Volume2 size={18} /><span className="text-[10px] uppercase font-bold tracking-[0.5em]">Sonic</span></div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60 leading-relaxed">Minimalist echoes vs low-frequency heavy breathing and organic noise.</p>
          </div>
        </div>
      )
    },
    {
      id: 'investor',
      category: 'INVESTOR',
      title: 'INVESTOR BRIEF',
      bgPrompt: 'Solitary tailored suit hanging in a raw concrete corridor, sharp cinematic lighting.',
      content: (
        <div className="space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="bg-white/5 p-12 rounded-sm border border-white/5 space-y-10 backdrop-blur-2xl">
              <h5 className="font-bold flex items-center gap-3 text-xs tracking-[0.5em] uppercase opacity-70"><TrendingUp size={18} className="text-emerald-400" /> Key Value Prop</h5>
              <ul className="text-[10px] space-y-6 text-white/50 uppercase tracking-[0.3em] font-light">
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" /> 25% DTI Rebate Strategy</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" /> High-Prestige Festival Lock</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" /> Global SVOD Synergy</li>
              </ul>
            </div>
            <div className="bg-white/5 p-12 rounded-sm border border-white/5 space-y-10 backdrop-blur-2xl">
              <h5 className="font-bold flex items-center gap-3 text-xs tracking-[0.5em] uppercase opacity-70"><Briefcase size={18} className="text-blue-400" /> Exit Strategy</h5>
              <ul className="text-[10px] space-y-6 text-white/50 uppercase tracking-[0.3em] font-light">
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full" /> Festival Sale (Netflix/MUBI)</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full" /> Art Assets ROI (Post-Film)</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full" /> Global Franchising Plan</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/10 opacity-30">
            <p className="text-[9px] uppercase tracking-[1.2em] font-mono">UNFORBIDDEN TRUTH | THE AWAKENING 2026</p>
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
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const currentSlideData = slides[currentSlide];
  const progressPercent = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Background Layers */}
      {slides.map((s, i) => (
        <SlideBackground key={s.id} prompt={s.bgPrompt} isActive={i === currentSlide} />
      ))}

      {/* Nav & Branding Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 md:p-16 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex items-center gap-10">
          <div className={`w-1.5 h-24 ${CATEGORY_COLORS[currentSlideData.category]} border-l-2 transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.05)]`} />
          <div className="space-y-1">
            <motion.div 
              key={`cat-${currentSlide}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 0.3, x: 0 }}
              className="text-[11px] tracking-[0.8em] font-mono uppercase"
            >
              {currentSlideData.category}
            </motion.div>
            <div className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">UNFORBIDDEN</div>
          </div>
        </div>
        <div className="text-[11px] font-mono opacity-25 text-right tracking-[0.6em] uppercase leading-loose pt-2">
          PAGE {(currentSlide + 1).toString().padStart(2, '0')} // {slides.length.toString().padStart(2, '0')}<br />
          CPT | LON | NYC
        </div>
      </div>

      {/* Primary Slide Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-8 md:p-32 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 15, scale: 0.99, filter: 'brightness(2)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'brightness(1)' }}
            exit={{ opacity: 0, y: -15, scale: 1.01, filter: 'brightness(0.5)' }}
            transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
            className="w-full max-w-7xl pt-16"
          >
            {currentSlideData.subtitle && (
              <motion.span 
                initial={{ opacity: 0, letterSpacing: '1.5em' }}
                animate={{ opacity: 0.5, letterSpacing: '0.8em' }}
                transition={{ delay: 0.4, duration: 1 }}
                className="text-[11px] md:text-xs font-mono uppercase mb-8 block text-white/80"
              >
                {currentSlideData.subtitle}
              </motion.span>
            )}
            <h1 className={`text-5xl md:text-9xl font-black tracking-tighter leading-[0.82] mb-16 uppercase ${currentSlide === 0 ? 'text-center' : ''}`}>
              {currentSlideData.title}
            </h1>
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 1.2 }}
              className={`transition-all duration-1000 ${currentSlide === 0 ? 'flex justify-center' : ''}`}
            >
              {currentSlideData.content}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Film Strip Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 z-50">
        <motion.div 
          className="h-full bg-white/40 shadow-[0_0_10px_white]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute top-0 left-0 w-full h-full flex justify-around pointer-events-none opacity-20">
          {slides.map((_, i) => (
            <div key={i} className="w-px h-full bg-black" />
          ))}
        </div>
      </div>

      {/* Presentation Footer Controls */}
      <div className="absolute bottom-4 left-0 w-full p-8 md:p-16 flex justify-between items-end z-50">
        <div className="flex gap-6 items-center bg-white/5 backdrop-blur-3xl px-10 py-5 rounded-full border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-1 h-1 rounded-full transition-all duration-1000 ${i === currentSlide ? 'bg-white scale-[3.5] shadow-[0_0_15px_white]' : 'bg-white/15 hover:bg-white/50'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-8">
          <div className="flex gap-3">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-6 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5 active:scale-95 group"
            >
              <ChevronLeft size={24} className="group-active:translate-x-[-2px] transition-transform" />
            </button>
            <button 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="p-6 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5 active:scale-95 group"
            >
              <ChevronRight size={24} className="group-active:translate-x-[2px] transition-transform" />
            </button>
          </div>
          
          <div className="w-px h-16 bg-white/10 mx-2" />
          
          <button 
            onClick={toggleFullscreen}
            className="p-6 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 opacity-40 hover:opacity-100 active:scale-90"
            title="Toggle Cinema Mode (F)"
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
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