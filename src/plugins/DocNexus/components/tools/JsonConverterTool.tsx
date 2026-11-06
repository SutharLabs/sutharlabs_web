import React, { useState } from 'react';
import { SubToolProps } from './types.js';
import { FileCode, Download, Copy, Check, Sparkles, RefreshCw, FileSpreadsheet, ArrowLeftRight } from 'lucide-react';

export default function JsonConverterTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: SubToolProps) {
  const [inputData, setInputData] = useState<string>(`[
  { "id": 1, "name": "Sovereign Engine", "category": "AI", "active": true },
  { "id": 2, "name": "Workflow Studio", "category": "Automation", "active": true },
  { "id": 3, "name": "Stock Tracker", "category": "Finance", "active": false }
]`);
  const [outputData, setOutputData] = useState<string>('');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [copied, setCopied] = useState(false);

  // Format / Prettify JSON
  const handleFormat = () => {
    try {
      setError(null);
      const parsed = JSON.parse(inputData);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setOutputData(formatted);
      setStatus('JSON formatted successfully!');
      addLog('SUCCESS', 'Formatted JSON payload.');
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  // Minify JSON
  const handleMinify = () => {
    try {
      setError(null);
      const parsed = JSON.parse(inputData);
      const minified = JSON.stringify(parsed);
      setOutputData(minified);
      setStatus(`Minified JSON! Saved ${inputData.length - minified.length} bytes.`);
      addLog('SUCCESS', 'Minified JSON payload.');
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  // Convert JSON to CSV
  const handleJsonToCsv = () => {
    try {
      setError(null);
      let parsed = JSON.parse(inputData);
      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) {
          parsed = [parsed];
        } else {
          throw new Error('Input must be a JSON array of objects.');
        }
      }

      if (parsed.length === 0) {
        setOutputData('');
        return;
      }

      const headers: string[] = Array.from(new Set<string>(parsed.flatMap((obj: any) => Object.keys(obj))));
      const csvRows = [
        headers.join(','),
        ...parsed.map((row: any) => 
          headers.map(h => {
            const val = row[h] === undefined || row[h] === null ? '' : row[h];
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];

      const csvString = csvRows.join('\n');
      setOutputData(csvString);
      setStatus(`Converted JSON to CSV (${parsed.length} rows)!`);
      addLog('SUCCESS', `Converted JSON to CSV (${parsed.length} rows).`);
    } catch (err: any) {
      setError(`JSON to CSV conversion error: ${err.message}`);
    }
  };

  // Convert CSV to JSON
  const handleCsvToJson = () => {
    try {
      setError(null);
      const lines = inputData.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row.');
      }

      const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^["']|["']$/g, '').trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          let val: any = parts[idx] !== undefined ? parts[idx] : '';
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (!isNaN(Number(val)) && val !== '') val = Number(val);
          rowObj[h] = val;
        });
        rows.push(rowObj);
      }

      const jsonStr = JSON.stringify(rows, null, 2);
      setOutputData(jsonStr);
      setStatus(`Converted CSV to JSON (${rows.length} objects)!`);
      addLog('SUCCESS', `Converted CSV to JSON (${rows.length} items).`);
    } catch (err: any) {
      setError(`CSV to JSON error: ${err.message}`);
    }
  };

  const copyOutput = () => {
    if (!outputData) return;
    navigator.clipboard.writeText(outputData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setStatus('Copied to clipboard!');
  };

  const downloadOutput = () => {
    if (!outputData) return;
    const isCsv = outputData.includes(',') && !outputData.trim().startsWith('{') && !outputData.trim().startsWith('[');
    const ext = isCsv ? 'csv' : 'json';
    const mime = isCsv ? 'text/csv' : 'application/json';
    const blob = new Blob([outputData], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a494b]/20">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleFormat}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Format</span>
          </button>

          <button
            type="button"
            onClick={handleMinify}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
            }`}
          >
            <span>Minify</span>
          </button>

          <button
            type="button"
            onClick={handleJsonToCsv}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
              isLight ? 'bg-white hover:bg-slate-50 text-emerald-700 border-slate-300' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>JSON $\to$ CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCsvToJson}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
              isLight ? 'bg-white hover:bg-slate-50 text-purple-700 border-slate-300' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
            <span>CSV $\to$ JSON</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {outputData && (
            <>
              <button
                type="button"
                onClick={copyOutput}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                  isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={downloadOutput}
                className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-sky-500 hover:bg-sky-600 text-white select-none"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Split View Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-[#849495]'}>Input (JSON or CSV):</span>
            <span className="text-[10px] text-[#849495]">{inputData.length} chars</span>
          </div>
          <textarea
            value={inputData}
            onChange={e => setInputData(e.target.value)}
            rows={14}
            placeholder="Paste raw JSON or CSV data here..."
            className={`w-full p-3 rounded-xl border text-xs font-mono resize-y leading-relaxed scrollbar-thin ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
            }`}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-[#849495]'}>Output (Formatted Result):</span>
            <span className="text-[10px] text-[#849495]">{outputData.length} chars</span>
          </div>
          <textarea
            value={outputData}
            readOnly
            rows={14}
            placeholder="Formatted JSON or converted CSV will appear here..."
            className={`w-full p-3 rounded-xl border text-xs font-mono resize-y leading-relaxed select-all scrollbar-thin ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/20 border-[#3a494b]/40 text-[#e5e1e4]'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
