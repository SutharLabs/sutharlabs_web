import React, { useState, useEffect } from 'react';
import { SubToolProps } from './types.js';
import { KeyRound, RefreshCw, Copy, Check, ShieldCheck, Sparkles, Binary } from 'lucide-react';

export default function UuidPasswordTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: SubToolProps) {
  const [tab, setTab] = useState<'password' | 'uuid'>('password');

  // Password Generator State
  const [passLength, setPassLength] = useState<number>(18);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  // UUID Generator State
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generate crypto-secure password
  const generatePassword = () => {
    let chars = '';
    if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setError('Please select at least one character set.');
      return;
    }

    const randomValues = new Uint32Array(passLength);
    crypto.getRandomValues(randomValues);
    let pwd = '';
    for (let i = 0; i < passLength; i++) {
      pwd += chars[randomValues[i] % chars.length];
    }
    setGeneratedPassword(pwd);
    setError(null);
  };

  // Generate UUID v4
  const generateUuids = () => {
    const list: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      list.push(crypto.randomUUID());
    }
    setGeneratedUuids(list);
  };

  useEffect(() => {
    generatePassword();
    generateUuids();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    setStatus(`Copied ${key} to clipboard!`);
  };

  // Estimate entropy
  const getPasswordEntropy = (): { bits: number; label: string; color: string } => {
    let pool = 0;
    if (includeUpper) pool += 26;
    if (includeLower) pool += 26;
    if (includeNumbers) pool += 10;
    if (includeSymbols) pool += 32;
    if (pool === 0) return { bits: 0, label: 'None', color: 'text-rose-500' };

    const bits = Math.round(passLength * Math.log2(pool));
    if (bits >= 90) return { bits, label: 'Uncrackable (Military Grade)', color: 'text-emerald-400' };
    if (bits >= 60) return { bits, label: 'Strong', color: 'text-sky-400' };
    if (bits >= 40) return { bits, label: 'Moderate', color: 'text-amber-400' };
    return { bits, label: 'Weak', color: 'text-rose-400' };
  };

  const entropy = getPasswordEntropy();

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-6 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Switcher Tab */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a494b]/20">
        <div className={`flex rounded-lg p-0.5 border text-xs ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`px-3 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
              tab === 'password'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>Secure Password</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('uuid')}
            className={`px-3 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
              tab === 'uuid'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            <Binary className="w-3.5 h-3.5 shrink-0" />
            <span>UUID v4 Generator</span>
          </button>
        </div>

        <button
          type="button"
          onClick={tab === 'password' ? generatePassword : generateUuids}
          className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-sky-500 hover:bg-sky-600 text-white select-none"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>Regenerate</span>
        </button>
      </div>

      {tab === 'password' && (
        <div className="space-y-5">
          {/* Output Display */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
          }`}>
            <span className="font-mono text-base sm:text-lg font-bold tracking-wider break-all select-all text-sky-500 dark:text-[#00dbe7]">
              {generatedPassword}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(generatedPassword, 'Password')}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border shrink-0 ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              {copiedKey === 'Password' ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>{copiedKey === 'Password' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Entropy Meter */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={isLight ? 'text-slate-600' : 'text-[#849495]'}>Entropy Strength:</span>
            <span className={`font-bold ${entropy.color}`}>{entropy.bits} bits • {entropy.label}</span>
          </div>

          {/* Controls */}
          <div className="space-y-4 pt-2 border-t border-[#3a494b]/20">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-[#e5e1e4]'}>
                Password Length: {passLength} characters
              </span>
              <input
                type="range"
                min="8"
                max="64"
                value={passLength}
                onChange={e => {
                  setPassLength(Number(e.target.value));
                  setTimeout(generatePassword, 10);
                }}
                className="w-48 accent-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUpper}
                  onChange={e => { setIncludeUpper(e.target.checked); setTimeout(generatePassword, 10); }}
                  className="rounded accent-sky-500"
                />
                <span>Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLower}
                  onChange={e => { setIncludeLower(e.target.checked); setTimeout(generatePassword, 10); }}
                  className="rounded accent-sky-500"
                />
                <span>Lowercase (a-z)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={e => { setIncludeNumbers(e.target.checked); setTimeout(generatePassword, 10); }}
                  className="rounded accent-sky-500"
                />
                <span>Numbers (0-9)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={e => { setIncludeSymbols(e.target.checked); setTimeout(generatePassword, 10); }}
                  className="rounded accent-sky-500"
                />
                <span>Symbols (!@#$)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {tab === 'uuid' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={isLight ? 'text-slate-600 font-semibold' : 'text-[#849495]'}>Quantity:</span>
              <select
                value={uuidCount}
                onChange={e => {
                  setUuidCount(Number(e.target.value));
                  setTimeout(generateUuids, 10);
                }}
                className={`h-8 px-2 rounded-lg border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              >
                <option value={1}>1 UUID</option>
                <option value={5}>5 UUIDs</option>
                <option value={10}>10 UUIDs</option>
                <option value={25}>25 UUIDs</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(generatedUuids.join('\n'), 'All UUIDs')}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              {copiedKey === 'All UUIDs' ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>Copy All</span>
            </button>
          </div>

          <div className="space-y-2">
            {generatedUuids.map((id, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/30'
                }`}
              >
                <span className="text-purple-400 font-bold select-all">{id}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(id, `UUID #${idx + 1}`)}
                  className="p-1.5 rounded hover:bg-white/5 text-[#849495] hover:text-[#00dbe7] cursor-pointer"
                >
                  {copiedKey === `UUID #${idx + 1}` ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
