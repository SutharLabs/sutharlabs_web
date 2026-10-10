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
      {/* Canvas Studio Ribbon Toolbar */}
      <div className={`p-2.5 border-b flex items-center justify-between gap-3 font-mono text-xs z-10 ${
        isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#141418]/90 border-outline/15 backdrop-blur-md'
      }`}>
        {/* Element Creators */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase mr-1">Shapes:</span>
          <button
            onClick={() => handleAddElement('rect')}
            className={`p-2 rounded cursor-pointer transition-colors border ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-white/10 border-outline/20'
            }`}
            title="Add Rectangle / Card"
          >
            <Square className="w-3.5 h-3.5 text-[#00dbe7]" />
          </button>
          <button
            onClick={() => handleAddElement('circle')}
            className={`p-2 rounded cursor-pointer transition-colors border ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-white/10 border-outline/20'
            }`}
            title="Add Circle Node"
          >
            <CircleIcon className="w-3.5 h-3.5 text-[#ce5dff]" />
          </button>
          <button
            onClick={() => handleAddElement('diamond')}
            className={`p-2 rounded cursor-pointer transition-colors border ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-white/10 border-outline/20'
            }`}
            title="Add Diamond Decision"
          >
            <Diamond className="w-3.5 h-3.5 text-[#00e476]" />
          </button>
          <button
            onClick={() => handleAddElement('text')}
            className={`p-2 rounded cursor-pointer transition-colors border ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-white/10 border-outline/20'
            }`}
            title="Add Text Block"
          >
            <Type className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => handleAddElement('sticky')}
            className={`p-2 rounded cursor-pointer transition-colors border ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-white/10 border-outline/20'
            }`}
            title="Add Sticky Note"
          >
            <StickyNote className="w-3.5 h-3.5 text-[#ffd700]" />
          </button>
          <button
            onClick={() => handleAddElement('arrow')}
            className={`p-2 rounded cursor-pointer transition-colors border ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-white/10 border-outline/20'
            }`}
            title="Add Arrow Flow"
          >
            <MoveRight className="w-3.5 h-3.5 text-[#ff7b72]" />
          </button>
          <button
            onClick={() => handleAddElement('badge')}
            className={`p-2 rounded cursor-pointer transition-colors border ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-white/10 border-outline/20'
            }`}
            title="Add Status Badge"
          >
            <Tag className="w-3.5 h-3.5 text-[#74f5ff]" />
          </button>
        </div>

        {/* Selected Element Quick Operations */}
        {selectedElement && (
          <div className="flex items-center gap-1.5 border-l border-r px-2 border-outline/20">
            <div className="flex gap-1">
              {COLOR_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPresetColor(p)}
                  style={{ backgroundColor: p.stroke }}
                  className="w-4 h-4 rounded-full border border-black/30 hover:scale-125 transition-transform"
                  title={p.label}
                />
              ))}
            </div>
            <div className="h-4 w-px bg-outline/20 mx-1"></div>
            <button
              onClick={handleBringForward}
              className="p-1 rounded hover:bg-white/10 text-on-surface-variant hover:text-white"
              title="Bring Forward"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDuplicateSelected}
              className="p-1 rounded hover:bg-white/10 text-on-surface-variant hover:text-white"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteSelected}
              className="p-1 rounded hover:bg-red-500/20 text-red-400"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Zoom & View Settings */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
            className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-on-surface w-10 text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}
            className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Center Interactive SVG Artboard */}
      <div 
        className={`flex-1 overflow-auto p-8 flex items-center justify-center relative custom-scrollbar ${isLight ? 'bg-slate-200/60' : 'bg-[#050507]'}`}
        onClick={() => onSelectElement(null)}
      >
        <div 
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out'
          }}
          className={`shadow-2xl rounded-xl border overflow-hidden relative ${isLight ? 'border-slate-300 bg-white shadow-xl' : 'border-outline/25 bg-[#0d0d11]'}`}
        >
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
              <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill={isLight ? '#cbd5e1' : '#26262b'} />
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
                        rx={el.borderRadius || 6}
                        fill={el.fill || '#1e1e24'}
                        stroke={isSelected ? '#00dbe7' : (el.stroke || '#3a494b')}
                        strokeWidth={isSelected ? 2.5 : (el.strokeWidth || 1.5)}
                        filter={el.shadow ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : undefined}
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
                      />
                    )}

                    {el.type === 'diamond' && (
                      <polygon
                        points={`${el.x + el.width / 2},${el.y} ${el.x + el.width},${el.y + el.height / 2} ${el.x + el.width / 2},${el.y + el.height} ${el.x},${el.y + el.height / 2}`}
                        fill={el.fill || '#1e1e24'}
                        stroke={isSelected ? '#00dbe7' : (el.stroke || '#3a494b')}
                        strokeWidth={isSelected ? 2.5 : (el.strokeWidth || 1.5)}
                      />
                    )}

                    {el.type === 'sticky' && (
                      <g>
                        <rect
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          fill={el.fill || '#2c2813'}
                          stroke={isSelected ? '#00dbe7' : (el.stroke || '#ffd700')}
                          strokeWidth={isSelected ? 2 : 1}
                          filter="drop-shadow(2px 6px 8px rgba(0,0,0,0.4))"
                        />
                        {/* Tape effect on sticky note */}
                        <rect
                          x={el.x + el.width / 2 - 20}
                          y={el.y - 6}
                          width="40"
                          height="12"
                          fill="rgba(255,255,255,0.2)"
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
                          strokeWidth={el.strokeWidth || 2}
                          strokeDasharray={isSelected ? '4,4' : undefined}
                        />
                        <polygon
                          points={`${el.x + el.width},${el.y + el.height} ${el.x + el.width - 8},${el.y + el.height - 5} ${el.x + el.width - 8},${el.y + el.height + 5}`}
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
                        fontFamily="monospace, sans-serif"
                        fontWeight={el.type === 'text' ? 'bold' : 'normal'}
                        pointerEvents="none"
                      >
                        {el.text.split('\n').map((line, lIdx) => (
                          <tspan
                            key={lIdx}
                            x={el.type === 'circle' ? el.x + el.width / 2 : el.x + (el.type === 'text' ? 5 : el.width / 2)}
                            dy={lIdx === 0 ? 0 : 16}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    )}

                    {/* Active Selection Bounding Box & Handles */}
                    {isSelected && (
                      <rect
                        x={el.x - 3}
                        y={el.y - 3}
                        width={el.width + 6}
                        height={el.height + 6}
                        fill="none"
                        stroke="#00dbe7"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        pointerEvents="none"
                      />
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
