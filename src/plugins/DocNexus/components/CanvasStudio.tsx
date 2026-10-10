import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, CanvasSceneState, CanvasShapeType } from '../types.js';
import { 
  Square, 
  Circle as CircleIcon, 
  Diamond, 
  Type, 
  StickyNote, 
  MoveRight, 
  Tag, 
  Trash2, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Layers,
  Palette,
  MousePointer,
  Grid
} from 'lucide-react';

interface CanvasStudioProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  theme?: 'dark' | 'light';
  selectedElementId: string | null;
  onSelectElement: (element: CanvasElement | null) => void;
}

const DEFAULT_SCENE: CanvasSceneState = {
  width: 1000,
  height: 650,
  backgroundColor: '#0d0d11',
  gridSnap: true,
  aspectRatio: '16:9',
  elements: []
};

const COLOR_PRESETS = [
  { fill: '#142c22', stroke: '#00e476', text: '#00e476', label: 'Emerald' },
  { fill: '#132338', stroke: '#00dbe7', text: '#74f5ff', label: 'Cyan' },
  { fill: '#211633', stroke: '#ce5dff', text: '#ebb2ff', label: 'Purple' },
  { fill: '#2e1215', stroke: '#ffb4ab', text: '#ffb4ab', label: 'Rose' },
  { fill: '#2c2813', stroke: '#ffd700', text: '#fff280', label: 'Amber' },
  { fill: '#18181c', stroke: '#849495', text: '#e5e1e4', label: 'Slate' }
];

export default function CanvasStudio({
  content,
  onChangeContent,
  theme = 'dark',
  selectedElementId,
  onSelectElement
}: CanvasStudioProps) {
  const isLight = theme === 'light';
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Parse scene state
  const scene: CanvasSceneState = React.useMemo(() => {
    try {
      if (!content) return DEFAULT_SCENE;
      const parsed = JSON.parse(content);
      return { ...DEFAULT_SCENE, ...parsed };
    } catch {
      return DEFAULT_SCENE;
    }
  }, [content]);

  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const selectedElement = scene.elements.find(el => el.id === selectedElementId) || null;

  // Sync selected element to parent inspector
  useEffect(() => {
    onSelectElement(selectedElement);
  }, [selectedElementId, scene.elements]);

  const updateElements = (newElements: CanvasElement[]) => {
    const updatedScene: CanvasSceneState = {
      ...scene,
      elements: newElements
    };
    onChangeContent(JSON.stringify(updatedScene));
  };

  const handleAddElement = (type: CanvasShapeType) => {
    const newId = `el_${Date.now().toString(36)}`;
    const centerX = 400 + Math.floor(Math.random() * 40);
    const centerY = 250 + Math.floor(Math.random() * 40);

    const defaultColors = isLight 
      ? { fill: '#f1f5f9', stroke: '#64748b', textColor: '#0f172a' }
      : { fill: '#18181c', stroke: '#00dbe7', textColor: '#ffffff' };

    let newEl: CanvasElement;

    switch (type) {
      case 'circle':
        newEl = {
          id: newId,
          type: 'circle',
          x: centerX,
          y: centerY,
          width: 90,
          height: 90,
          zIndex: scene.elements.length + 1,
          text: 'Node',
          ...defaultColors,
          strokeWidth: 2,
          fontSize: 12
        };
        break;
      case 'sticky':
        newEl = {
          id: newId,
          type: 'sticky',
          x: centerX,
          y: centerY,
          width: 180,
          height: 120,
          zIndex: scene.elements.length + 1,
          text: 'Design Note:\nAdd details here...',
          fill: isLight ? '#fef9c3' : '#2c2813',
          stroke: isLight ? '#eab308' : '#ffd700',
          textColor: isLight ? '#713f12' : '#fff280',
          strokeWidth: 1,
          fontSize: 12,
          shadow: true
        };
        break;
      case 'arrow':
        newEl = {
          id: newId,
          type: 'arrow',
          x: centerX,
          y: centerY,
          width: 120,
          height: 2,
          zIndex: scene.elements.length + 1,
          text: 'Flow',
          stroke: isLight ? '#0284c7' : '#00dbe7',
          strokeWidth: 2,
          fontSize: 10
        };
        break;
      case 'text':
        newEl = {
          id: newId,
          type: 'text',
          x: centerX,
          y: centerY,
          width: 200,
          height: 40,
          zIndex: scene.elements.length + 1,
          text: 'Heading Text',
          textColor: isLight ? '#0f172a' : '#ffffff',
          fontSize: 20
        };
        break;
      case 'badge':
        newEl = {
          id: newId,
          type: 'badge',
          x: centerX,
          y: centerY,
          width: 120,
          height: 36,
          zIndex: scene.elements.length + 1,
          text: 'ACTIVE STATUS',
          fill: isLight ? '#e0f2fe' : '#132338',
          stroke: isLight ? '#0284c7' : '#00dbe7',
          textColor: isLight ? '#0369a1' : '#74f5ff',
          strokeWidth: 1.5,
          fontSize: 10,
          borderRadius: 18
        };
        break;
      default: // rect & card
        newEl = {
          id: newId,
          type: 'rect',
          x: centerX,
          y: centerY,
          width: 160,
          height: 90,
          zIndex: scene.elements.length + 1,
          text: 'Component Box',
          ...defaultColors,
          strokeWidth: 1.5,
          borderRadius: 8,
          fontSize: 12,
          shadow: true
        };
        break;
    }

    const nextElements = [...scene.elements, newEl];
    updateElements(nextElements);
    onSelectElement(newEl);
  };

  const handlePointerDown = (e: React.PointerEvent, element: CanvasElement) => {
    e.stopPropagation();
    onSelectElement(element);
    setIsDragging(true);

    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    setDragOffset({
      x: cursorPt.x - element.x,
      y: cursorPt.y - element.y
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedElement) return;

    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    let newX = cursorPt.x - dragOffset.x;
    let newY = cursorPt.y - dragOffset.y;

    if (scene.gridSnap) {
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;
    }

    const updated = scene.elements.map(el =>
      el.id === selectedElement.id ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) } : el
    );
    updateElements(updated);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    updateElements(scene.elements.filter(el => el.id !== selectedElementId));
    onSelectElement(null);
  };

  const handleDuplicateSelected = () => {
    if (!selectedElement) return;
    const duplicate: CanvasElement = {
      ...selectedElement,
      id: `el_${Date.now().toString(36)}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      zIndex: scene.elements.length + 1
    };
    updateElements([...scene.elements, duplicate]);
    onSelectElement(duplicate);
  };

  const handleApplyPresetColor = (preset: typeof COLOR_PRESETS[0]) => {
    if (!selectedElementId) return;
    const updated = scene.elements.map(el =>
      el.id === selectedElementId
        ? { ...el, fill: preset.fill, stroke: preset.stroke, textColor: preset.text }
        : el
    );
    updateElements(updated);
  };

  const handleBringForward = () => {
    if (!selectedElement) return;
    const updated = scene.elements.map(el =>
      el.id === selectedElement.id ? { ...el, zIndex: el.zIndex + 1 } : el
    );
    updateElements(updated);
  };

  const handleSendBackward = () => {
    if (!selectedElement) return;
    const updated = scene.elements.map(el =>
      el.id === selectedElement.id ? { ...el, zIndex: Math.max(0, el.zIndex - 1) } : el
    );
    updateElements(updated);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none relative">
      {/* Floating Dynamic Island Creation Toolbar (Figma & Miro Standard) */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 backdrop-blur-2xl border rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-[0_16px_45px_rgba(0,0,0,0.35)] transition-all ${
        isLight 
          ? 'bg-white/95 border-slate-200/90 text-slate-800' 
          : 'bg-[#12131c]/95 border-white/10 text-white'
      }`}>
        {/* Tool: Select Pointer */}
        <button
          onClick={() => onSelectElement(null)}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            !selectedElement 
              ? isLight ? 'bg-indigo-50 text-indigo-600 shadow-xs' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/[0.08] text-slate-400 hover:text-white'
          }`}
          title="Select Tool (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <div className={`w-px h-5 mx-0.5 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

        {/* Primary Vector Creators */}
        <button
          onClick={() => handleAddElement('rect')}
          className={`p-2 rounded-xl cursor-pointer transition-all ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Add Rectangle / Card (R)"
        >
          <Square className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          onClick={() => handleAddElement('circle')}
          className={`p-2 rounded-xl cursor-pointer transition-all ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Add Circle Node (O)"
        >
          <CircleIcon className="w-4 h-4 text-purple-400" />
        </button>
        <button
          onClick={() => handleAddElement('diamond')}
          className={`p-2 rounded-xl cursor-pointer transition-all ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Add Decision Diamond (D)"
        >
          <Diamond className="w-4 h-4 text-emerald-400" />
        </button>
        <button
          onClick={() => handleAddElement('text')}
          className={`p-2 rounded-xl cursor-pointer transition-all ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Add Text Block (T)"
        >
          <Type className="w-4 h-4 text-indigo-400 dark:text-cyan-200" />
        </button>
        <button
          onClick={() => handleAddElement('sticky')}
          className={`p-2 rounded-xl cursor-pointer transition-all ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Add Sticky Note (S)"
        >
          <StickyNote className="w-4 h-4 text-amber-400" />
        </button>
        <button
          onClick={() => handleAddElement('arrow')}
          className={`p-2 rounded-xl cursor-pointer transition-all ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Add Connector Flow (A)"
        >
          <MoveRight className="w-4 h-4 text-rose-400" />
        </button>
        <button
          onClick={() => handleAddElement('badge')}
          className={`p-2 rounded-xl cursor-pointer transition-all ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Add Status Badge (B)"
        >
          <Tag className="w-4 h-4 text-sky-400" />
        </button>

        {/* Selected Element Quick Operations Bar */}
        {selectedElement && (
          <>
            <div className={`w-px h-5 mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
            
            {/* Swatch color presets */}
            <div className="flex items-center gap-1.5 px-1">
              {COLOR_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPresetColor(p)}
                  style={{ backgroundColor: p.stroke }}
                  className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer shadow-xs"
                  title={p.label}
                />
              ))}
            </div>

            <div className={`w-px h-5 mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

            <button
              onClick={handleBringForward}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Bring Forward"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={handleDuplicateSelected}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Duplicate (Cmd+D)"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteSelected}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Delete (Backspace)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Floating Canvas Control HUD (Bottom-Right) */}
      <div className={`absolute bottom-6 right-6 z-30 backdrop-blur-2xl border rounded-2xl p-1.5 flex items-center gap-1 shadow-[0_12px_36px_rgba(0,0,0,0.35)] font-sans text-xs transition-all ${
        isLight 
          ? 'bg-white/95 border-slate-200/90 text-slate-800' 
          : 'bg-[#12131c]/95 border-white/10 text-white'
      }`}>
        <button
          onClick={() => setZoom(prev => Math.max(0.4, Number((prev - 0.1).toFixed(1))))}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-300'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className={`px-2 py-1 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-slate-200'
          }`}
          title="Click to reset zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom(prev => Math.min(2.5, Number((prev + 0.1).toFixed(1))))}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-300'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className={`w-px h-4 mx-0.5 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

        <button
          onClick={() => setZoom(1)}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-300'
          }`}
          title="Reset to 100%"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Interactive SVG Artboard Stage */}
      <div 
        className={`flex-1 overflow-auto p-12 flex items-center justify-center relative custom-scrollbar transition-colors ${
          isLight ? 'bg-slate-100' : 'bg-[#060608]'
        }`}
        onClick={() => onSelectElement(null)}
      >
        <div 
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className={`rounded-2xl border overflow-hidden relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] ${
            isLight ? 'border-slate-300/80 bg-white' : 'border-white/10 bg-[#0d0d12]'
          }`}
        >
          {/* Top Artboard Dimension Label */}
          <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-sans ${
            isLight ? 'border-slate-200/80 bg-slate-50/80 text-slate-500' : 'border-white/[0.06] bg-white/[0.02] text-slate-400'
          }`}>
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Edgeless Vector Canvas
            </span>
            <span className="font-mono text-[10px] opacity-75">1000 × 650 px • 16:9</span>
          </div>

          <svg
            ref={svgRef}
            width={scene.width}
            height={scene.height}
            viewBox={`0 0 ${scene.width} ${scene.height}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="block cursor-default select-none"
            style={{ backgroundColor: isLight ? '#f8fafc' : scene.backgroundColor }}
          >
            {/* Grid Dots Pattern */}
            <defs>
              <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill={isLight ? '#cbd5e1' : '#23232c'} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-grid)" />

            {/* Render Canvas Elements sorted by zIndex */}
            {[...scene.elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(el => {
                const isSelected = el.id === selectedElementId;

                return (
                  <g
                    key={el.id}
                    onPointerDown={e => handlePointerDown(e, el)}
                    className="cursor-move"
                  >
                    {/* Element Render Logic by Type */}
                    {el.type === 'rect' && (
                      <rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rx={el.borderRadius || 10}
                        fill={el.fill || '#1e1e24'}
                        stroke={isSelected ? '#00dbe7' : (el.stroke || '#3a494b')}
                        strokeWidth={isSelected ? 2.5 : (el.strokeWidth || 1.5)}
                        filter={el.shadow ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.35))' : undefined}
                      />
                    )}

                    {el.type === 'circle' && (
                      <circle
                        cx={el.x + el.width / 2}
                        cy={el.y + el.height / 2}
                        r={Math.min(el.width, el.height) / 2}
                        fill={el.fill || '#1e1e24'}
                        stroke={isSelected ? '#00dbe7' : (el.stroke || '#3a494b')}
                        strokeWidth={isSelected ? 2.5 : (el.strokeWidth || 1.5)}
                        filter="drop-shadow(0 6px 12px rgba(0,0,0,0.3))"
                      />
                    )}

                    {el.type === 'diamond' && (
                      <polygon
                        points={`${el.x + el.width / 2},${el.y} ${el.x + el.width},${el.y + el.height / 2} ${el.x + el.width / 2},${el.y + el.height} ${el.x},${el.y + el.height / 2}`}
                        fill={el.fill || '#1e1e24'}
                        stroke={isSelected ? '#00dbe7' : (el.stroke || '#3a494b')}
                        strokeWidth={isSelected ? 2.5 : (el.strokeWidth || 1.5)}
                        filter="drop-shadow(0 6px 12px rgba(0,0,0,0.3))"
                      />
                    )}

                    {el.type === 'sticky' && (
                      <g>
                        <rect
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          rx="4"
                          fill={el.fill || '#2c2813'}
                          stroke={isSelected ? '#00dbe7' : (el.stroke || '#ffd700')}
                          strokeWidth={isSelected ? 2 : 1}
                          filter="drop-shadow(3px 8px 14px rgba(0,0,0,0.45))"
                        />
                        {/* Tape effect on sticky note */}
                        <rect
                          x={el.x + el.width / 2 - 22}
                          y={el.y - 7}
                          width="44"
                          height="14"
                          rx="2"
                          fill="rgba(255,255,255,0.25)"
                          transform={`rotate(-2, ${el.x + el.width / 2}, ${el.y})`}
                        />
                      </g>
                    )}

                    {el.type === 'arrow' && (
                      <g>
                        <line
                          x1={el.x}
                          y1={el.y}
                          x2={el.x + el.width}
                          y2={el.y + el.height}
                          stroke={isSelected ? '#00dbe7' : (el.stroke || '#74f5ff')}
                          strokeWidth={el.strokeWidth || 2.5}
                          strokeDasharray={isSelected ? '5,5' : undefined}
                          strokeLinecap="round"
                        />
                        <polygon
                          points={`${el.x + el.width},${el.y + el.height} ${el.x + el.width - 10},${el.y + el.height - 6} ${el.x + el.width - 10},${el.y + el.height + 6}`}
                          fill={el.stroke || '#74f5ff'}
                        />
                      </g>
                    )}

                    {el.type === 'badge' && (
                      <rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rx={el.borderRadius || 18}
                        fill={el.fill || '#132338'}
                        stroke={isSelected ? '#00dbe7' : (el.stroke || '#00dbe7')}
                        strokeWidth={isSelected ? 2 : 1}
                        filter="drop-shadow(0 4px 10px rgba(0,0,0,0.25))"
                      />
                    )}

                    {/* Text Rendering with Multi-line Support */}
                    {el.text && (
                      <text
                        x={el.type === 'circle' ? el.x + el.width / 2 : el.x + (el.type === 'text' ? 5 : el.width / 2)}
                        y={el.type === 'circle' ? el.y + el.height / 2 + 4 : el.y + (el.type === 'text' ? el.fontSize || 14 : el.height / 2)}
                        textAnchor={el.type === 'text' ? 'start' : 'middle'}
                        fill={el.textColor || '#ffffff'}
                        fontSize={el.fontSize || 12}
                        fontFamily="Inter, system-ui, -apple-system, sans-serif"
                        fontWeight={el.type === 'text' ? '600' : '500'}
                        pointerEvents="none"
                      >
                        {el.text.split('\n').map((line, lIdx) => (
                          <tspan
                            key={lIdx}
                            x={el.type === 'circle' ? el.x + el.width / 2 : el.x + (el.type === 'text' ? 5 : el.width / 2)}
                            dy={lIdx === 0 ? 0 : 18}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    )}

                    {/* Active Selection Bounding Box & Figma-Style Handles */}
                    {isSelected && (
                      <g pointerEvents="none">
                        <rect
                          x={el.x - 4}
                          y={el.y - 4}
                          width={el.width + 8}
                          height={el.height + 8}
                          fill="none"
                          stroke="#00dbe7"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          rx="4"
                        />
                        {/* Figma Corner Handles */}
                        <circle cx={el.x - 4} cy={el.y - 4} r="3" fill="#ffffff" stroke="#00dbe7" strokeWidth="1.5" />
                        <circle cx={el.x + el.width + 4} cy={el.y - 4} r="3" fill="#ffffff" stroke="#00dbe7" strokeWidth="1.5" />
                        <circle cx={el.x - 4} cy={el.y + el.height + 4} r="3" fill="#ffffff" stroke="#00dbe7" strokeWidth="1.5" />
                        <circle cx={el.x + el.width + 4} cy={el.y + el.height + 4} r="3" fill="#ffffff" stroke="#00dbe7" strokeWidth="1.5" />
                      </g>
                    )}
                  </g>
                );
              })}
          </svg>
        </div>
      </div>
    </div>
  );
}
