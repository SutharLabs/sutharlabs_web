import React from 'react';
import { ExternalLink, Lock, CheckCircle2 } from 'lucide-react';
import { PortfolioProject } from './LandingPage';

interface ProjectBrowserMockupProps {
  project: {
    id: string;
    title: string;
    segment: string;
    description?: string;
    imageSrc: string;
    stat?: string;
    liveUrl?: string;
    detailedCase?: string;
  };
  aspectRatio?: 'video' | 'card' | 'tall' | 'modal';
  showLiveButton?: boolean;
  className?: string;
  onOpenModal?: () => void;
}

export const getProjectLiveUrl = (project: {
  liveUrl?: string;
  detailedCase?: string;
  stat?: string;
  id?: string;
  title?: string;
}): string | null => {
  if (project.liveUrl) return project.liveUrl;
  if (project.detailedCase) {
    const match = project.detailedCase.match(/https?:\/\/[^\s)]+/);
    if (match) return match[0];
  }
  if (project.stat) {
    if (project.stat.includes('.in') || project.stat.includes('.org') || project.stat.includes('.com')) {
      const clean = project.stat.replace(/^Live at\s+/i, '').trim();
      return clean.startsWith('http') ? clean : `https://${clean}`;
    }
  }
  if (project.id === 'proj_4' || (project.title && project.title.includes('Sovereign Engine'))) {
    return '/workspace/stock-tracker';
  }
  return null;
};

export const getDisplayDomain = (url: string | null): string => {
  if (!url) return 'sutharlabs.com/case-study';
  if (url.startsWith('/')) return `sutharlabs.com${url}`;
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return url.replace(/^https?:\/\//, '');
  }
};

export default function ProjectBrowserMockup({
  project,
  aspectRatio = 'card',
  showLiveButton = true,
  className = '',
  onOpenModal
}: ProjectBrowserMockupProps) {
  const liveUrl = getProjectLiveUrl(project);
  const displayDomain = getDisplayDomain(liveUrl);
  const isInternal = liveUrl?.startsWith('/');

  const aspectClass = {
    video: 'aspect-video md:h-72',
    card: 'aspect-[16/10] h-48 sm:h-56',
    tall: 'h-64 sm:h-80',
    modal: 'aspect-[16/10] w-full min-h-[300px] sm:min-h-[400px] max-h-[560px]'
  }[aspectRatio];

  return (
    <div 
      className={`rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-[#0c0c0e] shadow-lg transition-all duration-300 group ${className}`}
    >
      {/* Realistic Browser Window Bar */}
      <div className="px-3 py-2 bg-slate-200/80 dark:bg-[#18181c] border-b border-slate-300/70 dark:border-white/10 flex items-center justify-between gap-2 select-none">
        
        {/* macOS Traffic Light Dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-xs"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-xs"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-xs"></div>
        </div>

        {/* Minimalist Address Bar */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-auto px-2.5 py-1 rounded-md bg-white/90 dark:bg-black/40 border border-slate-300/80 dark:border-white/10 flex items-center justify-between gap-1.5 font-mono text-[10px] text-slate-600 dark:text-[#b9cacb] shadow-inner truncate">
          <div className="flex items-center gap-1.5 truncate">
            <Lock className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
            <span className="truncate">{displayDomain}</span>
          </div>
          <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-[#00e476] font-bold shrink-0 hidden sm:inline">
            HTTPS
          </span>
        </div>

        {/* Live Website Link / Action */}
        <div className="flex items-center gap-1 shrink-0">
          {liveUrl && showLiveButton && (
            <a
              href={liveUrl}
              target={isInternal ? '_self' : '_blank'}
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-[#00e476] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
              title={`Open ${displayDomain} in new tab`}
            >
              <span>Visit</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Screen Viewport with live high-res screenshot */}
      <div 
        className={`w-full relative overflow-hidden bg-slate-900 ${aspectClass}`}
        onClick={onOpenModal}
      >
        <img
          src={project.imageSrc}
          alt={project.title}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* Subtle bottom gradient to highlight metadata badge */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Verified Live Badge in bottom-left */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-emerald-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Verified Production Website</span>
        </div>

        {/* Segment pill in top-right */}
        <div className="absolute top-2.5 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-cyan-300 font-bold uppercase">
          {project.segment}
        </div>
      </div>
    </div>
  );
}
