import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layout, 
  Eye, 
  Layers, 
  Users, 
  TrendingUp, 
  Settings, 
  Cpu, 
  Volume2, 
  Briefcase, 
  Globe, 
  Palette,
  Maximize,
  Minimize,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

// --- Types & Constants ---

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// --- Mock Data & Content ---

const CastingTable = () => (
  <div className="overflow-x-auto w-full mt-4">
    <table className="w-full text-left text-sm border-collapse">
      <thead>
        <tr className="border-b border-white/20 bg-white/5">
          <th className="p-3 font-bold">Character</th>
          <th className="p-3 font-bold">Casting Status</th>
          <th className="p-3 font-bold">Function</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-white/10">
          <td className="p-3 font-semibold">Luke (Teboho Mzisa)</td>
          <td className="p-3 text-emerald-400">Attached</td>
          <td className="p-3 text-white/70">The Obsidian Shadow. Raw, visceral.</td>
        </tr>
        <tr className="border-b border-white/10">
          <td className="p-3 font-semibold">The Anchor (Annette Miller)</td>
          <td className="p-3 text-emerald-400">Attached</td>
          <td className="p-3 text-white/70">Architect of Wisdom. Bridge to truth.</td>
        </tr>
        <tr className="border-b border-white/10">
          <td className="p-3 font-semibold">The Mother (Pamela Nomvete)</td>
          <td className="p-3 text-amber-400">Offer Pending</td>
          <td className="p-3 text-white/70">The Gatekeeper. Sterile power.</td>
        </tr>
        <tr className="border-b border-white/10">
          <td className="p-3 font-semibold">Zola (Nefisa Mkhabela)</td>
          <td className="p-3 text-amber-400">Offer Pending</td>
          <td className="p-3 text-white/70">The Mirror. Gilded cage success.</td>
        </tr>
        <tr className="border-b border-white/10">
          <td className="p-3 font-semibold">The Critic (John Kani)</td>
          <td className="p-3 text-amber-400">Offer Pending</td>
          <td className="p-3 text-white/70">The Labeler. Academic subtext.</td>
        </tr>
        <tr className="border-b border-white/10">
          <td className="p-3 font-semibold">The Patron (Ian Roberts)</td>
          <td className="p-3 text-amber-400">Offer Pending</td>
          <td className="p-3 text-white/70">Commodity Consumer. Polished old money.</td>
        </tr>
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
      <div key={i} className="flex items-center gap-4 group">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold group-hover:bg-white/20 transition-all border border-white/20">
          0{i+1}
        </div>
        <div className="flex-1 bg-black/40 p-4 rounded-lg border-l-2 border-white/30 backdrop-blur-md">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-bold text-lg">{step.phase}</h4>
            <span className="text-sm opacity-60 font-mono">{step.budget}</span>
          </div>
          <p className="text-white/70 text-sm">Goal: {step.goal}</p>
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
      <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-sm hover:border-white/40 transition-all">
        <div className="text-xs opacity-50 mb-1">{card.role}</div>
        <div className="text-xl font-bold tracking-tighter mb-2 underline decoration-white/20 underline-offset-4">{card.title}</div>
        <p className="text-sm text-white/60">{card.desc}</p>
      </div>
    ))}
  </div>
);

// --- Components ---

const SlideBackground = ({ prompt, isActive }: { prompt: string; isActive: boolean }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isActive && !imageUrl && !loading) {
      const fetchImage = async () => {
        setLoading(true);
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Cinematic architectural noir film still, 35mm anamorphic. ${prompt}. Moody lighting, high contrast, obsidian black and turpentine amber tones, high prestige aesthetic.` }] },
            config: { imageConfig: { aspectRatio: "16:9" } },
          });
          
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
              break;
            }
          }
        } catch (error) {
          console.error("Failed to generate background:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchImage();
    }
  }, [isActive, prompt, imageUrl, loading]);

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <AnimatePresence>
        {imageUrl ? (
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={imageUrl}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};

const PresentationApp = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides: SlideType[] = [
    {
      id: 'title',
      category: 'TITLE',
      title: 'UNFORBIDDEN',
      subtitle: 'PART I: THE AWAKENING | A TRILOGY',
      bgPrompt: 'High-art geometry of a glass-and-steel modern museum at night, clinical distance.',
      content: (
        <div className="mt-12 space-y-2 text-center">
          <h3 className="text-xl tracking-[0.3em] font-light opacity-80 uppercase">The Architectural Prospectus</h3>
          <p className="text-sm tracking-widest opacity-50">Transcendental Audit of the Invincible Prison</p>
          <div className="pt-24 space-y-1">
            <p className="font-bold tracking-widest">BY AZA-KHEM</p>
            <p className="text-xs opacity-50 font-mono">azakhem26@gmail.com | 073628530</p>
          </div>
        </div>
      )
    },
    {
      id: 'vision',
      category: 'VISION',
      title: 'THE VISION',
      subtitle: 'The Transcendental Audit',
      bgPrompt: 'A close up of raw thick turpentine paint mixed with charcoal on a white canvas in a gritty Woodstock studio.',
      content: (
        <div className="max-w-2xl space-y-6">
          <p className="text-2xl leading-relaxed font-light italic text-white/90">
            "I am not merely directing a movie; I am conducting a creative audit of the human soul."
          </p>
          <p className="text-white/70">
            Exploring the profound friction between the Vanguard Collective—sterile glass-and-steel—and the Unfettered Truth of raw authenticity.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="border-l border-white/20 pl-4">
              <span className="text-xs uppercase opacity-50">Focus</span>
              <p className="text-sm font-bold">The Awakening</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-xs uppercase opacity-50">Conflict</span>
              <p className="text-sm font-bold">Architectural vs Biological</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-xs uppercase opacity-50">Goal</span>
              <p className="text-sm font-bold">Unforbidden Truth</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'blueprint',
      category: 'BLUEPRINT',
      title: 'THE MASTER BLUEPRINT',
      bgPrompt: '35mm anamorphic wide shot of a modern gallery with Luke standing as a dark silhouette against a massive empty frame.',
      content: (
        <div className="space-y-8">
          <div>
            <span className="text-xs font-mono opacity-50 uppercase tracking-widest">Logline</span>
            <p className="text-2xl font-bold tracking-tight">To find the "unforbidden" truth in his art, a rising painter must dismantle the glass-and-steel legacy of his mother’s empire.</p>
          </div>
          <div>
            <span className="text-xs font-mono opacity-50 uppercase tracking-widest">Tagline</span>
            <p className="text-lg italic text-amber-400">"Truth is the only masterpiece that cannot be owned."</p>
          </div>
          <CastingTable />
        </div>
      )
    },
    {
      id: 'roadmap',
      category: 'BLUEPRINT',
      title: 'TRILOGY ROADMAP',
      bgPrompt: 'Clinical overhead shot of a glass table with architectural blueprints and 35mm film strips.',
      content: (
        <div className="space-y-4">
          <p className="text-white/60 max-w-lg">Designed for scalability and international reach, moving from local pulse to global event status.</p>
          <Roadmap />
        </div>
      )
    },
    {
      id: 'revenue',
      category: 'REVENUE',
      title: 'REVENUE ARCHITECTURE',
      bgPrompt: 'High-end art gallery with red "sold" stickers next to dark obsidian landscape paintings.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xl font-bold border-b border-white/20 pb-2">The Aza-Khem Collection</h4>
            <p className="text-sm text-white/70">Unlike typical films, the art created within UNFORBIDDEN is a tangible asset. High-value original works used as props will be auctioned post-premiere for immediate ROI.</p>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <span className="text-xs font-mono text-emerald-400">Gallery-First Exit Strategy</span>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xl font-bold border-b border-white/20 pb-2">Franchise Lensing</h4>
            <p className="text-sm text-white/70">International "Vanguard" pillars (John Kani, Ian Roberts) allow sales agents to secure Minimum Guarantees in US/EU markets before completion.</p>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <span className="text-xs font-mono text-blue-400">A24 / NEON Model Synergy</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'methodology',
      category: 'METHODOLOGY',
      title: 'THE ACTION CARD SYSTEM',
      bgPrompt: 'Intimate handheld 35mm shot of two actors in a heated confrontation, sweat and raw emotion visible.',
      content: (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">Technical Mastery vs Raw Impulse</div>
          </div>
          <p className="text-white/70 max-w-2xl">Bypassing the "rehearsed" to reach the "real." Seasoned precision (John Kani, Annette Miller) pitted against raw, unpredictable energy (Teboho Mzisa).</p>
          <ActionCards />
        </div>
      )
    },
    {
      id: 'technical',
      category: 'TECHNICAL',
      title: 'TECHNICAL TREATMENT',
      bgPrompt: 'Cinematic wide shot showing the contrast between the sterile Norval Foundation and a cluttered Woodstock studio.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2"><Maximize className="w-4 h-4 text-white/50" /><span className="text-xs uppercase font-bold">Lensing</span></div>
            <p className="text-sm text-white/60">35mm Anamorphic. Clinical/Symmetrical for the Elite world. Tight/Handheld/Dirty for the Artist's studio.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><Palette className="w-4 h-4 text-white/50" /><span className="text-xs uppercase font-bold">Palette</span></div>
            <p className="text-sm text-white/60">Transition from Sterile White/Glass Blue to Turpentine Amber and Obsidian Black.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-white/50" /><span className="text-xs uppercase font-bold">Sonic</span></div>
            <p className="text-sm text-white/60">Sharp minimalist echoes vs heavy breathing and low-frequency ambient "heat".</p>
          </div>
        </div>
      )
    },
    {
      id: 'investor',
      category: 'INVESTOR',
      title: 'INVESTOR BRIEF',
      bgPrompt: 'Silhouette of a figure in a high-rise office overlooking a city at dusk, cinematic blue hour.',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-4">
              <h5 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Value Proposition</h5>
              <ul className="text-sm space-y-2 text-white/70 list-disc list-inside">
                <li>25% DTI Rebate utilization</li>
                <li>Prestige-Genre Hybrid (Moonlight/Parasite model)</li>
                <li>40% growth in elevated drama demand</li>
              </ul>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-4">
              <h5 className="font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" /> Exit Strategy</h5>
              <ul className="text-sm space-y-2 text-white/70 list-disc list-inside">
                <li>SVOD Buy-out (Netflix/MUBI) post-festival</li>
                <li>Physical Art Auction (Tier 2 Revenue)</li>
                <li>Equity Buy-back options for seed investors</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.5em] opacity-50">Confidential Investor Brief | 2026-2030</p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = useCallback(() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1)), [slides.length]);
  const prevSlide = useCallback(() => setCurrentSlide(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
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
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Background with Motion */}
      <SlideBackground prompt={currentSlideData.bgPrompt} isActive={true} />

      {/* Header Info */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className={`w-1 h-12 ${CATEGORY_COLORS[currentSlideData.category]} border-l-4 transition-colors duration-500`} />
          <div>
            <div className="text-[10px] tracking-[0.3em] font-mono opacity-50 uppercase">{currentSlideData.category}</div>
            <div className="text-xl font-black tracking-tighter">UNFORBIDDEN</div>
          </div>
        </div>
        <div className="text-[10px] font-mono opacity-50 text-right">
          PAGE {(currentSlide + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}<br />
          CPT | LON | NYC
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-8 md:p-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-6xl"
          >
            {currentSlideData.subtitle && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-xs md:text-sm font-mono tracking-[0.4em] uppercase mb-2 block"
              >
                {currentSlideData.subtitle}
              </motion.span>
            )}
            <h1 className={`text-4xl md:text-7xl font-black tracking-tighter leading-none mb-8 ${currentSlide === 0 ? 'text-center' : ''}`}>
              {currentSlideData.title}
            </h1>
            <div className={`transition-all duration-700 delay-300 ${currentSlide === 0 ? 'flex justify-center' : ''}`}>
              {currentSlideData.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20">
        <div className="flex gap-2 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/20 hover:bg-white/40'}`}
              title={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-20 rounded-full transition-all border border-white/10"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-20 rounded-full transition-all border border-white/10"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-2" />
          
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* Film Grain & Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

// --- Initial Render ---

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PresentationApp />);
}