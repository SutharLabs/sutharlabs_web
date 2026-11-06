import React, { useState, useRef } from 'react';
import { 
  Contact, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  User, 
  Building, 
  Briefcase, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  RefreshCw,
  Share2,
  Sparkles
} from 'lucide-react';
import { SubToolProps } from './types.js';

interface BusinessCardContact {
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  notes: string;
}

export default function BusinessCardScannerTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog
}: SubToolProps) {
  const [contact, setContact] = useState<BusinessCardContact>({
    fullName: 'Suresh Suthar',
    title: 'Lead Architect & Sovereign Infrastructure Engineer',
    company: 'SutharLabs Technologies',
    phone: '+91 98250 12345',
    email: 'contact@sutharlabs.com',
    website: 'https://www.sutharlabs.com',
    address: 'Sovereign Cloud HQ, Gandhinagar, Gujarat - 382016',
    notes: 'Scanned via SutharLabs Business Card OCR Engine'
  });

  const [copiedVcard, setCopiedVcard] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof BusinessCardContact, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setStatus('Analyzing business card layout and contact coordinates...');
    addLog('INFO', `Scanning business card image [${file.name}]...`);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker(['eng', 'hin']);
        const ret = await worker.recognize(dataUrl);
        const text = ret.data.text || '';
        await worker.terminate();

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

        // Heuristics
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}/);
        const webMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/);

        const extractedName = lines[0] || 'Unknown Contact';
        const extractedTitle = lines[1] || '';
        const extractedCompany = lines[2] || '';

        setContact({
          fullName: extractedName.substring(0, 40),
          title: extractedTitle.substring(0, 40),
          company: extractedCompany.substring(0, 40),
          phone: phoneMatch ? phoneMatch[0] : '+91-XXXXX XXXXX',
          email: emailMatch ? emailMatch[0] : 'hello@company.com',
          website: webMatch ? webMatch[0] : 'https://www.company.com',
          address: lines.slice(3).join(', ').substring(0, 80) || 'Business Address',
          notes: 'Extracted from physical card via in-browser OCR'
        });

        setIsProcessing(false);
        setStatus('Business card successfully digitized!');
        addLog('SUCCESS', `Extracted contact for ${extractedName}.`);
      } catch (err: any) {
        setIsProcessing(false);
        setError(`Card scanning failed: ${err.message || 'Unknown error'}`);
        addLog('ERROR', `Card Scan Error: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateVCardString = () => {
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contact.fullName}`,
      `ORG:${contact.company}`,
      `TITLE:${contact.title}`,
      `TEL;TYPE=CELL:${contact.phone}`,
      `EMAIL:${contact.email}`,
      `URL:${contact.website}`,
      `ADR;TYPE=WORK:;;${contact.address};;;;`,
      `NOTE:${contact.notes}`,
      'END:VCARD'
    ].join('\r\n');
  };

  const downloadVCard = () => {
    const vcard = generateVCardString();
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = contact.fullName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    a.download = `${cleanName || 'contact'}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('SUCCESS', `Downloaded vCard (.vcf) for ${contact.fullName}.`);
  };

  const copyVcard = () => {
    const vcard = generateVCardString();
    navigator.clipboard.writeText(vcard);
    setCopiedVcard(true);
    setTimeout(() => setCopiedVcard(false), 2000);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(contact, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
      }`}>
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
            <Contact className="w-5 h-5 text-sky-400 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base">Business Card to vCard (.vcf)</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                1-CLICK IMPORT
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-gray-400 mt-0.5">
              Scan paper visiting cards and export contacts directly to iPhone, Android, Google Contacts, and Outlook.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-sky-500 hover:bg-sky-600 text-white border border-sky-600'
                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span>Upload Card</span>
          </button>

          <button
            type="button"
            onClick={copyJson}
            className={`h-8 px-3 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border border-[#3a494b]/40'
            }`}
          >
            {copiedJson ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
            <span>{copiedJson ? 'JSON Copied' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={downloadVCard}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/50'
            }`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Download vCard (.vcf)</span>
          </button>
        </div>
      </div>

      {/* Main Form & Digital Card Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: Editable Fields */}
        <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
        }`}>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-[#00dbe7]">
            Contact Details Form
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-gray-400 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={contact.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 focus:border-sky-500' : 'bg-[#18181c] border-[#3a494b]/40 focus:border-[#00dbe7]'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-gray-400 block mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={contact.company}
                onChange={(e) => updateField('company', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 focus:border-sky-500' : 'bg-[#18181c] border-[#3a494b]/40 focus:border-[#00dbe7]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-gray-400 block mb-1">
              Job Title / Designation
            </label>
            <input
              type="text"
              value={contact.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                isLight ? 'bg-slate-50 border-slate-300 focus:border-sky-500' : 'bg-[#18181c] border-[#3a494b]/40 focus:border-[#00dbe7]'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-gray-400 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={contact.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 focus:border-sky-500' : 'bg-[#18181c] border-[#3a494b]/40 focus:border-[#00dbe7]'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-gray-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 focus:border-sky-500' : 'bg-[#18181c] border-[#3a494b]/40 focus:border-[#00dbe7]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-gray-400 block mb-1">
                Website
              </label>
              <input
                type="text"
                value={contact.website}
                onChange={(e) => updateField('website', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 focus:border-sky-500' : 'bg-[#18181c] border-[#3a494b]/40 focus:border-[#00dbe7]'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-gray-400 block mb-1">
                Address
              </label>
              <input
                type="text"
                value={contact.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 focus:border-sky-500' : 'bg-[#18181c] border-[#3a494b]/40 focus:border-[#00dbe7]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right: Digital Visiting Card Render */}
        <div className={`p-6 rounded-xl border flex flex-col justify-between shadow-xl relative overflow-hidden ${
          isLight ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white' : 'bg-gradient-to-br from-[#16161a] to-[#0c0c0e] border-[#3a494b]/50 text-white'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block mb-1">
                DIGITAL VISITING CARD
              </span>
              <h4 className="text-xl font-bold tracking-tight">{contact.fullName}</h4>
              <p className="text-xs text-gray-300 font-mono mt-0.5">{contact.title}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-cyan-400 shadow-md">
              {contact.fullName.charAt(0) || 'C'}
            </div>
          </div>

          <div className="my-6 border-t border-white/10 pt-4 flex flex-col gap-2 font-mono text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{contact.company}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{contact.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{contact.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{contact.website}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{contact.address}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] font-mono text-gray-400">
            <span>SutharLabs Sovereign Card v3.0</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3 shrink-0" /> Ready for vCard sync
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
