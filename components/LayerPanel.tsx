import React from 'react';
import { TextLayer, BrandColorToken, CourseFacts } from '../types';
import { BRAND, BRAND_IDENTITY } from '../constants/brand';
import { OFFICIAL_BRAND_TAGS } from '../constants/dnCreativeStyling';
import {
  Type,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Move,
} from 'lucide-react';

interface LayerPanelProps {
  layers: TextLayer[];
  onChangeLayers: (updated: TextLayer[]) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  course?: CourseFacts;
}

const BRAND_TOKENS: BrandColorToken[] = ['navy', 'navyDeep', 'gold', 'tintLight', 'surface', 'success'];

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  onChangeLayers,
  selectedLayerId,
  onSelectLayer,
  course,
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || layers[0];

  const handleUpdateSelected = (patch: Partial<TextLayer>) => {
    if (!selectedLayer) return;
    onChangeLayers(layers.map((l) => (l.id === selectedLayer.id ? { ...l, ...patch } : l)));
  };

  const handleAddProofClaim = (claimText: string) => {
    const proofLayer = layers.find((l) => l.role === 'proofChip');
    if (proofLayer) {
      onChangeLayers(
        layers.map((l) => (l.id === proofLayer.id ? { ...l, content: claimText } : l))
      );
      onSelectLayer(proofLayer.id);
    }
  };

  const handleApplyOfficialBrandTag = (tag: typeof OFFICIAL_BRAND_TAGS[0]) => {
    const existingBrandTag = layers.find((l) => l.role === 'brandTag');
    if (existingBrandTag) {
      onChangeLayers(
        layers.map((l) =>
          l.id === existingBrandTag.id
            ? {
                ...l,
                content: `${tag.label} | ${tag.subtext}`,
                token: tag.textColor as BrandColorToken,
                bgToken: tag.bgToken as BrandColorToken,
              }
            : l
        )
      );
      onSelectLayer(existingBrandTag.id);
    } else {
      const newLayer: TextLayer = {
        id: `layer_brand_tag_${Date.now()}`,
        role: 'brandTag',
        content: `${tag.label} | ${tag.subtext}`,
        badgeStyle: 'official',
        token: tag.textColor as BrandColorToken,
        bgToken: tag.bgToken as BrandColorToken,
        fontSize: 12,
        fontWeight: 'bold',
        x: 0.62,
        y: 0.07,
        maxWidthPct: 35,
        align: 'right',
        locked: false,
      };
      onChangeLayers([...layers, newLayer]);
      onSelectLayer(newLayer.id);
    }
  };

  const handleAddNewLayer = (role: TextLayer['role']) => {
    const newId = `layer_${role}_${Date.now()}`;
    const newLayer: TextLayer = {
      id: newId,
      role,
      content: role === 'brandTag' ? 'A Jaypee Enterprise | 55+ Years Trust' : 'New Ad Layer',
      token: role === 'cta' ? 'surface' : 'navyDeep',
      bgToken: role === 'cta' ? 'navy' : role === 'brandTag' ? 'navyDeep' : 'transparent',
      fontSize: role === 'headline' ? 28 : role === 'subhead' ? 15 : 13,
      fontWeight: 'bold',
      x: 0.08,
      y: 0.5,
      maxWidthPct: 80,
      align: 'left',
      locked: false,
    };
    onChangeLayers([...layers, newLayer]);
    onSelectLayer(newId);
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const remaining = layers.filter((l) => l.id !== id);
    onChangeLayers(remaining);
    onSelectLayer(remaining[0]?.id || null);
  };

  return (
    <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-gray-700 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-dn-gold" />
          Text Layer Inspector & Brand Tags
        </h3>
        <span className="text-xs text-gray-400">Strict Brand Tokens</span>
      </div>

      {/* Layer Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400">Active Canvas Layers ({layers.length}):</span>
          <div className="flex items-center gap-1">
            {!layers.some((l) => l.role === 'brandTag') && (
              <button
                onClick={() => handleAddNewLayer('brandTag')}
                className="px-2 py-0.5 text-[10px] bg-dn-navy text-dn-gold rounded hover:bg-dn-navy/80 border border-dn-gold/40 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Brand Tag
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-gray-700/60">
          {layers.map((l) => {
            const isSelected = selectedLayer?.id === l.id;
            return (
              <button
                key={l.id}
                onClick={() => onSelectLayer(l.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-dn-navy text-dn-gold border-dn-gold/50 shadow-sm'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                {l.role === 'logo' && <span className="w-1.5 h-1.5 rounded-full bg-dn-gold" />}
                {l.role === 'brandTag' && <ShieldCheck className="w-3 h-3 text-dn-gold" />}
                <span>{l.role}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Layer Editor */}
      {selectedLayer && (
        <div className="space-y-4 text-xs">
          {/* Header with lock and delete */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-200 uppercase tracking-wider text-[10px]">
              Editing: {selectedLayer.role}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateSelected({ locked: !selectedLayer.locked })}
                className={`p-1 rounded ${selectedLayer.locked ? 'text-amber-400 bg-amber-950/40' : 'text-gray-400 hover:text-white'}`}
                title={selectedLayer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {selectedLayer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              {selectedLayer.role !== 'logo' && (
                <button
                  onClick={() => handleDeleteLayer(selectedLayer.id)}
                  className="p-1 text-gray-400 hover:text-red-400"
                  title="Remove Layer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Role-Specific Controls: Official DigiNerve Logo */}
          {selectedLayer.role === 'logo' && (
            <div className="p-3 bg-gray-900/90 border border-dn-gold/30 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-dn-gold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-dn-gold" />
                  Official DigiNerve Brand Logo
                </span>
                <span className="text-[10px] text-gray-400">Jaypee Enterprise</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Logo Presentation</label>
                  <select
                    value={selectedLayer.logoVariant || 'full'}
                    onChange={(e) => handleUpdateSelected({ logoVariant: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-700 rounded p-1.5 text-xs text-white"
                  >
                    <option value="full">Full (Emblem + Wordmark + Tagline)</option>
                    <option value="compact">Compact (Emblem + Wordmark)</option>
                    <option value="light">Light Mode (White on Dark Base)</option>
                    <option value="dark">Dark Mode (Navy on Light Base)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Endorsement Tagline</label>
                  <input
                    type="text"
                    value={selectedLayer.tagline || BRAND_IDENTITY.officialEndorsement.toUpperCase()}
                    onChange={(e) => handleUpdateSelected({ tagline: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded p-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Role-Specific Controls: Brand Tags Selector */}
          {selectedLayer.role === 'brandTag' && (
            <div className="p-3 bg-gray-900/90 border border-gray-700 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-dn-gold text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-dn-gold" />
                  Official Brand Tags Library
                </span>
                <span className="text-[10px] text-gray-400">1-Click Apply</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {OFFICIAL_BRAND_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleApplyOfficialBrandTag(tag)}
                    className="p-1.5 text-left bg-gray-950 hover:bg-dn-navy border border-gray-800 hover:border-dn-gold/50 rounded transition flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-white block">{tag.label}</span>
                      <span className="text-[9px] text-gray-400">{tag.subtext}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dn-navy-deep text-dn-gold border border-dn-gold/30">
                      {tag.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content input */}
          <div>
            <label className="block text-gray-400 font-semibold mb-1">Text Content</label>
            <textarea
              rows={2}
              value={selectedLayer.content}
              onChange={(e) => handleUpdateSelected({ content: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white font-medium focus:border-dn-gold focus:outline-none"
            />
          </div>

          {/* Color Token Pickers: Text Color */}
          <div>
            <label className="block text-gray-400 font-semibold mb-1.5">
              Brand Color Token (Text)
            </label>
            <div className="flex flex-wrap gap-2">
              {BRAND_TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => handleUpdateSelected({ token })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition ${
                    selectedLayer.token === token
                      ? 'border-dn-gold ring-1 ring-dn-gold'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: BRAND[token] === '#FFFFFF' ? '#1f2937' : BRAND[token] }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/40"
                    style={{ backgroundColor: BRAND[token] }}
                  />
                  <span className="text-white">{token}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Badge Token (Optional) */}
          <div>
            <label className="block text-gray-400 font-semibold mb-1.5">
              Badge Fill Token (Container)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleUpdateSelected({ bgToken: 'transparent' })}
                className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold ${
                  !selectedLayer.bgToken || selectedLayer.bgToken === 'transparent'
                    ? 'border-dn-gold bg-gray-900 text-white'
                    : 'border-gray-700 text-gray-400'
                }`}
              >
                None (Transparent)
              </button>
              {BRAND_TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => handleUpdateSelected({ bgToken: token })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition ${
                    selectedLayer.bgToken === token
                      ? 'border-dn-gold ring-1 ring-dn-gold'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: BRAND[token] === '#FFFFFF' ? '#1f2937' : BRAND[token] }}
                >
                  <span
                    className="w-2 h-2 rounded-full border border-black/40"
                    style={{ backgroundColor: BRAND[token] }}
                  />
                  <span className="text-white">{token}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Position Coordinates: Horizontal (X) & Vertical (Y) */}
          <div className="grid grid-cols-2 gap-3 pt-2 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800">
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Position X</span>
                <span className="font-mono text-dn-gold">{Math.round(selectedLayer.x * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.94"
                step="0.01"
                value={selectedLayer.x}
                onChange={(e) => handleUpdateSelected({ x: parseFloat(e.target.value) })}
                className="w-full accent-dn-gold"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Position Y</span>
                <span className="font-mono text-dn-gold">{Math.round(selectedLayer.y * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.94"
                step="0.01"
                value={selectedLayer.y}
                onChange={(e) => handleUpdateSelected({ y: parseFloat(e.target.value) })}
                className="w-full accent-dn-gold"
              />
            </div>
          </div>

          {/* Font Size & Max Width */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-gray-300">{selectedLayer.fontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                step="1"
                value={selectedLayer.fontSize}
                onChange={(e) => handleUpdateSelected({ fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-dn-gold"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Max Width</span>
                <span className="font-mono text-gray-300">{selectedLayer.maxWidthPct}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="5"
                value={selectedLayer.maxWidthPct}
                onChange={(e) => handleUpdateSelected({ maxWidthPct: parseInt(e.target.value, 10) })}
                className="w-full accent-dn-gold"
              />
            </div>
          </div>

          {/* Alignment & Weight */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700/60">
            <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-700">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => handleUpdateSelected({ align })}
                  className={`p-1.5 rounded ${
                    selectedLayer.align === align ? 'bg-dn-navy text-dn-gold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {align === 'left' ? (
                    <AlignLeft className="w-3.5 h-3.5" />
                  ) : align === 'center' ? (
                    <AlignCenter className="w-3.5 h-3.5" />
                  ) : (
                    <AlignRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-700">
              {(['bold', 'semibold', 'normal'] as const).map((weight) => (
                <button
                  key={weight}
                  onClick={() => handleUpdateSelected({ fontWeight: weight })}
                  className={`px-2 py-0.5 rounded capitalize ${
                    selectedLayer.fontWeight === weight
                      ? 'bg-dn-navy text-dn-gold font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Inject Approved Claims into Proof Chip */}
      {course?.approvedClaims && course.approvedClaims.length > 0 && (
        <div className="pt-3 border-t border-gray-700/80 space-y-2">
          <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-dn-gold" />
            Quick Inject Verified Claim into Proof Chip:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {course.approvedClaims
              .filter((c) => !c.conflict)
              .slice(0, 5)
              .map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddProofClaim(c.claim)}
                  className="px-2 py-1 text-[10px] bg-gray-900 hover:bg-dn-navy border border-gray-700 hover:border-dn-gold text-gray-300 hover:text-white rounded transition"
                >
                  + {c.claim}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerPanel;
