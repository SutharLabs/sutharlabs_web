import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { SubToolProps } from './types.js';
import { QrCode, Download, Copy, Check, Sparkles, Wifi, Link as LinkIcon, Type, CreditCard, RefreshCw } from 'lucide-react';

export default function QrGeneratorTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: SubToolProps) {
  const [mode, setMode] = useState<'url' | 'text' | 'wifi' | 'upi'>('url');
  
  // Input fields
  const [urlValue, setUrlValue] = useState('https://www.sutharlabs.com');
  const [textValue, setTextValue] = useState('SutharLabs Sovereign Engine');
  const [wifiSsid, setWifiSsid] = useState('Office_WiFi');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [upiId, setUpiId] = useState('sutharlabs@upi');
  const [upiName, setUpiName] = useState('SutharLabs');
  const [upiAmount, setUpiAmount] = useState('');

  // Customization
  const [size, setSize] = useState<number>(300);
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [eccLevel, setEccLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute payload string
  const getPayload = (): string => {
    if (mode === 'url') return urlValue.trim();
    if (mode === 'text') return textValue;
    if (mode === 'wifi') {
      return `WIFI:S:${wifiSsid};T:${wifiSecurity};P:${wifiPassword};;`;
    }
    if (mode === 'upi') {
      let str = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}`;
      if (upiAmount) str += `&am=${upiAmount}&cu=INR`;
      return str;
    }
    return '';
  };

  // Generate QR on change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const payload = getPayload();
    if (!payload) return;

    QRCode.toCanvas(canvas, payload, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor
      },
      errorCorrectionLevel: eccLevel
    }, (err) => {
      if (err) {
        setError(`QR Generation error: ${err.message}`);
      } else {
        setError(null);
      }
    });
  }, [mode, urlValue, textValue, wifiSsid, wifiPassword, wifiSecurity, upiId, upiName, upiAmount, size, fgColor, bgColor, eccLevel]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode_${mode}_${Date.now()}.png`;
    a.click();
    setStatus('Downloaded QR Code as high-res PNG!');
    addLog('SUCCESS', `Generated and downloaded QR Code (${mode}).`);
  };

  const handleDownloadSvg = async () => {
    try {
      const payload = getPayload();
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor
        },
        errorCorrectionLevel: eccLevel
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode_${mode}_${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Downloaded vector SVG QR code!');
    } catch (err: any) {
      setError(`SVG generation error: ${err.message}`);
    }
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setStatus('Copied QR code image to clipboard!');
      });
    } catch {
      setError('Clipboard image copy not supported in this browser. Please use Download PNG.');
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-6 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a494b]/20">
        <div className={`flex rounded-lg p-0.5 border text-xs ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
              mode === 'url'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Website URL</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('wifi')}
            className={`px-3 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
              mode === 'wifi'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 shrink-0" />
            <span>Wi-Fi Connect</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-3 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
              mode === 'text'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            <Type className="w-3.5 h-3.5 shrink-0" />
            <span>Plain Text</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('upi')}
            className={`px-3 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
              mode === 'upi'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>UPI Payment</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyImage}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
            }`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>SVG</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPng}
            className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-sky-500 hover:bg-sky-600 text-white select-none"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, QR Preview on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Inputs */}
        <div className="space-y-4">
          {mode === 'url' && (
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                Target Website URL:
              </label>
              <input
                type="url"
                value={urlValue}
                onChange={e => setUrlValue(e.target.value)}
                placeholder="https://example.com"
                className={`w-full h-9 px-3 rounded-xl border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              />
            </div>
          )}

          {mode === 'wifi' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                  Network SSID (Name):
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={e => setWifiSsid(e.target.value)}
                  placeholder="e.g. Home_Network"
                  className={`w-full h-9 px-3 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                  Wi-Fi Password:
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={e => setWifiPassword(e.target.value)}
                  placeholder="Password (leave blank if open)"
                  className={`w-full h-9 px-3 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                  Security Type:
                </label>
                <select
                  value={wifiSecurity}
                  onChange={e => setWifiSecurity(e.target.value as any)}
                  className={`w-full h-9 px-3 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                  <option value="WEP">WEP (Legacy)</option>
                  <option value="nopass">Open (No Password)</option>
                </select>
              </div>
            </div>
          )}

          {mode === 'text' && (
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                Text Message / Content:
              </label>
              <textarea
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                rows={4}
                placeholder="Enter text to encode..."
                className={`w-full p-3 rounded-xl border text-xs font-mono resize-y ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              />
            </div>
          )}

          {mode === 'upi' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                  UPI ID (VPA):
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="payee@bank"
                  className={`w-full h-9 px-3 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                  Payee Name:
                </label>
                <input
                  type="text"
                  value={upiName}
                  onChange={e => setUpiName(e.target.value)}
                  placeholder="Business or Person Name"
                  className={`w-full h-9 px-3 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                  Amount in INR (Optional):
                </label>
                <input
                  type="number"
                  value={upiAmount}
                  onChange={e => setUpiAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className={`w-full h-9 px-3 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Sizing & Colors */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#3a494b]/20">
            <div className="space-y-1">
              <label className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-[#849495]'}`}>Resolution:</label>
              <select
                value={size}
                onChange={e => setSize(Number(e.target.value))}
                className={`w-full h-8 px-2 rounded-lg border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              >
                <option value={200}>Compact (200px)</option>
                <option value={300}>Standard (300px)</option>
                <option value={500}>High-Res (500px)</option>
                <option value={800}>Ultra (800px)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-[#849495]'}`}>Error Correction:</label>
              <select
                value={eccLevel}
                onChange={e => setEccLevel(e.target.value as any)}
                className={`w-full h-8 px-2 rounded-lg border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              >
                <option value="L">Low (7% recovery)</option>
                <option value="M">Medium (15% recovery)</option>
                <option value="Q">Quartile (25% recovery)</option>
                <option value="H">High (30% recovery)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right QR Canvas Preview */}
        <div className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-[#3a494b]/30'
        }`}>
          <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
            <canvas ref={canvasRef} className="block rounded-lg max-w-full h-auto" />
          </div>
          <span className="text-[11px] font-mono text-[#849495] text-center">
            Scan with any iOS, Android, or banking camera
          </span>
        </div>
      </div>
    </div>
  );
}
