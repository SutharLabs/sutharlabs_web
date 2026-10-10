import React, { useState } from 'react';
import { SheetColumn, SheetRow, SpreadsheetState } from '../types.js';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Calculator, 
  Search, 
  ChevronDown, 
  FileSpreadsheet,
  ArrowUpDown
} from 'lucide-react';

interface SpreadsheetStudioProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  theme?: 'dark' | 'light';
}

const DEFAULT_SHEET: SpreadsheetState = {
  currencySymbol: '₹',
  showSummaryRow: true,
  columns: [
    { id: 'col1', name: 'Item / Service', type: 'text', width: 220 },
    { id: 'col2', name: 'Category', type: 'text', width: 140 },
    { id: 'col3', name: 'Units', type: 'number', width: 100 },
    { id: 'col4', name: 'Cost (₹)', type: 'currency', width: 140 },
    { id: 'col5', name: 'Status', type: 'status', width: 120 }
  ],
  rows: [
    { id: 'r1', cells: { col1: 'Cloud Ingress Gateway', col2: 'Infrastructure', col3: 2, col4: 3500, col5: 'Active' } },
    { id: 'r2', cells: { col1: 'Database Cluster', col2: 'Storage', col3: 1, col4: 6200, col5: 'Active' } },
    { id: 'r3', cells: { col1: 'Security Audit Service', col2: 'Compliance', col3: 1, col4: 12000, col5: 'Pending' } }
  ]
};

export default function SpreadsheetStudio({
  content,
  onChangeContent,
  theme = 'dark'
}: SpreadsheetStudioProps) {
  const isLight = theme === 'light';

  const sheet: SpreadsheetState = React.useMemo(() => {
    try {
      if (!content) return DEFAULT_SHEET;
      const parsed = JSON.parse(content);
      return { ...DEFAULT_SHEET, ...parsed };
    } catch {
      return DEFAULT_SHEET;
    }
  }, [content]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const updateSheet = (newState: Partial<SpreadsheetState>) => {
    const updated = { ...sheet, ...newState };
    onChangeContent(JSON.stringify(updated));
  };

  const handleCellChange = (rowId: string, colId: string, value: any) => {
    const updatedRows = sheet.rows.map(r =>
      r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r
    );
    updateSheet({ rows: updatedRows });
  };

  const handleAddRow = () => {
    const newId = `r_${Date.now().toString(36)}`;
    const newRow: SheetRow = {
      id: newId,
      cells: {}
    };
    sheet.columns.forEach(col => {
      newRow.cells[col.id] = col.type === 'number' || col.type === 'currency' ? 0 : col.type === 'status' ? 'Active' : '';
    });
    updateSheet({ rows: [...sheet.rows, newRow] });
  };

  const handleDeleteRow = (rowId: string) => {
    updateSheet({ rows: sheet.rows.filter(r => r.id !== rowId) });
  };

  const handleAddColumn = () => {
    const colCount = sheet.columns.length + 1;
    const newColId = `col_${Date.now().toString(36)}`;
    const newCol: SheetColumn = {
      id: newColId,
      name: `Column ${colCount}`,
      type: 'text',
      width: 150
    };
    updateSheet({ columns: [...sheet.columns, newCol] });
  };

  const handleUpdateColumnName = (colId: string, name: string) => {
    const updatedCols = sheet.columns.map(c => c.id === colId ? { ...c, name } : c);
    updateSheet({ columns: updatedCols });
  };

  const handleExportCSV = () => {
    const headers = sheet.columns.map(c => `"${c.name}"`).join(',');
    const rows = sheet.rows.map(r =>
      sheet.columns.map(c => `"${r.cells[c.id] !== undefined ? r.cells[c.id] : ''}"`).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sutharlabs_sheet_${Date.now()}.csv`;
    link.click();
  };

  const handleSort = (colId: string) => {
    if (sortCol === colId) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colId);
      setSortDir('asc');
    }
  };

  // Filtered and sorted rows
  const displayedRows = [...sheet.rows]
    .filter(r => {
      if (!searchQuery) return true;
      return Object.values(r.cells).some(val =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const valA = a.cells[sortCol];
      const valB = b.cells[sortCol];
      if (valA === valB) return 0;
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      const res = valA > valB ? 1 : -1;
      return sortDir === 'asc' ? res : -res;
    });

  // Calculate summaries for numeric & currency columns
  const columnSummaries = sheet.columns.map(col => {
    if (col.type === 'currency' || col.type === 'number') {
      const sum = sheet.rows.reduce((acc, r) => acc + (Number(r.cells[col.id]) || 0), 0);
      return { id: col.id, sum, type: col.type };
    }
    return null;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Studio Ribbon Toolbar */}
      <div className={`p-2.5 border-b flex items-center justify-between gap-3 font-mono text-xs z-10 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#141418] border-outline/15'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="px-2.5 py-1.5 rounded bg-[#00e476]/15 text-[#00e476] hover:bg-[#00e476]/25 font-bold flex items-center gap-1 border border-[#00e476]/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
          <button
            onClick={handleAddColumn}
            className="px-2.5 py-1.5 rounded bg-[#00dbe7]/15 text-[#74f5ff] hover:bg-[#00dbe7]/25 font-bold flex items-center gap-1 border border-[#00dbe7]/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Column
          </button>
          <div className="h-4 w-px bg-outline/20 mx-1"></div>
          <div className={`flex items-center px-2 py-1 rounded border text-xs ${
            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-surface-container-low border-outline/20 text-white'
          }`}>
            <Search className={`w-3.5 h-3.5 mr-1.5 ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`} />
            <input
              type="text"
              placeholder="Filter grid..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-28 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#ce5dff]/20 text-[#ebb2ff] hover:bg-[#ce5dff]/30 border border-[#ce5dff]/30 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Tabular Matrix Body */}
      <div className={`flex-1 overflow-auto p-4 custom-scrollbar ${isLight ? 'bg-slate-100' : 'bg-[#050507]'}`}>
        <div className={`rounded-lg border overflow-hidden shadow-xl inline-block min-w-full ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0c0c0e] border-outline/20'
        }`}>
          <table className="w-full text-left font-mono text-xs border-collapse">
            {/* Headers */}
            <thead className={`select-none uppercase text-[11px] ${
              isLight ? 'bg-slate-100 text-slate-700 border-b border-slate-200' : 'bg-[#101014] text-on-surface-variant border-b border-outline/15'
            }`}>
              <tr>
                <th className="p-3 w-12 text-center border-b border-r border-outline/15">#</th>
                {sheet.columns.map(col => (
                  <th key={col.id} className="p-2 border-b border-r border-outline/15 font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={col.name}
                        onChange={e => handleUpdateColumnName(col.id, e.target.value)}
                        className="bg-transparent border-none focus:outline-none font-bold text-on-surface text-xs w-full"
                      />
                      <button
                        onClick={() => handleSort(col.id)}
                        className="p-1 rounded hover:bg-white/10 text-on-surface-variant hover:text-white"
                        title="Sort Column"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="p-3 w-12 text-center border-b border-outline/15">Actions</th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody className={`font-mono ${isLight ? 'divide-y divide-slate-200 bg-white' : 'divide-y divide-white/5 bg-[#0c0c0e]'}`}>
              {displayedRows.map((row, rIdx) => (
                <tr key={row.id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-white/[0.02] transition-colors'}>
                  <td className={`p-2 text-center text-[10px] ${isLight ? 'border-r border-slate-200 text-slate-500' : 'border-r border-outline/10 text-on-surface-variant'}`}>
                    {rIdx + 1}
                  </td>
                  {sheet.columns.map(col => (
                    <td key={col.id} className={`p-1 ${isLight ? 'border-r border-slate-200' : 'border-r border-outline/10'}`}>
                      {col.type === 'status' ? (
                        <select
                          value={String(row.cells[col.id] || 'Active')}
                          onChange={e => handleCellChange(row.id, col.id, e.target.value)}
                          className={`w-full py-1 px-2 rounded text-xs font-semibold focus:outline-none ${
                            row.cells[col.id] === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Draft">Draft</option>
                        </select>
                      ) : (
                        <input
                          type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                          value={row.cells[col.id] !== undefined ? row.cells[col.id] : ''}
                          onChange={e => handleCellChange(row.id, col.id, col.type === 'number' || col.type === 'currency' ? Number(e.target.value) : e.target.value)}
                          className={`w-full p-2 bg-transparent border-none focus:outline-none text-xs rounded ${
                            isLight ? 'text-slate-900 focus:bg-slate-100' : 'text-on-surface focus:bg-white/5'
                          }`}
                        />
                      )}
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-red-400 cursor-pointer"
                      title="Delete Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Summary Row */}
              {sheet.showSummaryRow && (
                <tr className={`font-bold ${
                  isLight 
                    ? 'bg-slate-100 border-t-2 border-slate-300 text-slate-900' 
                    : 'bg-[#121218] border-t-2 border-outline/30 text-on-surface'
                }`}>
                  <td className={`p-3 text-center text-[10px] ${
                    isLight ? 'border-r border-slate-200 text-cyan-700' : 'border-r border-outline/10 text-[#00dbe7]'
                  }`}>
                    Σ
                  </td>
                  {sheet.columns.map(col => {
                    const summary = columnSummaries.find(s => s && s.id === col.id);
                    return (
                      <td key={col.id} className={`p-3 text-xs ${isLight ? 'border-r border-slate-200' : 'border-r border-outline/10'}`}>
                        {summary ? (
                          <span className={isLight ? 'text-emerald-700 font-bold' : 'text-[#00e476]'}>
                            {col.type === 'currency' ? `₹ ${summary.sum.toLocaleString('en-IN')}` : summary.sum}
                          </span>
                        ) : (
                          <span className={`${isLight ? 'text-slate-400' : 'text-on-surface-variant'} font-normal italic`}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
