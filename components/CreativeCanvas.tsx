import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GeneratedCreative, Ratio, TextLayer } from '../types';
import { renderAdToCanvas, RATIO_DIMENSIONS, exportCanvasToBlob } from '../services/compositor';
import { Download, Eye, Sparkles, Move, RotateCcw, Lock, Check } from 'lucide-react';

interface CreativeCanvasProps {
  creative: GeneratedCreative;
  selectedRatio: Ratio;
  onChangeRatio: (ratio: Ratio) => void;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayers?: (layers: TextLayer[]) => void;
  onOpenMcpBridge: () => void;
  onRegenerateBase?: () => void;
}

export const CreativeCanvas: React.FC<CreativeCanvasProps> = ({
  creative,
  selectedRatio,
  onChangeRatio,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayers,
  onOpenMcpBridge,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showSafeZoneGuide, setShowSafeZoneGuide] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [touchFeedback, setTouchFeedback] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load and render base image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = creative.base64;
    img.onload = () => {
      imgRef.current = img;
      if (canvasRef.current) {
        renderAdToCanvas(
          canvasRef.current,
          img,
          creative.layers,
          selectedRatio,
          creative.masterRatio
        );
      }
    };
  }, [creative.base64, creative.layers, selectedRatio, creative.masterRatio]);

  // Re-render when layers update or ratio changes
  useEffect(() => {
    if (canvasRef.current && imgRef.current) {
      renderAdToCanvas(
        canvasRef.current,
        imgRef.current,
        creative.layers,
        selectedRatio,
        creative.masterRatio
      );
    }
  }, [creative.layers, selectedRatio, creative.masterRatio]);

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const blob = await exportCanvasToBlob(canvasRef.current);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ratioSlug = selectedRatio.replace(':', 'x');
        a.download = `${creative.adName}_${ratioSlug}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const ratioInfo = RATIO_DIMENSIONS[selectedRatio];

  // Dragging / Moving Logic for Touch & Pointer
  const handlePointerDown = (e: React.PointerEvent, layerId: string) => {
    e.stopPropagation();
    const layer = creative.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setDraggedLayerId(layerId);
    onSelectLayer(layerId);
    setTouchFeedback(`Moving: ${layer.content.slice(0, 20)}...`);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !draggedLayerId || !containerRef.current || !onUpdateLayers) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Normalised coordinates [0..1]
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;

    // Clamp coordinates safely within margins
    const clampedX = Math.max(0.04, Math.min(0.96, Number(rawX.toFixed(3))));
    const clampedY = Math.max(0.04, Math.min(0.96, Number(rawY.toFixed(3))));

    const updated = creative.layers.map((l) => {
      if (l.id === draggedLayerId) {
        return { ...l, x: clampedX, y: clampedY };
      }
      return l;
    });

    onUpdateLayers(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe capture release
      }
      setIsDragging(false);
      setDraggedLayerId(null);
      setTimeout(() => setTouchFeedback(null), 1500);
    }
  };

  const handleResetPositions = () => {
    if (!onUpdateLayers) return;
    const defaults: Record<string, { x: number; y: number }> = {
      layer_logo: { x: 0.08, y: 0.07 },
      layer_brand_tag: { x: 0.62, y: 0.07 },
      layer_offer: { x: 0.64, y: 0.90 },
      layer_proof: { x: 0.08, y: 0.63 },
      layer_headline: { x: 0.08, y: 0.71 },
      layer_subhead: { x: 0.08, y: 0.81 },
      layer_cta: { x: 0.08, y: 0.90 },
    };

    const resetLayers = creative.layers.map((l) => {
      const def = defaults[l.id];
      if (def) {
        return { ...l, x: def.x, y: def.y };
      }
      return l;
    });

    onUpdateLayers(resetLayers);
    setTouchFeedback('Positions reset to DigiNerve default grid');
    setTimeout(() => setTouchFeedback(null), 2000);
  };

  const handleApplyLayoutPreset = (preset: 'standard' | 'story' | 'compact') => {
    if (!onUpdateLayers) return;
    let presetLayers = [...creative.layers];

    if (preset === 'story') {
      // Keep within middle band y: 0.22 to 0.60
      presetLayers = presetLayers.map((l) => {
        if (l.role === 'logo') return { ...l, x: 0.08, y: 0.16 };
        if (l.role === 'brandTag') return { ...l, x: 0.62, y: 0.16 };
        if (l.role === 'proofChip') return { ...l, x: 0.08, y: 0.36 };
        if (l.role === 'headline') return { ...l, x: 0.08, y: 0.44 };
        if (l.role === 'subhead') return { ...l, x: 0.08, y: 0.54 };
        if (l.role === 'cta') return { ...l, x: 0.08, y: 0.64 };
        if (l.role === 'offerBadge') return { ...l, x: 0.64, y: 0.64 };
        return l;
      });
      setTouchFeedback('Story Safe Band Applied (y: 0.16 - 0.64)');
    } else if (preset === 'compact') {
      presetLayers = presetLayers.map((l) => {
        if (l.role === 'logo') return { ...l, x: 0.08, y: 0.06 };
        if (l.role === 'brandTag') return { ...l, x: 0.62, y: 0.06 };
        if (l.role === 'proofChip') return { ...l, x: 0.08, y: 0.68 };
        if (l.role === 'headline') return { ...l, x: 0.08, y: 0.75 };
        if (l.role === 'subhead') return { ...l, x: 0.08, y: 0.83 };
        if (l.role === 'cta') return { ...l, x: 0.08, y: 0.91 };
        if (l.role === 'offerBadge') return { ...l, x: 0.64, y: 0.91 };
        return l;
      });
      setTouchFeedback('Compact Lower-Third Grid Applied');
    } else {
      handleResetPositions();
      return;
    }

    onUpdateLayers(presetLayers);
    setTimeout(() => setTouchFeedback(null), 2000);
  };

  return (
    <div className="flex flex-col items-center space-y-4 bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-2xl relative select-none">
      {/* Top Toolbar: Ratio Switcher & Guide Toggles */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4">
        {/* Ratios Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-lg border border-gray-800">
          {(['4:5', '1:1', '9:16'] as Ratio[]).map((r) => {
            const isSelected = selectedRatio === r;
            return (
              <button
                key={r}
                onClick={() => onChangeRatio(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  isSelected
                    ? 'bg-dn-navy text-dn-gold border border-dn-gold/40 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {r} {r === '4:5' ? '(Feed)' : r === '1:1' ? '(Square)' : '(Story)'}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSafeZoneGuide(!showSafeZoneGuide)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 transition ${
              showSafeZoneGuide
                ? 'bg-blue-950/60 border-blue-600 text-blue-300'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
            title="Toggle safe zone / copy zone guidelines"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Safe Zone</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
            <span className="text-gray-400 text-[10px] px-1 font-mono">Layout:</span>
            <button
              onClick={() => handleApplyLayoutPreset('standard')}
              className="px-2 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white text-[11px]"
              title="Standard DigiNerve Stack"
            >
              Standard
            </button>
            <button
              onClick={() => handleApplyLayoutPreset('story')}
              className="px-2 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white text-[11px]"
              title="Story Middle Band"
            >
              Story Safe
            </button>
            <button
              onClick={() => handleApplyLayoutPreset('compact')}
              className="px-2 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white text-[11px]"
              title="Compact Lower-Third"
            >
              Compact
            </button>
          </div>

          <button
            onClick={handleResetPositions}
            className="px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg flex items-center gap-1.5 transition"
            title="Reset text and button layers to default positions"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={onOpenMcpBridge}
            className="px-3 py-1.5 text-xs bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-600/60 rounded-lg flex items-center gap-1.5 transition shadow-sm"
            title="Open direct OpenArt MCP Server bridge"
          >
            <Sparkles className="w-3.5 h-3.5 text-dn-gold" />
            <span>OpenArt MCP</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-4 py-1.5 text-xs font-bold bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep rounded-lg flex items-center gap-1.5 shadow transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Touch Screen Drag Hint Banner */}
      <div className="w-full flex items-center justify-between text-xs px-2 py-1.5 bg-gray-950/60 border border-gray-800/80 rounded-lg text-gray-300">
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-dn-gold animate-pulse" />
          <span>Touch & drag any button or text box directly on the screen to reposition it</span>
        </div>
        {touchFeedback ? (
          <span className="text-[11px] text-dn-gold font-mono font-bold animate-pulse">{touchFeedback}</span>
        ) : (
          <span className="text-[11px] text-gray-500 font-mono">Precision Grid: Active</span>
        )}
      </div>

      {/* Canvas Viewport Container with Touch/Mouse Interaction Layer */}
      <div className="relative flex items-center justify-center p-4 bg-gray-950/80 rounded-xl border border-gray-800/80 max-w-full overflow-hidden touch-none">
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative shadow-2xl rounded-md overflow-hidden bg-black transition-all cursor-crosshair"
          style={{
            width: '360px',
            maxWidth: '100%',
            aspectRatio: `${ratioInfo.width} / ${ratioInfo.height}`,
          }}
        >
          {/* Native HTML5 Canvas Renderer */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block pointer-events-none"
          />

          {/* Interactive Drag Handles for Every Button & Text Element */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {creative.layers.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              const isBeingDragged = draggedLayerId === layer.id;

              // Transform normalized coordinates (0..1) to percentage positioning
              const leftPct = `${layer.x * 100}%`;
              const topPct = `${layer.y * 100}%`;

              return (
                <div
                  key={layer.id}
                  id={`handle_${layer.id}`}
                  onPointerDown={(e) => handlePointerDown(e, layer.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLayer(layer.id);
                  }}
                  className={`absolute pointer-events-auto cursor-move select-none touch-none transition-shadow rounded-lg p-1.5 flex items-center gap-1.5 ${
                    isBeingDragged
                      ? 'ring-2 ring-dn-gold bg-black/60 shadow-2xl scale-105 z-40'
                      : isSelected
                      ? 'ring-2 ring-blue-400 bg-blue-950/40 shadow-lg z-30'
                      : 'hover:ring-1 hover:ring-white/50 hover:bg-black/30 z-10'
                  }`}
                  style={{
                    left: leftPct,
                    top: topPct,
                    maxWidth: `${layer.maxWidthPct}%`,
                    transform:
                      layer.align === 'center'
                        ? 'translate(-50%, -50%)'
                        : layer.align === 'right'
                        ? 'translate(-100%, 0)'
                        : 'translate(0, 0)',
                  }}
                  title={
                    layer.locked
                      ? 'Brand locked element (logo)'
                      : `Touch & Drag to reposition ${layer.role} (Currently x: ${(layer.x * 100).toFixed(0)}%, y: ${(layer.y * 100).toFixed(0)}%)`
                  }
                >
                  {/* Visual Drag Grip Pill */}
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-md ${
                      isBeingDragged
                        ? 'bg-dn-gold text-dn-navy-deep'
                        : isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-black/70 text-gray-200 border border-white/20'
                    }`}
                  >
                    {layer.locked ? (
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                    ) : (
                      <Move className="w-2.5 h-2.5" />
                    )}
                    <span className="uppercase text-[9px]">
                      {layer.role === 'cta' ? 'CTA BUTTON' : layer.role === 'offerBadge' ? 'BADGE' : layer.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Safe Zone Visual Overlay */}
          {showSafeZoneGuide && (
            <div className="absolute inset-0 pointer-events-none border border-dashed border-blue-400/40 z-10">
              {selectedRatio === '9:16' ? (
                <>
                  {/* Top 14% UI chrome reserve */}
                  <div className="absolute top-0 left-0 right-0 h-[14%] bg-red-500/10 border-b border-red-400/40 flex items-center justify-center">
                    <span className="text-[9px] text-red-200 uppercase font-mono tracking-widest bg-black/40 px-1 rounded">
                      Top Chrome Reserve (14%)
                    </span>
                  </div>
                  {/* Quiet copy zone y 0.20 to 0.62 */}
                  <div className="absolute top-[20%] left-0 right-0 h-[42%] border-y border-blue-400/40 bg-blue-500/5 flex items-center justify-center">
                    <span className="text-[9px] text-blue-200 uppercase font-mono tracking-widest bg-black/40 px-1 rounded">
                      Quiet Copy Zone
                    </span>
                  </div>
                  {/* Bottom 20% UI chrome reserve */}
                  <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-red-500/10 border-t border-red-400/40 flex items-center justify-center">
                    <span className="text-[9px] text-red-200 uppercase font-mono tracking-widest bg-black/40 px-1 rounded">
                      Bottom Chrome Reserve (20%)
                    </span>
                  </div>
                </>
              ) : (
                /* 4:5 and 1:1 Lower 38% Copy Zone */
                <div className="absolute bottom-0 left-0 right-0 h-[38%] border-t border-blue-400/50 bg-blue-500/10 flex items-start justify-center pt-1">
                  <span className="text-[9px] text-blue-200 uppercase font-mono tracking-widest bg-black/40 px-1.5 py-0.5 rounded">
                    Copy Zone (Lower 38%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Canvas Footnote details */}
      <div className="w-full flex items-center justify-between text-[11px] text-gray-400 px-1">
        <span className="font-mono">
          Dimensions: {ratioInfo.width} × {ratioInfo.height} px ({selectedRatio})
        </span>
        <span className="text-gray-300 font-mono truncate max-w-xs">{creative.adName}</span>
      </div>
    </div>
  );
};

export default CreativeCanvas;
