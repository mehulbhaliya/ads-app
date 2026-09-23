import React, { useState, useEffect } from 'react';
import { CampaignBrief, MasterRatio } from '../types';
import { assembleImagePrompt } from '../services/geminiImage';
import {
  OpenArtConfig,
  loadOpenArtConfig,
  saveOpenArtConfig,
  generateImageViaOpenArtMcp,
  DEFAULT_OPENART_ENDPOINT,
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
  Key,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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

  // OpenArt MCP Live Connection State
  const [openArtConfig, setOpenArtConfig] = useState<OpenArtConfig>(loadOpenArtConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [isGeneratingMcp, setIsGeneratingMcp] = useState(false);
  const [mcpStatusMessage, setMcpStatusMessage] = useState('');
  const [mcpError, setMcpError] = useState('');
  const [generatedResultUrl, setGeneratedResultUrl] = useState<string | null>(null);

  useEffect(() => {
    setOpenArtConfig(loadOpenArtConfig());
  }, []);

  if (!isOpen) return null;

  const assembly = assembleImagePrompt(brief, masterRatio);

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
      const base64 = reader.result as string;
      onImportGeneratedImage(base64);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleImportByUrl = () => {
    if (!importUrl.trim()) return;
    try {
      onImportGeneratedImage(importUrl.trim());
      onClose();
    } catch (err: any) {
      setImportError('Failed to load image from URL.');
    }
  };

  const handleUpdateConfig = (patch: Partial<OpenArtConfig>) => {
    const updated = { ...openArtConfig, ...patch };
    setOpenArtConfig(updated);
    saveOpenArtConfig(updated);
  };

  const handleDirectMcpGenerate = async () => {
    setIsGeneratingMcp(true);
    setMcpError('');
    setMcpStatusMessage('Connecting to OpenArt MCP server (https://mcp.openart.ai/mcp)...');

    try {
      setMcpStatusMessage('Invoking OpenArt MCP generate_image tool with strict DigiNerve scaffold...');
      const result = await generateImageViaOpenArtMcp(
        assembly.fullPromptText,
        masterRatio,
        openArtConfig
      );

      setGeneratedResultUrl(result.imageUrl);
      setMcpStatusMessage('Generated successfully! Applying base to Studio Canvas...');
      onImportGeneratedImage(result.imageUrl);
      // Auto close after small delay to show feedback
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('OpenArt MCP call failed:', err);
      setMcpError(err.message || 'Failed to generate via OpenArt MCP');
    } finally {
      setIsGeneratingMcp(false);
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
                <h3 className="text-base font-bold text-white">OpenArt MCP Server Integration</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                  NEEDS BACKEND PROXY
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Direct JSON-RPC / SSE connection to <span className="font-mono text-dn-gold">https://mcp.openart.ai/mcp</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Active Direct Generation Banner */}
          <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/40 border border-blue-600/60 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-dn-gold animate-pulse" />
                  1-Click Generate via OpenArt MCP Server
                </span>
                <p className="text-gray-300 text-xs mt-0.5">
                  Directly calls <code className="text-blue-300 bg-black/40 px-1.5 py-0.5 rounded">tools/call - generate_image</code> on your OpenArt remote agent endpoint.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDirectMcpGenerate}
                disabled={isGeneratingMcp}
                className="px-5 py-2.5 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-dn-gold/20 transition active:scale-95 disabled:opacity-50 flex-shrink-0"
              >
                <Zap className={`w-4 h-4 ${isGeneratingMcp ? 'animate-bounce text-dn-navy-deep' : ''}`} />
                <span>{isGeneratingMcp ? 'Generating on OpenArt...' : 'Generate with OpenArt MCP'}</span>
              </button>
            </div>

            {/* Status or Progress Feedback */}
            {isGeneratingMcp && (
              <div className="p-3 bg-blue-950/80 border border-blue-700/80 rounded-lg text-blue-200 text-xs flex items-center gap-2 animate-pulse">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-dn-gold border-t-transparent animate-spin" />
                <span>{mcpStatusMessage}</span>
              </div>
            )}

            {mcpError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">OpenArt Request Failed:</span>
                  <p className="mt-1 text-red-300 font-mono text-[11px] leading-relaxed">{mcpError}</p>
                  <p className="mt-1.5 text-gray-400 text-[10px]">
                    Tip: OpenArt MCP authenticates via OAuth or a Bearer token. Expand "OpenArt Server Settings" below to configure your token or custom parameters.
                  </p>
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

          {/* OpenArt Configuration Settings Toggle */}
          <div className="border border-gray-800 rounded-xl bg-gray-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/40 transition"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                <Globe className="w-4 h-4 text-dn-gold" />
                <span>OpenArt Server Settings & OAuth Token</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  ({openArtConfig.endpoint})
                </span>
              </div>
              {showConfig ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showConfig && (
              <div className="p-4 border-t border-gray-800 space-y-3 bg-gray-950">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    MCP Server Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={openArtConfig.endpoint}
                    onChange={(e) => handleUpdateConfig({ endpoint: e.target.value })}
                    placeholder={DEFAULT_OPENART_ENDPOINT}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-dn-gold focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Default: <code className="text-gray-400">https://mcp.openart.ai/mcp</code>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">
                      OAuth Bearer Token (Optional / If Required)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={openArtConfig.authToken || ''}
                        onChange={(e) => handleUpdateConfig({ authToken: e.target.value })}
                        placeholder="Bearer token or OAuth key..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 pl-8 text-white font-mono text-xs focus:border-dn-gold focus:outline-none"
                      />
                      <Key className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">
                      Preferred OpenArt Model
                    </label>
                    <select
                      value={openArtConfig.model || 'openart-sdxl'}
                      onChange={(e) => handleUpdateConfig({ model: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-xs focus:border-dn-gold focus:outline-none"
                    >
                      <option value="openart-sdxl">OpenArt SDXL (Default Photorealistic)</option>
                      <option value="flux-schnell">Flux Schnell</option>
                      <option value="flux-dev">Flux Dev (High Precision Clinical)</option>
                      <option value="openart-v2">OpenArt Creative V2</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-gray-900/60 border border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>
                    OpenArt MCP uses OAuth 2.0 PKCE. If you use the OpenArt CLI or Claude/ChatGPT connector, you can paste the session token here.
                  </span>
                  <a
                    href="https://openart.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-dn-gold hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    <span>OpenArt.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section: Assembled DigiNerve Prompt Scaffold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200 flex items-center gap-1.5">
                <span>Prompt Scaffold Passed to OpenArt</span>
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

            <pre className="p-3.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto select-all whitespace-pre-wrap">
              {assembly.fullPromptText}
            </pre>
          </div>

          {/* Manual Return Options (Fallback) */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <span className="font-bold text-gray-300 block text-xs">
              Manual Import Fallback (If using OpenArt in external tab/CLI)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* File Upload */}
              <label className="border-2 border-dashed border-gray-700 hover:border-dn-gold p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-950/40 hover:bg-gray-950 transition text-center">
                <Upload className="w-5 h-5 text-dn-gold mb-1.5" />
                <span className="font-bold text-white text-xs">Upload Downloaded Image</span>
                <span className="text-[10px] text-gray-400 mt-0.5">PNG or JPEG from OpenArt</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Paste URL or Data */}
              <div className="border border-gray-700 p-4 rounded-xl bg-gray-950/40 space-y-2 flex flex-col justify-center">
                <span className="font-bold text-white text-xs flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  Paste OpenArt Hosted URL
                </span>
                <input
                  type="text"
                  placeholder="https://openart.ai/image/... or data:..."
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
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>OpenArt MCP Target: <span className="text-gray-200 font-mono">https://mcp.openart.ai/mcp</span></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold"
          >
            Close Bridge
          </button>
        </div>
      </div>
    </div>
  );
};

export default McpPromptBridge;
