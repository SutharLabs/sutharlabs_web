import React, { useState, useEffect } from 'react';
import { TerminalLog } from '../types';
import { Globe, ExternalLink, Code2, Save, Edit3, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

interface ManageProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

export default function ManagePortfoliosView({ logs, onAddLog, userToken }: ManageProps) {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/portfolios')
      .then(res => res.json())
      .then(data => {
        setPortfolios(data);
        setEditData(JSON.parse(JSON.stringify(data)));
      })
      .catch(console.error);
  }, []);

  const handleSave = async (idToSave: string) => {
    try {
      const payload = editData.filter(p => p.id && p.title); // Filter out invalid ones
      const response = await fetch('/api/portfolios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setPortfolios(JSON.parse(JSON.stringify(payload)));
        setEditingId(null);
        onAddLog({ timestamp: new Date().toLocaleTimeString(), type: 'SUCCESS', message: `ADMIN: Portfolio entry successfully updated and synced.` });
      } else {
        alert('Failed to save portfolio');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server.');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(JSON.parse(JSON.stringify(portfolios)));
  };

  const handleChange = (id: string, field: string, value: string) => {
    setEditData(prev => prev.map(p => {
      if (p.id === id) {
        if (field === 'techs') {
          return { ...p, techs: value.split(',').map(t => t.trim()).filter(Boolean) };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this project?')) return;
    const payload = portfolios.filter(p => p.id !== id);
    try {
      const response = await fetch('/api/portfolios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setPortfolios(payload);
        setEditData(JSON.parse(JSON.stringify(payload)));
        onAddLog({ timestamp: new Date().toLocaleTimeString(), type: 'ALERT', message: `ADMIN: Portfolio project entry deleted.` });
      } else {
        alert('Failed to delete portfolio');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server.');
    }
  };

  const handleAddNew = () => {
    const newId = `proj_${Date.now()}`;
    const newProj = {
      id: newId,
      title: '',
      segment: 'Web Dev',
      description: '',
      detailedCase: '',
      stat: '',
      statLabel: '',
      techs: [],
      client: '',
      clientTitle: '',
      blueprintSymbol: 'globe',
      imageSrc: ''
    };
    setEditData([newProj, ...editData]);
    setEditingId(newId);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="glass-panel p-6 rounded-lg border border-[#3a494b]/20 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-[#3a494b]/20 pb-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ce5dff] text-2xl">web</span>
            <div>
              <h3 className="text-[#e5e1e4] font-bold">Development Portfolio</h3>
              <p className="text-[10px] font-mono text-[#849495]">Manage SutharLabs service credibility projects</p>
            </div>
          </div>
          <div>
            {!editingId && (
              <button onClick={handleAddNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ce5dff] text-black border border-[#ce5dff] rounded text-xs font-bold hover:brightness-110 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add Project
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editData.map(p => {
            const isEditing = editingId === p.id;
            return (
              <div key={p.id} className={`p-5 bg-[#131315] border ${isEditing ? 'border-[#ce5dff] shadow-[0_0_15px_rgba(206,93,255,0.15)]' : 'border-[#3a494b]/30 hover:border-[#ce5dff]/50'} rounded-xl transition-all group flex flex-col gap-3 relative`}>
                
                {/* Actions overlay */}
                {!isEditing && editingId === null && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingId(p.id)} className="p-1.5 bg-[#1b1b1f] border border-[#3a494b]/40 rounded hover:text-[#ce5dff] hover:border-[#ce5dff]/50 transition-all cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-[#1b1b1f] border border-[#3a494b]/40 rounded hover:text-red-400 hover:border-red-400/50 transition-all cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-start gap-2 pr-16">
                  <div className="flex items-center gap-2 flex-1">
                    {isEditing ? (
                      <input type="text" value={p.blueprintSymbol} onChange={e => handleChange(p.id, 'blueprintSymbol', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-1 py-1 text-xs text-center text-white w-8" placeholder="Icon" title="Material Symbol name" />
                    ) : (
                      <span className="material-symbols-outlined text-[#ce5dff] text-xl flex-shrink-0">{p.blueprintSymbol || 'globe'}</span>
                    )}
                    
                    {isEditing ? (
                      <input type="text" value={p.title} onChange={e => handleChange(p.id, 'title', e.target.value)} className="bg-[#1b1b1f] border border-[#ce5dff]/50 rounded px-2 py-1 text-xs text-white w-full font-bold focus:outline-none focus:border-[#ce5dff]" placeholder="Project Title" />
                    ) : (
                      <h4 className="text-[#e5e1e4] font-bold text-sm">{p.title}</h4>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <input type="text" value={p.segment} onChange={e => handleChange(p.id, 'segment', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] font-mono text-white w-full" placeholder="Segment (e.g. Web Dev, AI)" />
                ) : (
                  <div className="self-start px-2 py-0.5 rounded text-[9px] font-mono border whitespace-nowrap bg-[#ce5dff]/10 text-[#ebb2ff] border-[#ce5dff]/30">
                    {p.segment}
                  </div>
                )}
                
                <div className="space-y-3 text-xs flex-1 mt-2">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-[9px] text-[#849495] uppercase tracking-wider block mb-1">Short Description</label>
                        <textarea value={p.description || ''} onChange={e => handleChange(p.id, 'description', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] text-gray-300 w-full h-12 resize-none custom-scrollbar" placeholder="Short intro..." />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#849495] uppercase tracking-wider block mb-1">Detailed Case Study</label>
                        <textarea value={p.detailedCase || ''} onChange={e => handleChange(p.id, 'detailedCase', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] text-gray-300 w-full h-20 resize-none custom-scrollbar" placeholder="Full details..." />
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-gray-400 line-clamp-3">{p.detailedCase || p.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-[#3a494b]/10">
                    <span className="text-[#849495] flex items-center gap-1 w-16"><Globe className="w-3 h-3"/> Link</span>
                    {isEditing ? (
                      <input type="text" value={p.stat || ''} onChange={e => handleChange(p.id, 'stat', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] text-white flex-1" placeholder="URL stat (e.g. Live at domain.com)" />
                    ) : (
                      <span className="text-[#00e476] font-mono text-[10px]">{p.stat}</span>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[#849495] flex items-center gap-1 w-16 text-[9px] uppercase tracking-wider">Stat Label</span>
                      <input type="text" value={p.statLabel || ''} onChange={e => handleChange(p.id, 'statLabel', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] text-white flex-1" placeholder="Corporate marketing platform" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[#849495] flex items-center gap-1 w-16"><Code2 className="w-3 h-3"/> Stack</span>
                    {isEditing ? (
                      <input type="text" value={(p.techs || []).join(', ')} onChange={e => handleChange(p.id, 'techs', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] font-mono text-white flex-1" placeholder="React, Node.js, etc" />
                    ) : (
                      <span className="text-gray-300 font-mono text-[10px] truncate block w-full" title={(p.techs || []).join(', ')}>
                        {(p.techs || []).join(' • ')}
                      </span>
                    )}
                  </div>

                  {isEditing && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#3a494b]/10">
                      <div>
                        <label className="text-[9px] text-[#849495] uppercase tracking-wider block mb-1">Client Name</label>
                        <input type="text" value={p.client || ''} onChange={e => handleChange(p.id, 'client', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] text-white w-full" />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#849495] uppercase tracking-wider block mb-1">Client Title</label>
                        <input type="text" value={p.clientTitle || ''} onChange={e => handleChange(p.id, 'clientTitle', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] text-white w-full" />
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex items-center gap-2 pt-2 border-t border-[#3a494b]/10">
                      <span className="text-[#849495] flex items-center gap-1 w-16"><ImageIcon className="w-3 h-3"/> Image</span>
                      <input type="text" value={p.imageSrc || ''} onChange={e => handleChange(p.id, 'imageSrc', e.target.value)} className="bg-[#1b1b1f] border border-[#3a494b]/40 rounded px-2 py-1 text-[10px] text-white flex-1" placeholder="Image URL (e.g. /my_img.png)" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#3a494b]/20 mt-4">
                      <button onClick={handleCancel} className="px-3 py-1.5 text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer">Cancel</button>
                      <button onClick={() => handleSave(p.id)} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#ce5dff] text-black rounded text-xs font-bold hover:brightness-110 transition-all cursor-pointer">
                        <Save className="w-3.5 h-3.5" /> Save Entry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
