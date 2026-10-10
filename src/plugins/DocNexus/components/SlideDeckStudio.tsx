import React, { useState, useEffect } from 'react';
import { SlideDeckState, SlideItem } from '../types.js';
import { 
  Plus, 
  Trash2, 
  Play, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Palette, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';

interface SlideDeckStudioProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  theme?: 'dark' | 'light';
}

const DEFAULT_SLIDES: SlideDeckState = {
  aspectRatio: '16:9',
  theme: 'cyan',
  slides: [
    {
      id: 's1',
      title: 'SutharLabs Sovereign Suite',
      subtitle: 'Enterprise Architecture & Creative Processing Engine',
      layout: 'title',
      speakerNotes: 'Welcome stakeholders to the architectural review.'
    },
    {
      id: 's2',
      title: 'Executive Highlights & Objectives',
      layout: 'bullets',
      bulletPoints: [
        'Unified document processing across 5 native paradigms',
        'Multi-tenant persistence with PostgreSQL and fallback caching',
        'Statutory Indian GST Rule 46 Tax Invoicing & GSTR returns'
      ],
      speakerNotes: 'Detail the strategic advantages of the platform.'
    },
    {
      id: 's3',
      title: 'Platform Velocity Index',
      layout: 'metric',
      metricValue: '10x',
      metricLabel: 'Faster time-to-deliver for technical architecture specs',
      speakerNotes: 'Showcase benchmark numbers.'
    }
  ]
};

const THEME_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  cyan: { bg: '#08141e', text: '#ffffff', accent: '#00dbe7' },
  purple: { bg: '#170c24', text: '#ffffff', accent: '#ce5dff' },
  amber: { bg: '#1c1708', text: '#ffffff', accent: '#ffd700' },
  dark: { bg: '#0a0a0c', text: '#ffffff', accent: '#00e476' },
  light: { bg: '#f8fafc', text: '#0f172a', accent: '#0284c7' }
};

export default function SlideDeckStudio({
  content,
  onChangeContent,
  theme = 'dark'
}: SlideDeckStudioProps) {
  const isLight = theme === 'light';

  const deckState: SlideDeckState = React.useMemo(() => {
    try {
      if (!content) return DEFAULT_SLIDES;
      const parsed = JSON.parse(content);
      return { ...DEFAULT_SLIDES, ...parsed };
    } catch {
      return DEFAULT_SLIDES;
    }
  }, [content]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPresenterMode, setIsPresenterMode] = useState(false);

  const activeSlide = deckState.slides[activeSlideIndex] || deckState.slides[0];
  const activeTheme = THEME_STYLES[deckState.theme] || THEME_STYLES.cyan;

  const updateDeck = (newState: Partial<SlideDeckState>) => {
    const updated = { ...deckState, ...newState };
    onChangeContent(JSON.stringify(updated));
  };

  const handleUpdateActiveSlide = (field: keyof SlideItem, value: any) => {
    const updatedSlides = deckState.slides.map((s, idx) =>
      idx === activeSlideIndex ? { ...s, [field]: value } : s
    );
    updateDeck({ slides: updatedSlides });
  };

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: `s_${Date.now().toString(36)}`,
      title: `New Slide ${deckState.slides.length + 1}`,
      subtitle: 'Add subtitle or description',
      layout: 'bullets',
      bulletPoints: ['First bullet point', 'Second bullet point'],
      speakerNotes: ''
    };
    const nextSlides = [...deckState.slides, newSlide];
    updateDeck({ slides: nextSlides });
    setActiveSlideIndex(nextSlides.length - 1);
  };

  const handleDeleteSlide = () => {
    if (deckState.slides.length <= 1) return;
    const nextSlides = deckState.slides.filter((_, idx) => idx !== activeSlideIndex);
    updateDeck({ slides: nextSlides });
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  // Keyboard navigation during Presenter Mode
  useEffect(() => {
    if (!isPresenterMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setActiveSlideIndex(prev => Math.min(deckState.slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setIsPresenterMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenterMode, deckState.slides.length]);

  return (
    <div className="flex flex-col h-full overflow-hidden select-none relative">
      {/* Studio Ribbon Toolbar */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 font-sans text-xs z-10 transition-colors ${
        isLight ? 'bg-slate-50/90 border-slate-200/90 text-slate-800' : 'bg-[#0e0e14]/90 border-white/[0.08] text-white'
      }`}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSlideIndex(s => Math.max(0, s - 1))}
            disabled={activeSlideIndex === 0}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${
              isLight ? 'hover:bg-slate-200/70 text-slate-600' : 'hover:bg-white/10 text-slate-400'
            }`}
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-xs px-1 text-slate-700 dark:text-slate-200">
            Slide {activeSlideIndex + 1} of {deckState.slides.length}
          </span>
          <button
            onClick={() => setActiveSlideIndex(s => Math.min(deckState.slides.length - 1, s + 1))}
            disabled={activeSlideIndex === deckState.slides.length - 1}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${
              isLight ? 'hover:bg-slate-200/70 text-slate-600' : 'hover:bg-white/10 text-slate-400'
            }`}
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleAddSlide}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 ml-2 transition-all cursor-pointer border ${
              isLight 
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs' 
                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-cyan-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Slide
          </button>

          {deckState.slides.length > 1 && (
            <button
              onClick={handleDeleteSlide}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer ml-1"
              title="Delete Current Slide"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Layout & Theme Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={activeSlide.layout}
            onChange={e => handleUpdateActiveSlide('layout', e.target.value)}
            className={`border rounded-xl px-2.5 py-1.5 text-xs font-sans transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
            }`}
          >
            <option value="title">Title Layout</option>
            <option value="bullets">Bullets Layout</option>
            <option value="metric">Key Metric Layout</option>
            <option value="split">2-Column Split</option>
            <option value="quote">Quote Layout</option>
          </select>

          <select
            value={deckState.theme}
            onChange={e => updateDeck({ theme: e.target.value as any })}
            className={`border rounded-xl px-2.5 py-1.5 text-xs font-sans transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
            }`}
          >
            <option value="cyan">Cyan Theme</option>
            <option value="purple">Purple Theme</option>
            <option value="amber">Amber Theme</option>
            <option value="dark">Dark Theme</option>
            <option value="light">Clean Light</option>
          </select>

          <button
            onClick={() => setIsPresenterMode(true)}
            className="px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white ml-2 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Present</span>
          </button>
        </div>
      </div>

      {/* Main Slide Canvas */}
      <div className={`flex-1 overflow-auto p-8 flex items-center justify-center custom-scrollbar ${
        isLight ? 'bg-slate-200/80' : 'bg-[#050507]'
      }`}>
        <div 
          style={{
            backgroundColor: activeTheme.bg,
            color: activeTheme.text
          }}
          className="w-[850px] h-[480px] rounded-xl shadow-2xl p-12 flex flex-col justify-between border border-white/10 relative transition-all"
        >
          {/* Header Indicator */}
          <div className="flex justify-between items-center text-xs opacity-50 font-mono">
            <span>SUTHARLABS PRESENTATIONS</span>
            <span>{activeSlideIndex + 1} / {deckState.slides.length}</span>
          </div>

          {/* Slide Layout Body */}
          <div className="flex-1 flex flex-col justify-center my-6">
            {activeSlide.layout === 'title' && (
              <div className="text-center space-y-4">
                <input
                  type="text"
                  value={activeSlide.title}
                  onChange={e => handleUpdateActiveSlide('title', e.target.value)}
                  style={{ color: activeTheme.accent }}
                  className="text-4xl font-black tracking-tight bg-transparent border-none focus:outline-none text-center w-full"
                />
                <input
                  type="text"
                  value={activeSlide.subtitle || ''}
                  onChange={e => handleUpdateActiveSlide('subtitle', e.target.value)}
                  className="text-lg opacity-80 bg-transparent border-none focus:outline-none text-center w-full"
                />
              </div>
            )}

            {activeSlide.layout === 'bullets' && (
              <div className="space-y-6">
                <input
                  type="text"
                  value={activeSlide.title}
                  onChange={e => handleUpdateActiveSlide('title', e.target.value)}
                  style={{ color: activeTheme.accent }}
                  className="text-3xl font-bold tracking-tight bg-transparent border-none focus:outline-none w-full"
                />
                <textarea
                  value={(activeSlide.bulletPoints || []).join('\n')}
                  onChange={e => handleUpdateActiveSlide('bulletPoints', e.target.value.split('\n'))}
                  placeholder="Bullet points (one per line)..."
                  className="w-full text-base leading-relaxed bg-transparent border-none focus:outline-none resize-none h-44"
                />
              </div>
            )}

            {activeSlide.layout === 'metric' && (
              <div className="text-center space-y-3">
                <input
                  type="text"
                  value={activeSlide.metricValue || '99%'}
                  onChange={e => handleUpdateActiveSlide('metricValue', e.target.value)}
                  style={{ color: activeTheme.accent }}
                  className="text-7xl font-black tracking-tighter bg-transparent border-none focus:outline-none text-center w-full"
                />
                <input
                  type="text"
                  value={activeSlide.metricLabel || ''}
                  onChange={e => handleUpdateActiveSlide('metricLabel', e.target.value)}
                  className="text-xl font-medium opacity-90 bg-transparent border-none focus:outline-none text-center w-full"
                />
              </div>
            )}

            {activeSlide.layout === 'split' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={activeSlide.title}
                  onChange={e => handleUpdateActiveSlide('title', e.target.value)}
                  style={{ color: activeTheme.accent }}
                  className="text-3xl font-bold tracking-tight bg-transparent border-none focus:outline-none w-full mb-2"
                />
                <div className="grid grid-cols-2 gap-6">
                  <textarea
                    value={activeSlide.leftContent || ''}
                    onChange={e => handleUpdateActiveSlide('leftContent', e.target.value)}
                    placeholder="Left Column Content..."
                    className="p-3 rounded bg-white/5 border border-white/10 text-xs focus:outline-none resize-none h-40 leading-relaxed"
                  />
                  <textarea
                    value={activeSlide.rightContent || ''}
                    onChange={e => handleUpdateActiveSlide('rightContent', e.target.value)}
                    placeholder="Right Column Content..."
                    className="p-3 rounded bg-white/5 border border-white/10 text-xs focus:outline-none resize-none h-40 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {activeSlide.layout === 'quote' && (
              <div className="text-center max-w-xl mx-auto space-y-4">
                <span className="text-5xl opacity-40 font-serif">“</span>
                <textarea
                  value={activeSlide.title}
                  onChange={e => handleUpdateActiveSlide('title', e.target.value)}
                  className="text-2xl font-serif italic text-center bg-transparent border-none focus:outline-none w-full resize-none leading-relaxed"
                />
                <input
                  type="text"
                  value={activeSlide.subtitle || ''}
                  onChange={e => handleUpdateActiveSlide('subtitle', e.target.value)}
                  style={{ color: activeTheme.accent }}
                  className="text-sm font-mono tracking-wider uppercase text-center bg-transparent border-none focus:outline-none w-full"
                />
              </div>
            )}
          </div>

          {/* Footer Speaker Notes hint */}
          <div className="border-t border-white/10 pt-2 flex justify-between items-center text-[10px] opacity-40 font-mono">
            <span>Speaker Notes: {activeSlide.speakerNotes || 'None'}</span>
            <span>16:9 Landscape</span>
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className={`p-2 border-t flex gap-2 overflow-x-auto custom-scrollbar select-none shrink-0 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#101014] border-outline/10'
      }`}>
        {deckState.slides.map((s, idx) => {
          const isSelected = idx === activeSlideIndex;
          return (
            <div
              key={s.id}
              onClick={() => setActiveSlideIndex(idx)}
              className={`w-28 h-16 rounded border p-1.5 flex flex-col justify-between cursor-pointer transition-all shrink-0 ${
                isSelected
                  ? 'border-[#00dbe7] bg-[#00dbe7]/10 shadow-[0_0_8px_rgba(0,219,231,0.2)]'
                  : isLight
                    ? 'border-slate-300 bg-white hover:border-slate-400 text-slate-800'
                    : 'border-outline/15 bg-surface-container-low hover:border-outline/30 text-white'
              }`}
            >
              <div className={`flex justify-between items-center text-[8px] font-mono ${
                isLight ? 'text-slate-500' : 'text-on-surface-variant'
              }`}>
                <span>#{idx + 1}</span>
                <span className="uppercase">{s.layout}</span>
              </div>
              <span className={`text-[9px] font-semibold truncate block ${
                isLight ? 'text-slate-800' : 'text-on-surface'
              }`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Presenter Mode Overlay */}
      {isPresenterMode && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 select-none">
          <button
            onClick={() => setIsPresenterMode(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Exit Presentation (Esc)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          <div 
            style={{ backgroundColor: activeTheme.bg, color: activeTheme.text }}
            className="w-[90vw] max-w-[1200px] h-[70vh] rounded-2xl p-16 shadow-2xl flex flex-col justify-between border border-white/10"
          >
            <div className="flex justify-between items-center font-mono text-xs opacity-50">
              <span>SUTHARLABS PRESENTATION</span>
              <span>{activeSlideIndex + 1} / {deckState.slides.length}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center my-6">
              {activeSlide.layout === 'title' && (
                <div className="text-center space-y-4">
                  <h1 style={{ color: activeTheme.accent }} className="text-5xl font-black tracking-tight">
                    {activeSlide.title}
                  </h1>
                  <p className="text-2xl opacity-80">{activeSlide.subtitle}</p>
                </div>
              )}
              {activeSlide.layout === 'bullets' && (
                <div className="space-y-6">
                  <h2 style={{ color: activeTheme.accent }} className="text-4xl font-bold">
                    {activeSlide.title}
                  </h2>
                  <ul className="space-y-3 text-xl opacity-90 list-disc pl-6">
                    {(activeSlide.bulletPoints || []).map((bp, i) => (
                      <li key={i}>{bp}</li>
                    ))}
                  </ul>
                </div>
              )}
              {activeSlide.layout === 'metric' && (
                <div className="text-center space-y-4">
                  <div style={{ color: activeTheme.accent }} className="text-9xl font-black">
                    {activeSlide.metricValue}
                  </div>
                  <div className="text-3xl font-medium opacity-90">{activeSlide.metricLabel}</div>
                </div>
              )}
              {activeSlide.layout === 'split' && (
                <div className="space-y-6">
                  <h2 style={{ color: activeTheme.accent }} className="text-4xl font-bold">
                    {activeSlide.title}
                  </h2>
                  <div className="grid grid-cols-2 gap-8 text-lg opacity-90 whitespace-pre-wrap">
                    <div className="p-4 rounded bg-white/5">{activeSlide.leftContent}</div>
                    <div className="p-4 rounded bg-white/5">{activeSlide.rightContent}</div>
                  </div>
                </div>
              )}
              {activeSlide.layout === 'quote' && (
                <div className="text-center max-w-2xl mx-auto space-y-4">
                  <span className="text-7xl opacity-40 font-serif">“</span>
                  <div className="text-4xl font-serif italic leading-relaxed">{activeSlide.title}</div>
                  <div style={{ color: activeTheme.accent }} className="text-lg font-mono uppercase tracking-widest">{activeSlide.subtitle}</div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs opacity-40 font-mono">
              <span>Use Left / Right Arrows to Navigate • Esc to Exit</span>
              <span>16:9 Ultra HD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
