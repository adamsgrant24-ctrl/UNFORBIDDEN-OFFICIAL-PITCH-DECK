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
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

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

// --- Mock Data & Content Components ---

const CastingTable = () => (
  <div className="overflow-x-auto w-full mt-4 border border-white/10 rounded-sm">
    <table className="w-full text-left text-xs md:text-sm border-collapse">
      <thead>
        <tr className="border-b border-white/20 bg-white/5 uppercase tracking-widest text-[10px]">
          <th className="p-4 opacity-50">Character</th>
          <th className="p-4 opacity-50">Status</th>
          <th className="p-4 opacity-50">Function</th>
        </tr>
      </thead>
      <tbody>
        {[
          { name: "Luke (Teboho Mzisa)", status: "Attached", fn: "The Obsidian Shadow. Raw, visceral." },
          { name: "The Anchor (Annette Miller)", status: "Attached", fn: "Architect of Wisdom. Bridge to truth." },
          { name: "The Mother (Pamela Nomvete)", status: "Offer Pending", fn: "The Gatekeeper. Sterile power." },
          { name: "Zola (Nefisa Mkhabela)", status: "Offer Pending", fn: "The Mirror. Gilded cage success." },
          { name: "The Critic (John Kani)", status: "Offer Pending", fn: "The Labeler. Academic subtext." }
        ].map((char, i) => (
          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td className="p-4 font-bold">{char.name}</td>
            <td className={`p-4 ${char.status === 'Attached' ? 'text-emerald-400' : 'text-amber-400 opacity-80'}`}>{char.status}</td>
            <td className="p-4 text-white/50">{char.fn}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Roadmap = () => (
  <div className="flex flex-col gap-6 mt-8">
    {[
      { phase: "I: The Awakening", budget: "R500,000 Seed", goal: "Festival Prestige (Sundance/Berlinale)" },
      { phase: "II: Resistance", budget: "R2.5M - R5M", goal: "Intl Co-production (CT & London)" },
      { phase: "III: The Legacy", budget: "R10M+", goal: "Global Streaming (Netflix/A24)" }
    ].map((step, i) => (
      <div key={i} className="flex items-center gap-6 group">
        <div className="w-12 h-12 rounded-sm bg-white/5 flex items-center justify-center font-mono text-lg border border-white/10 group-hover:bg-white/10 transition-all">
          0{i+1}
        </div>
        <div className="flex-1 bg-white/5 p-6 rounded-sm border-l-2 border-white/20 backdrop-blur-md">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-bold text-lg tracking-tight">{step.phase}</h4>
            <span className="text-xs opacity-40 font-mono tracking-tighter uppercase">{step.budget}</span>
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest leading-loose">{step.goal}</p>
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
      <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-sm hover:border-white/30 transition-all group">
        <div className="text-[10px] font-mono opacity-30 mb-2 uppercase tracking-[0.3em]">{card.role}</div>
        <div className="text-xl font-black tracking-tighter mb-4 underline decoration-white/10 underline-offset-8 group-hover:decoration-white/30 transition-all">{card.title}</div>
        <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider">{card.desc}</p>
      </div>
    ))}
  </div>
);

// --- Background Component ---

const SlideBackground = ({ prompt, isActive }: { prompt: string; isActive: boolean }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isActive && !imageUrl && !loading) {
      const fetchImage = async () => {
        setLoading(true);
        setError(false);
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `High-prestige cinematic film still, 35mm anamorphic. ${prompt}. High-end architectural noir, brutalist concrete, moody lighting, obsidian black and turpentine amber accents, Kodak Vision3 500T aesthetic.` }] },
            config: { imageConfig: { aspectRatio: "16:9" } },
          });
          
          const imageData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
          if (imageData && isMounted) {
            setImageUrl(`data:image/png;base64,${imageData}`);
          }
        } catch (err) {
          console.error("Asset generation failed:", err);
          if (isMounted) setError(true);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchImage();
    }
    return () => { isMounted = false; };
  }, [isActive, prompt, imageUrl, loading]);

  return (
    <div className="absolute inset-0 overflow-hidden z-0 bg-[#050505]">
      <AnimatePresence>
        {imageUrl ? (
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            exit={{ opacity: 0 }}
            src={imageUrl}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-20">
            {loading ? (
              <>
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                <span className="text-[10px] font-mono tracking-[0.5em] uppercase">Rendering Narrative Space...</span>
              </>
            ) : error && isActive ? (
              <AlertCircle size={32} className="text-white/20" />
            ) : null}
          </div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
      <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
    </div>
  );
};

// --- Main Application ---

const PresentationApp = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides: SlideType[] = [
    {
      id: 'title',
      category: 'TITLE',
      title: 'UNFORBIDDEN',
      subtitle: 'PART I: THE AWAKENING | A TRILOGY',
      bgPrompt: 'High-art geometry of a glass-and-steel modern museum at night, clinical distance, moonlight shadows.',
      content: (
        <div className="mt-16 space-y-4 text-center">
          <h3 className="text-xl tracking-[0.6em] font-light opacity-60 uppercase">The Architectural Prospectus</h3>
          <p className="text-[10px] tracking-[0.8em] opacity-30 uppercase font-mono">Transcendental Audit of the Invincible Prison</p>
          <div className="pt-40 space-y-2">
            <p className="font-black tracking-[1em] text-sm uppercase">BY AZA-KHEM</p>
            <p className="text-[10px] opacity-40 font-mono uppercase tracking-[0.2em]">Portfolio 2026-2030 | Confidential</p>
          </div>
        </div>
      )
    },
    {
      id: 'vision',
      category: 'VISION',
      title: 'THE VISION',
      subtitle: 'The Transcendental Audit',
      bgPrompt: 'Macro shot of raw turpentine paint mixed with charcoal on a white canvas in a gritty minimalist studio.',
      content: (
        <div className="max-w-3xl space-y-12">
          <p className="text-3xl md:text-5xl leading-tight font-light italic text-white/90 border-l border-white/10 pl-12 py-2">
            "I am not merely directing a movie; I am conducting a creative audit of the human soul."
          </p>
          <p className="text-sm uppercase tracking-[0.3em] leading-loose text-white/50">
            Exploring the terminal friction between the <span className="text-white font-bold">Vanguard Collective</span>—sterile glass-and-steel—and the <span className="text-amber-500 font-bold">Unfettered Truth</span> of raw biological authenticity.
          </p>
          <div className="grid grid-cols-3 gap-12 pt-8 border-t border-white/5">
            {[
              { label: 'Phase', val: 'The Awakening' },
              { label: 'Conflict', val: 'Architectural vs Biological' },
              { label: 'Core Goal', val: 'Unforbidden Truth' }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <span className="text-[10px] uppercase opacity-30 font-mono tracking-widest">{stat.label}</span>
                <p className="text-xs font-black uppercase tracking-tight">{stat.val}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'blueprint',
      category: 'BLUEPRINT',
      title: 'THE MASTER BLUEPRINT',
      bgPrompt: 'Wide shot of a modern gallery with a dark silhouette figure standing against an empty frame.',
      content: (
        <div className="space-y-12">
          <div className="space-y-4">
            <span className="text-[10px] font-mono opacity-30 uppercase tracking-[0.4em]">Narrative Foundation</span>
            <p className="text-3xl font-black tracking-tight max-w-4xl leading-snug">To find the "unforbidden" truth in his art, a rising painter must dismantle the glass-and-steel legacy of his mother’s empire.</p>
          </div>
          <CastingTable />
        </div>
      )
    },
    {
      id: 'roadmap',
      category: 'BLUEPRINT',
      title: 'TRILOGY ROADMAP',
      bgPrompt: 'Overhead shot of a glass table with architectural blueprints and vintage film canisters.',
      content: (
        <div className="space-y-6">
          <p className="text-white/40 max-w-xl text-xs uppercase tracking-[0.4em] leading-loose">
            Designed for scalability and prestige reach, moving from raw local pulse to a global streaming event status.
          </p>
          <Roadmap />
        </div>
      )
    },
    {
      id: 'revenue',
      category: 'REVENUE',
      title: 'REVENUE ARCHITECTURE',
      bgPrompt: 'Macro shot of dark obsidian landscape paintings with red sold stickers in a high-end gallery.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-8 group">
            <h4 className="text-xs font-black tracking-[0.6em] uppercase border-b border-white/10 pb-6 group-hover:border-emerald-500/50 transition-colors">The Aza-Khem Asset</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-widest">
              The art created within UNFORBIDDEN is a tangible investment. High-value original works used as props will be auctioned post-premiere for immediate ROI.
            </p>
            <div className="inline-flex bg-white/5 px-6 py-3 rounded-sm border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              GALLERY-FIRST STRATEGY
            </div>
          </div>
          <div className="space-y-8 group">
            <h4 className="text-xs font-black tracking-[0.6em] uppercase border-b border-white/10 pb-6 group-hover:border-blue-500/50 transition-colors">Franchise Lensing</h4>
            <p className="text-sm text-white/50 leading-relaxed uppercase tracking-widest">
              A meticulously curated cast of international icons allows pre-sales in major territories under the proven prestige-indie synergy model.
            </p>
            <div className="inline-flex bg-white/5 px-6 py-3 rounded-sm border border-blue-500/20 text-[10px] font-mono text-blue-400">
              A24 / SEARCHLIGHT SYNERGY
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'methodology',
      category: 'METHODOLOGY',
      title: 'ACTION CARD SYSTEM',
      bgPrompt: 'Close up profile of an actor with sweat and intense focus, cinematic 35mm texture.',
      content: (
        <div className="space-y-8">
          <div className="inline-block bg-red-500/10 text-red-400 px-6 py-2 rounded-sm text-[10px] font-bold border border-red-500/30 uppercase tracking-[0.4em]">
            Precision vs Raw Visceral Impulse
          </div>
          <p className="text-white/40 max-w-2xl text-xs uppercase tracking-[0.3em] leading-loose">
            Bypassing the "rehearsed" to extract screen truth. Seasoned technical mastery pitted against raw, unpredictable human energy.
          </p>
          <ActionCards />
        </div>
      )
    },
    {
      id: 'technical',
      category: 'TECHNICAL',
      title: 'TECHNICAL TREATMENT',
      bgPrompt: 'Contrast shot between sterile clinical lab lighting and warm amber studio sparks.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { icon: <Maximize size={18} />, title: "Lensing", desc: "35mm Anamorphic. Clinical symmetry for the collective vs Visceral handheld for the studio." },
            { icon: <Palette size={18} />, title: "Palette", desc: "Transition from Sterile Museum White to raw Turpentine Amber and Obsidian Black." },
            { icon: <Volume2 size={18} />, title: "Sonic", desc: "Minimalist concrete echoes vs high-fidelity organic noise and heavy low-frequency pulses." }
          ].map((item, i) => (
            <div key={i} className="space-y-6 group">
              <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                {item.icon}
                <span className="text-[10px] uppercase font-bold tracking-[0.6em]">{item.title}</span>
              </div>
              <p className="text-xs text-white/40 uppercase leading-loose tracking-wider border-l border-white/5 pl-6">{item.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'investor',
      category: 'INVESTOR',
      title: 'INVESTOR BRIEF',
      bgPrompt: 'Silhouette of a figure in a tailored suit in a high-rise office at twilight, cityscape bokeh.',
      content: (
        <div className="space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white/5 p-12 rounded-sm border border-white/5 space-y-8 backdrop-blur-2xl hover:bg-white/10 transition-colors">
              <h5 className="font-bold flex items-center gap-4 text-xs tracking-[0.5em] uppercase opacity-70"><TrendingUp size={16} className="text-emerald-400" /> Strategic Value</h5>
              <ul className="text-[10px] space-y-6 text-white/40 uppercase tracking-[0.3em] font-light">
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" /> 25% DTI Rebate Qualification</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" /> Tier-1 Film Festival Pipeline</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" /> Global SVOD Premium License</li>
              </ul>
            </div>
            <div className="bg-white/5 p-12 rounded-sm border border-white/5 space-y-8 backdrop-blur-2xl hover:bg-white/10 transition-colors">
              <h5 className="font-bold flex items-center gap-4 text-xs tracking-[0.5em] uppercase opacity-70"><Briefcase size={16} className="text-blue-400" /> Exit Strategy</h5>
              <ul className="text-[10px] space-y-6 text-white/40 uppercase tracking-[0.3em] font-light">
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full" /> Market Buy-out (A24/Neon)</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full" /> Physical Art Secondary Gains</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full" /> Equity Buy-back Participation</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/5 opacity-20">
            <p className="text-[10px] uppercase tracking-[1em] font-mono">Confidential Prospectus | 2026-2027</p>
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
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
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

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Background Layers */}
      {slides.map((s, i) => (
        <SlideBackground key={s.id} prompt={s.bgPrompt} isActive={i === currentSlide} />
      ))}

      {/* Navigation Overlay */}
      <div className="absolute top-0 left-0 w-full p-12 md:p-20 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex items-center gap-12">
          <div className={`w-1 h-24 ${CATEGORY_COLORS[currentSlideData.category]} border-l-4 transition-all duration-1000 shadow-[0_0_30px_rgba(255,255,255,0.05)]`} />
          <div className="space-y-2">
            <motion.div 
              key={`cat-${currentSlide}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.4, x: 0 }}
              className="text-[12px] tracking-[0.8em] font-mono uppercase"
            >
              {currentSlideData.category}
            </motion.div>
            <div className="text-4xl font-black tracking-tighter uppercase leading-none">UNFORBIDDEN</div>
          </div>
        </div>
        <div className="text-[10px] font-mono opacity-20 text-right tracking-[0.5em] uppercase leading-loose">
          PAGE {(currentSlide + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}<br />
          CAPE TOWN | LONDON | NYC
        </div>
      </div>

      {/* Primary Slide Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-12 md:p-40 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30, filter: 'brightness(2)' }}
            animate={{ opacity: 1, x: 0, filter: 'brightness(1)' }}
            exit={{ opacity: 0, x: -30, filter: 'brightness(0)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-7xl pt-12"
          >
            {currentSlideData.subtitle && (
              <motion.span 
                initial={{ opacity: 0, letterSpacing: '1.5em' }}
                animate={{ opacity: 0.4, letterSpacing: '0.8em' }}
                className="text-[11px] font-mono uppercase mb-10 block"
              >
                {currentSlideData.subtitle}
              </motion.span>
            )}
            <h1 className={`text-5xl md:text-[8rem] font-black tracking-tighter leading-[0.85] mb-20 uppercase ${currentSlide === 0 ? 'text-center' : ''}`}>
              {currentSlideData.title}
            </h1>
            <div className={`transition-all duration-1000 ${currentSlide === 0 ? 'flex justify-center' : ''}`}>
              {currentSlideData.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Controls */}
      <div className="absolute bottom-0 left-0 w-full p-12 md:p-20 flex justify-between items-end z-50">
        <div className="flex gap-4 items-center bg-white/5 backdrop-blur-3xl px-10 py-5 rounded-full border border-white/5 shadow-2xl">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${i === currentSlide ? 'bg-white w-8 shadow-[0_0_15px_white]' : 'bg-white/10 hover:bg-white/30'}`}
              title={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-10">
          <div className="flex gap-3">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-6 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5 active:scale-90 backdrop-blur-md"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="p-6 bg-white/5 hover:bg-white/10 disabled:opacity-0 rounded-full transition-all border border-white/5 active:scale-90 backdrop-blur-md"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className="w-px h-16 bg-white/5 mx-2" />
          
          <button 
            onClick={toggleFullscreen}
            className="p-6 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 opacity-40 hover:opacity-100 active:scale-90 backdrop-blur-md"
            title="Toggle Cinema Mode (F)"
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App Boostrap ---

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PresentationApp />);
}