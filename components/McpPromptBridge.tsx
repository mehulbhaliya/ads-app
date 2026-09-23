import React, { useState } from 'react';
import { CampaignBrief, MasterRatio } from '../types';
import { assembleImagePrompt } from '../services/geminiImage';
import {
  OpenArtConfig,
  OpenArtModel,
  OPENART_MODELS,
  loadOpenArtConfig,
  saveOpenArtConfig,
  connectOpenArt,
  generateImageViaOpenArt,
} from '../services/openArtMcp';
import {
  Sparkles,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Zap,
  Globe,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
} from 'lucide-react';

interface McpPromptBridgeProps {
  brief: CampaignBrief;
  masterRatio: MasterRatio;
  isOpen: boolean;
  onClose: () => void;
  onImportGeneratedImage: (base64Image: string) => void;
}

export const McpPromptBridge: React.FC<McpPromptBridgeProps> = ({
  brief,
  masterRatio,
  isOpen,
  onClose,
  onImportGeneratedImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');

  const [openArtConfig, setOpenArtConfig] = useState<OpenArtConfig>(loadOpenArtConfig);
  const [showConfig, setShowConfig] = useState(() => !loadOpenArtConfig().proxyUrl);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [generatedResultUrl, setGeneratedResultUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const assembly = assembleImagePrompt(brief, masterRatio);
  const isConnected = Boolean(openArtConfig.session);
  const selectedModel = OPENART_MODELS.find((m) => m.id === openArtConfig.model) || OPENART_MODELS[0];

  const updateConfig = (patch: Partial<OpenArtConfig>) => {
    setOpenArtConfig((prev) => {
      const next = { ...prev, ...patch };
      saveOpenArtConfig(next);
      return next;
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(assembly.fullPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImportGeneratedImage(reader.result as string);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleImportByUrl = () => {
    if (!importUrl.trim()) return;
    try {
      onImportGeneratedImage(importUrl.trim());
      onClose();
    } catch {
      setImportError('Failed to load image from URL.');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    try {
      const session = await connectOpenArt(openArtConfig.proxyUrl);
      updateConfig({ session });
    } catch (err: any) {
      setError(err.message || 'Could not connect to OpenArt.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => updateConfig({ session: undefined });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedResultUrl(null);
    try {
      const image = await generateImageViaOpenArt(
        assembly.fullPromptText,
        masterRatio,
        openArtConfig,
        setStatusMessage,
        (session) => updateConfig({ session })
      );
      setGeneratedResultUrl(image);
      setStatusMessage('Done. Applying to Studio Canvas...');
      onImportGeneratedImage(image);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      console.error('OpenArt generation failed:', err);
      if (err.status === 401) updateConfig({ session: undefined });
      setError(err.message || 'OpenArt generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-dn-navy-deep">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-dn-gold/20 border border-dn-gold/40 flex items-center justify-center text-dn-gold shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">OpenArt Image Generation</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isConnected
                      ? 'bg-green-950 text-green-300 border-green-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}
                >
                  {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>
              <p className="text-xs text-gray-300">Runs through your OpenArt proxy using your OpenArt credits</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/40 border border-blue-600/60 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-dn-gold" />
                  Generate with {selectedModel.label.split(' (')[0]}
                </span>
                <p className="text-gray-300 text-xs mt-0.5">
                  {selectedModel.credits} credits per image · {masterRatio} · 1K resolution
                </p>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-5 py-2.5 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-dn-gold/20 transition active:scale-95 disabled:opacity-50 flex-shrink-0"
                >
                  <Zap className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
                  <span>{isGenerating ? 'Generating on OpenArt...' : 'Generate Image'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting || !openArtConfig.proxyUrl.trim()}
                  className="px-5 py-2.5 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 flex-shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isConnecting ? 'Waiting for OpenArt login...' : 'Connect OpenArt'}</span>
                </button>
              )}
            </div>

            {!openArtConfig.proxyUrl.trim() && (
              <p className="text-amber-300 text-[11px]">
                Add your OpenArt proxy URL in the settings below first (see server/README.md for the one-time deploy).
              </p>
            )}

            {isGenerating && (
              <div className="p-3 bg-blue-950/80 border border-blue-700/80 rounded-lg text-blue-200 text-xs flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-dn-gold border-t-transparent animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">OpenArt request failed:</span>
                  <p className="mt-1 text-red-300 font-mono text-[11px] leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {generatedResultUrl && (
              <div className="p-2.5 bg-green-950/80 border border-green-700 rounded-lg text-green-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Image generated and loaded into canvas!</span>
                </div>
                <img
                  src={generatedResultUrl}
                  alt="Generated"
                  className="w-10 h-10 object-cover rounded border border-green-600"
                />
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border border-gray-800 rounded-xl bg-gray-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/40 transition"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                <Globe className="w-4 h-4 text-dn-gold" />
                <span>OpenArt Settings</span>
                <span className="text-[10px] text-gray-400 font-mono truncate max-w-[220px]">
                  ({openArtConfig.proxyUrl || 'proxy URL not set'})
                </span>
              </div>
              {showConfig ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showConfig && (
              <div className="p-4 border-t border-gray-800 space-y-3 bg-gray-950">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">OpenArt Proxy URL</label>
                  <input
                    type="text"
                    value={openArtConfig.proxyUrl}
                    onChange={(e) => updateConfig({ proxyUrl: e.target.value, session: undefined })}
                    placeholder="https://openart-proxy-xxxxx.a.run.app"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-dn-gold focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    The Cloud Run URL of the proxy in <code className="text-gray-400">server/</code>. Changing it signs you out.
                  </span>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Model</label>
                  <select
                    value={openArtConfig.model}
                    onChange={(e) => updateConfig({ model: e.target.value as OpenArtModel })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-xs focus:border-dn-gold focus:outline-none"
                  >
                    {OPENART_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} · {m.credits} credits
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-gray-900/60 border border-gray-800 text-[11px] text-gray-400">
                  <span>{isConnected ? 'Signed in to OpenArt on this browser.' : 'Not signed in.'}</span>
                  <div className="flex items-center gap-3">
                    {isConnected && (
                      <button onClick={handleDisconnect} className="text-red-300 hover:underline flex items-center gap-1">
                        <LogOut className="w-3 h-3" />
                        Disconnect
                      </button>
                    )}
                    <a
                      href="https://openart.ai/pricing?utm_source=mcp"
                      target="_blank"
                      rel="noreferrer"
                      className="text-dn-gold hover:underline flex items-center gap-1"
                    >
                      <span>Credits</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Scaffold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200 flex items-center gap-1.5">
                <span>Prompt Scaffold Sent to OpenArt</span>
                <span className="font-mono text-[10px] text-dn-gold bg-black/40 px-1.5 py-0.5 rounded">
                  {masterRatio} Master Aspect
                </span>
              </span>
              <button
                onClick={handleCopyPrompt}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold rounded-md flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              Reference images from the brief are not sent to OpenArt yet (text-to-image only). Use Gemini generation when references matter.
            </p>
            <pre className="p-3.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto select-all whitespace-pre-wrap">
              {assembly.fullPromptText}
            </pre>
          </div>

          {/* Manual Fallback */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <span className="font-bold text-gray-300 block text-xs">Manual Import (if you generated in OpenArt directly)</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="border-2 border-dashed border-gray-700 hover:border-dn-gold p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-950/40 hover:bg-gray-950 transition text-center">
                <Upload className="w-5 h-5 text-dn-gold mb-1.5" />
                <span className="font-bold text-white text-xs">Upload Downloaded Image</span>
                <span className="text-[10px] text-gray-400 mt-0.5">PNG or JPEG from OpenArt</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="border border-gray-700 p-4 rounded-xl bg-gray-950/40 space-y-2 flex flex-col justify-center">
                <span className="font-bold text-white text-xs flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  Paste Image URL
                </span>
                <input
                  type="text"
                  placeholder="https://... or data:..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-[11px] focus:outline-none focus:border-dn-gold"
                />
                <button
                  type="button"
                  onClick={handleImportByUrl}
                  disabled={!importUrl.trim()}
                  className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded text-xs transition disabled:opacity-50"
                >
                  Apply to Canvas
                </button>
                {importError && <p className="text-red-400 text-[10px]">{importError}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
