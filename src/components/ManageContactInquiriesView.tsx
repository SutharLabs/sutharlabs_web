import React, { useState, useEffect } from 'react';
import { TerminalLog, ContactInquiryItem } from '../types';
import { 
  Mail, MessageSquare, Clock, CheckCircle2, AlertCircle, RefreshCw,
  Search, Trash2, Send, ExternalLink, Filter, ShieldCheck, ChevronDown,
  Building, User, Calendar, FileText, Check, Tag
} from 'lucide-react';
import CollapsibleLogDrawer from './CollapsibleLogDrawer';

interface ManageContactInquiriesProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

interface InquiriesStats {
  total: number;
  newCount: number;
  inProgressCount: number;
  contactedCount: number;
  closedCount: number;
}

const PROJECT_TYPE_COLORS: Record<string, string> = {
  'Web Application Dev': 'bg-cyan-500/10 text-cyan-600 dark:text-[#00dbe7] border-cyan-500/30',
  'Mobile App Dev (React Native)': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Agentic AI Workflows': 'bg-purple-500/10 text-purple-600 dark:text-[#ce5dff] border-purple-500/30',
  'MCP Server Integration': 'bg-emerald-500/10 text-emerald-600 dark:text-[#00e476] border-emerald-500/30',
  'Other Complex Systems': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
};

const STATUS_OPTIONS = ['New', 'Contacted', 'In Progress', 'Closed', 'Archived'];

export default function ManageContactInquiriesView({ logs, onAddLog, userToken }: ManageContactInquiriesProps) {
  const [inquiries, setInquiries] = useState<ContactInquiryItem[]>([]);
  const [stats, setStats] = useState<InquiriesStats>({
    total: 0,
    newCount: 0,
    inProgressCount: 0,
    contactedCount: 0,
    closedCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryItem | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'alert' | 'error'; message: string } | null>(null);

  const notify = (message: string, type: 'success' | 'alert' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/admin/contact-inquiries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
        if (data.stats) setStats(data.stats);
      } else {
        notify('Failed to load contact inquiries', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching contact inquiries:', err);
      notify('Network error fetching contact inquiries', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [selectedStatus]);

  // Sync draft note when an inquiry is selected
  useEffect(() => {
    if (selectedInquiry) {
      setNoteDraft(selectedInquiry.notes || '');
    }
  }, [selectedInquiry]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInquiries();
  };

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoadingKey(`status_${id}`);
      const res = await fetch(`/api/admin/contact-inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setInquiries(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        if (selectedInquiry?.id === id) {
          setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
        }
        notify(`Inquiry updated to status: ${newStatus}`, 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'INFO',
          message: `ADMIN: Contact inquiry ${updated.trackingId} moved to "${newStatus}"`
        });
        // Refresh counts
        const countRes = await fetch('/api/admin/contact-inquiries', {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        if (countRes.ok) {
          const countData = await countRes.json();
          if (countData.stats) setStats(countData.stats);
        }
      } else {
        notify('Failed to update inquiry status', 'error');
      }
    } catch (e) {
      notify('Network error updating status', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Save Internal Follow-up Notes
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    try {
      setIsSavingNote(true);
      const res = await fetch(`/api/admin/contact-inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ notes: noteDraft })
      });

      if (res.ok) {
        const updated = await res.json();
        setInquiries(prev => prev.map(item => item.id === selectedInquiry.id ? { ...item, notes: noteDraft } : item));
        setSelectedInquiry(prev => prev ? { ...prev, notes: noteDraft } : null);
        notify('Internal consultation notes saved', 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'INFO',
          message: `ADMIN: Saved follow-up notes on inquiry ${updated.trackingId}`
        });
      } else {
        notify('Failed to save notes', 'error');
      }
    } catch (e) {
      notify('Network error saving notes', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (id: string, trackingId: string) => {
    if (!window.confirm(`Are you sure you want to delete inquiry "${trackingId}"? This cannot be undone.`)) {
      return;
    }

    try {
      setActionLoadingKey(`delete_${id}`);
      const res = await fetch(`/api/admin/contact-inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.ok) {
        setInquiries(prev => prev.filter(item => item.id !== id));
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
        notify(`Inquiry ${trackingId} deleted`, 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `ADMIN: Removed contact inquiry ${trackingId}`
        });
      } else {
        notify('Failed to delete inquiry', 'error');
      }
    } catch (e) {
      notify('Network error deleting inquiry', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Test Email Routing
  const handleTestEmailRouting = async (id: string, trackingId: string) => {
    try {
      setActionLoadingKey(`email_${id}`);
      const res = await fetch(`/api/admin/contact-inquiries/${id}/test-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.ok) {
        const result = await res.json();
        notify(`Email dispatch triggered: ${result.method} -> ${result.recipient}`, 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `ADMIN: Email notification routed for ${trackingId} to ${result.recipient}`
        });
      } else {
        notify('Failed to route email notification', 'error');
      }
    } catch (e) {
      notify('Network error testing email route', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full space-y-6">
      
      {/* Toast notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2.5 border transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-[#00e476]'
            : notification.type === 'alert'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-[#ffb4ab]'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-[#00e476]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary dark:text-[#00dbe7]" />
          </div>
          <div>
            <h2 className="text-xl font-sans font-bold text-on-surface">Client Consultations &amp; Leads</h2>
            <p className="text-xs text-on-surface-variant font-mono">
              Inbound project specifications submitted through the SutharLabs contact portal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInquiries}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl border border-outline/30 hover:border-primary text-xs font-mono text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1.5 cursor-pointer bg-surface-container-low"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-[#ce5dff] border border-purple-500/30 flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-[#ce5dff] animate-pulse"></span>
            Email Dispatcher Ready
          </span>
        </div>
      </div>

      {/* Stats Pipeline Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div 
          onClick={() => setSelectedStatus('All')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'All' 
              ? 'bg-primary/10 border-primary/50 shadow-sm' 
              : 'bg-surface dark:bg-surface-container-low/40 border-outline/20 hover:border-outline/40'
          }`}
        >
          <span className="text-[10px] text-on-surface-variant block uppercase">Total Leads</span>
          <span className="text-xl font-bold text-on-surface">{stats.total}</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('New')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'New' 
              ? 'bg-cyan-500/15 border-cyan-500/50 shadow-sm' 
              : 'bg-surface dark:bg-surface-container-low/40 border-outline/20 hover:border-outline/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant block uppercase">New / Unread</span>
            {stats.newCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            )}
          </div>
          <span className="text-xl font-bold text-cyan-600 dark:text-[#00dbe7]">{stats.newCount}</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('In Progress')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'In Progress' 
              ? 'bg-purple-500/15 border-purple-500/50 shadow-sm' 
              : 'bg-surface dark:bg-surface-container-low/40 border-outline/20 hover:border-outline/40'
          }`}
        >
          <span className="text-[10px] text-on-surface-variant block uppercase">In Progress</span>
          <span className="text-xl font-bold text-purple-600 dark:text-[#ce5dff]">{stats.inProgressCount}</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('Contacted')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'Contacted' 
              ? 'bg-amber-500/15 border-amber-500/50 shadow-sm' 
              : 'bg-surface dark:bg-surface-container-low/40 border-outline/20 hover:border-outline/40'
          }`}
        >
          <span className="text-[10px] text-on-surface-variant block uppercase">Contacted</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.contactedCount}</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('Closed')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'Closed' 
              ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm' 
              : 'bg-surface dark:bg-surface-container-low/40 border-outline/20 hover:border-outline/40'
          }`}
        >
          <span className="text-[10px] text-on-surface-variant block uppercase">Closed</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-[#00e476]">{stats.closedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, tracking ID, keyword..."
            className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl pl-9 pr-20 py-2 text-xs font-mono text-on-surface outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-[10px] font-mono text-on-surface uppercase cursor-pointer"
          >
            Find
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide text-xs font-mono">
          <span className="text-[10px] text-on-surface-variant uppercase px-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {['All', ...STATUS_OPTIONS].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Inquiries List + Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Inquiries List Cards */}
        <div className={`space-y-3 ${selectedInquiry ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {isLoading && inquiries.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span>Loading consultation inquiries...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-12 rounded-3xl border border-outline/20 bg-surface-container-low/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-on-surface">No Consultation Inquiries Found</h4>
              <p className="text-xs text-on-surface-variant font-mono max-w-sm mx-auto">
                {searchTerm || selectedStatus !== 'All' 
                  ? 'Try broadening your search criteria or resetting the status filter.' 
                  : 'New client inquiries submitted via the landing page contact form will appear here.'}
              </p>
            </div>
          ) : (
            inquiries.map((inq) => {
              const isSelected = selectedInquiry?.id === inq.id;
              const projectColorClass = PROJECT_TYPE_COLORS[inq.projectType] || 'bg-surface-container text-on-surface border-outline/30';
              
              return (
                <div
                  key={inq.id}
                  onClick={() => setSelectedInquiry(inq)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-surface dark:bg-surface-container-low/80 border-primary shadow-md'
                      : 'bg-surface dark:bg-[#131315]/80 border-outline/25 hover:border-primary/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-low border border-outline/20 flex items-center justify-center text-sm font-bold font-mono text-primary uppercase shrink-0">
                        {inq.name.charAt(0)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                            {inq.name}
                          </h4>
                          <span className="font-mono text-[10px] text-primary dark:text-[#00dbe7] font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                            {inq.trackingId}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${projectColorClass}`}>
                            {inq.projectType}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-on-surface-variant mt-0.5">
                          {inq.email}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        inq.status === 'New'
                          ? 'bg-cyan-500/15 text-cyan-600 dark:text-[#00dbe7] border border-cyan-500/30'
                          : inq.status === 'In Progress'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-[#ce5dff] border border-purple-500/30'
                          : inq.status === 'Contacted'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-[#00e476] border border-emerald-500/30'
                      }`}>
                        {inq.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed mt-3 line-clamp-2 pl-12 font-sans">
                    {inq.message}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-outline/10 flex items-center justify-between text-[10px] font-mono text-on-surface-variant/70 pl-12">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(inq.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {inq.notes && (
                      <span className="flex items-center gap-1 text-primary">
                        <FileText className="w-3 h-3" /> Notes Attached
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: In-Depth Inquiry Management Detail Drawer */}
        {selectedInquiry && (
          <div className="lg:col-span-5 rounded-3xl border border-outline/25 bg-surface dark:bg-[#131315]/95 shadow-xl p-6 space-y-5 sticky top-4">
            
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-outline/15">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-primary/10 text-primary border border-primary/30">
                    {selectedInquiry.trackingId}
                  </span>
                  <span className="text-xs font-mono text-on-surface-variant">
                    {new Date(selectedInquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mt-1">{selectedInquiry.name}</h3>
                <a 
                  href={`mailto:${selectedInquiry.email}?subject=Re: SutharLabs Consultation [${selectedInquiry.trackingId}]`}
                  className="font-mono text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{selectedInquiry.email}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Status Switcher */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-on-surface-variant font-semibold block">
                Lead Pipeline Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                {STATUS_OPTIONS.slice(0, 4).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(selectedInquiry.id, st)}
                    disabled={actionLoadingKey === `status_${selectedInquiry.id}`}
                    className={`py-1.5 px-2 rounded-xl border transition-all cursor-pointer text-center font-bold ${
                      selectedInquiry.status === st
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-outline/20'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Parameters Overview */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant uppercase text-[10px] font-bold">Target Parameter</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PROJECT_TYPE_COLORS[selectedInquiry.projectType] || ''}`}>
                  {selectedInquiry.projectType}
                </span>
              </div>
              <div className="text-xs font-sans text-on-surface leading-relaxed whitespace-pre-wrap pt-1">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase text-on-surface-variant font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-secondary" />
                  <span>Private Follow-up Notes (Admin Only)</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                placeholder="Record discovery call notes, proposal parameters, or pricing estimates..."
                className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl p-3 text-xs font-sans text-on-surface outline-none focus:border-primary resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNote}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold uppercase cursor-pointer hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-outline/15 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleTestEmailRouting(selectedInquiry.id, selectedInquiry.trackingId)}
                disabled={actionLoadingKey === `email_${selectedInquiry.id}`}
                className="px-3 py-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Send notification payload to admin email"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Email Test</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteInquiry(selectedInquiry.id, selectedInquiry.trackingId)}
                disabled={actionLoadingKey === `delete_${selectedInquiry.id}`}
                className="p-2 rounded-xl text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete Inquiry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

      <CollapsibleLogDrawer
        title="CLIENT CONSULTATION AUDIT LOG"
        logs={logs}
        defaultExpanded={false}
      />
    </div>
  );
}
