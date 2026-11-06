import React, { useState, useEffect, useRef } from 'react';
import { SubToolProps } from './types.js';
import { ShieldCheck, Copy, Check, Upload, FileText, Sparkles, Hash } from 'lucide-react';

export default function HashGeneratorTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: SubToolProps) {
  const [inputText, setInputText] = useState('SutharLabs Sovereign Engine');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<{
    sha256: string;
    sha512: string;
    sha384: string;
    sha1: string;
  }>({
    sha256: '',
    sha512: '',
    sha384: '',
    sha1: ''
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute hashes for an ArrayBuffer using native hardware-accelerated Web Crypto
  const computeHashes = async (buffer: ArrayBuffer) => {
    setIsProcessing(true);
    try {
      const sha256Buf = await crypto.subtle.digest('SHA-256', buffer);
      const sha512Buf = await crypto.subtle.digest('SHA-512', buffer);
      const sha384Buf = await crypto.subtle.digest('SHA-384', buffer);
      const sha1Buf = await crypto.subtle.digest('SHA-1', buffer);

      const bufToHex = (b: ArrayBuffer) => 
        Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');

      setHashes({
        sha256: bufToHex(sha256Buf),
        sha512: bufToHex(sha512Buf),
        sha384: bufToHex(sha384Buf),
        sha1: bufToHex(sha1Buf)
      });
      setError(null);
    } catch (err: any) {
      setError(`Hash computation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-compute when text changes (if no file loaded)
  useEffect(() => {
    if (selectedFile) return;
    const encoder = new TextEncoder();
    const buf = encoder.encode(inputText).buffer;
    computeHashes(buf);
  }, [inputText, selectedFile]);

  // Handle file drop
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setStatus(`Calculating cryptographic checksum for ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      await computeHashes(buffer);
      setStatus(`Computed checksums for ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)!`);
      addLog('SUCCESS', `Computed SHA-256 for file ${file.name}`);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const copyHash = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    setStatus(`Copied ${key.toUpperCase()} hash to clipboard!`);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const encoder = new TextEncoder();
    computeHashes(encoder.encode(inputText).buffer);
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Input Section */}
      <div className="space-y-4">
        {/* File Dropzone or Text Toggle */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isLight 
              ? 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30' 
              : 'border-[#3a494b]/60 hover:border-emerald-400/60 bg-white/2 hover:bg-emerald-500/5'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isLight ? 'bg-white border-slate-200 text-emerald-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-emerald-400'
          }`}>
            <Upload className="w-4.5 h-4.5 shrink-0" />
          </div>
          <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
            {selectedFile ? `Active File: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Drop any file here to verify cryptographic SHA checksums (ISO, ZIP, PDF, EXE)'}
          </p>
          <input 
            ref={fileInputRef} 
            type="file" 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-500 font-bold">Computing file checksums directly in browser RAM</span>
            <button 
              type="button" 
              onClick={clearFile} 
              className="text-xs text-rose-400 hover:underline cursor-pointer"
            >
              Switch back to Text Input
            </button>
          </div>
        )}

        {!selectedFile && (
          <div className="space-y-1.5">
            <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
              Text String to Hash:
            </label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={3}
              placeholder="Enter text to hash..."
              className={`w-full p-3 rounded-xl border text-xs font-mono resize-y ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
              }`}
            />
          </div>
        )}
      </div>

      {/* Hash Results Grid */}
      <div className="space-y-3 pt-3 border-t border-[#3a494b]/20">
        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-[#e5e1e4]'}`}>
          Cryptographic Hash Digests
        </h3>

        {[
          { key: 'sha256', label: 'SHA-256 (Standard)', val: hashes.sha256, color: 'text-[#00dbe7]' },
          { key: 'sha512', label: 'SHA-512 (Ultra-Secure)', val: hashes.sha512, color: 'text-purple-400' },
          { key: 'sha384', label: 'SHA-384', val: hashes.sha384, color: 'text-sky-400' },
          { key: 'sha1', label: 'SHA-1 (Legacy)', val: hashes.sha1, color: 'text-amber-400' }
        ].map(item => (
          <div 
            key={item.key}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/30'
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <span className={`text-[11px] font-mono font-bold block ${item.color}`}>
                {item.label}
              </span>
              <p className={`font-mono text-xs break-all select-all ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
                {item.val || 'Computing...'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => copyHash(item.val, item.key)}
              className={`h-7 px-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border shrink-0 select-none ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              {copiedKey === item.key ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
              <span>{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
