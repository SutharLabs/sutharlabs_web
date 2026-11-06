import React, { useState, useRef } from 'react';
import { SubToolProps } from './types.js';
import { Binary, Upload, Copy, Check, Sparkles, ArrowRightLeft } from 'lucide-react';

export default function Base64Tool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: SubToolProps) {
  const [mode, setMode] = useState<'base64' | 'url' | 'file'>('base64');
  const [inputText, setInputText] = useState('Hello from SutharLabs Sovereign Engine!');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEncode = () => {
    try {
      setError(null);
      if (mode === 'base64') {
        const encoded = btoa(unescape(encodeURIComponent(inputText)));
        setOutputText(encoded);
        setStatus('Encoded text to Base64!');
      } else if (mode === 'url') {
        const encoded = encodeURIComponent(inputText);
        setOutputText(encoded);
        setStatus('URL Encoded text!');
      }
    } catch (err: any) {
      setError(`Encoding error: ${err.message}`);
    }
  };

  const handleDecode = () => {
    try {
      setError(null);
      if (mode === 'base64') {
        const decoded = decodeURIComponent(escape(atob(inputText)));
        setOutputText(decoded);
        setStatus('Decoded Base64 string!');
      } else if (mode === 'url') {
        const decoded = decodeURIComponent(inputText);
        setOutputText(decoded);
        setStatus('URL Decoded string!');
      }
    } catch (err: any) {
      setError(`Decoding error: ${err.message}`);
    }
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOutputText(reader.result as string);
      setStatus(`Generated Data URI Base64 for ${file.name} (${(file.size / 1024).toFixed(1)} KB)!`);
      addLog('SUCCESS', `Converted file ${file.name} to Base64.`);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const copyOutput = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setStatus('Copied to clipboard!');
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a494b]/20">
        <div className={`flex rounded-lg p-0.5 border text-xs ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setMode('base64')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
              mode === 'base64'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            Base64 (Text)
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
              mode === 'url'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            URL Encode/Decode
          </button>
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
              mode === 'file'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            File to Data URI
          </button>
        </div>

        {mode !== 'file' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEncode}
              className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-sm select-none"
            >
              Encode
            </button>
            <button
              type="button"
              onClick={handleDecode}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-sm border select-none ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              Decode
            </button>
          </div>
        ) : (
          outputText && (
            <button
              type="button"
              onClick={copyOutput}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>{copied ? 'Copied' : 'Copy Data URI'}</span>
            </button>
          )
        )}
      </div>

      {mode === 'file' ? (
        <div className="space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isLight 
                ? 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30' 
                : 'border-[#3a494b]/60 hover:border-emerald-400/60 bg-white/2 hover:bg-emerald-500/5'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight ? 'bg-white border-slate-200 text-emerald-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-emerald-400'
            }`}>
              <Upload className="w-5 h-5 shrink-0" />
            </div>
            <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
              Click to select any image, icon, font, or file to generate its Base64 Data URI
            </p>
            <input 
              ref={fileInputRef} 
              type="file" 
              onChange={handleFileDrop} 
              className="hidden" 
            />
          </div>

          {outputText && (
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                Base64 Data URI Output ({outputText.length} characters):
              </label>
              <textarea
                value={outputText}
                readOnly
                rows={8}
                className={`w-full p-3 rounded-xl border text-xs font-mono resize-y leading-relaxed select-all scrollbar-thin ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/20 border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
              Input:
            </label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={8}
              placeholder="Enter text to encode or decode..."
              className={`w-full p-3 rounded-xl border text-xs font-mono resize-y leading-relaxed scrollbar-thin ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                Result Output:
              </label>
              {outputText && (
                <button
                  type="button"
                  onClick={copyOutput}
                  className="text-xs font-mono text-sky-500 hover:underline cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <textarea
              value={outputText}
              readOnly
              rows={8}
              placeholder="Encoded or decoded string will appear here..."
              className={`w-full p-3 rounded-xl border text-xs font-mono resize-y leading-relaxed select-all scrollbar-thin ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/20 border-[#3a494b]/40 text-[#e5e1e4]'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
