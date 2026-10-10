import React, { useState } from 'react';
import { BUILT_IN_TEMPLATES } from '../templates.js';
import { DocTemplate, DocumentFormat } from '../types.js';
import { 
  X, 
  Sparkles, 
  Shapes, 
  FileText, 
  Layout, 
  Table, 
  Presentation,
  Check
} from 'lucide-react';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DocTemplate) => void;
  theme?: 'dark' | 'light';
}

const FORMAT_ICONS: Record<DocumentFormat, any> = {
  canvas: Shapes,
  markdown: FileText,
  richtext: Layout,
  sheet: Table,
  slides: Presentation
};

export default function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelectTemplate,
  theme = 'dark'
}: TemplateLibraryModalProps) {
  if (!isOpen) return null;
  const isLight = theme === 'light';
  const [selectedFormat, setSelectedFormat] = useState<'ALL' | DocumentFormat>('ALL');

  const filteredTemplates = BUILT_IN_TEMPLATES.filter(tpl =>
    selectedFormat === 'ALL' || tpl.format === selectedFormat
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f0f13] border-outline/25 text-white'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200' : 'border-outline/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-[#00dbe7]/15 text-[#74f5ff]'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>SutharLabs Template Library</h2>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                Production-ready blueprints across Visual Canvas, Markdown, Executive Docs, Sheets &amp; Slides.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${
              isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800' : 'hover:bg-white/10 text-on-surface-variant hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Filter Bar */}
        <div className={`px-5 py-3 border-b flex gap-2 overflow-x-auto scrollbar-hide ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-outline/10'
        }`}>
          {(['ALL', 'canvas', 'markdown', 'richtext', 'sheet', 'slides'] as const).map(fmt => {
            const isSelected = selectedFormat === fmt;
            return (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/40'
                    : isLight
                      ? 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-white'
                }`}
              >
                {fmt === 'ALL' ? 'All Formats' : fmt.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
          {filteredTemplates.map(tpl => {
            const IconComp = FORMAT_ICONS[tpl.format] || FileText;

            return (
              <div
                key={tpl.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between group ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 hover:border-indigo-400' 
                    : 'bg-surface-container-low/40 border-outline/15 hover:border-[#00dbe7]/50 hover:bg-white/[0.02]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`p-2 rounded-lg ${
                      isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-white/5 text-[#74f5ff]'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase border ${
                      isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-black/40 text-on-surface-variant border-white/5'
                    }`}>
                      {tpl.category}
                    </span>
                  </div>

                  <div>
                    <h3 className={`font-bold text-sm transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-indigo-600' : 'text-on-surface group-hover:text-[#00dbe7]'
                    }`}>
                      {tpl.name}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-on-surface-variant'
                    }`}>
                      {tpl.description}
                    </p>
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                  isLight ? 'border-slate-200' : 'border-outline/10'
                }`}>
                  <span className={`font-mono text-[10px] capitalize ${
                    isLight ? 'text-slate-500' : 'text-on-surface-variant'
                  }`}>
                    {tpl.format} Format
                  </span>
                  <button
                    onClick={() => {
                      onSelectTemplate(tpl);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                      isLight 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs' 
                        : 'bg-[#00dbe7]/20 text-[#74f5ff] hover:bg-[#00dbe7]/30 border border-[#00dbe7]/30'
                    }`}
                  >
                    Use Blueprint
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
