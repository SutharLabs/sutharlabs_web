import React, { useState, useEffect } from 'react';
import { TerminalLog } from '../types';
import { 
  PlusCircle, Trash2, CheckCircle, AlertCircle, UploadCloud, Layers,
  FileCode, Sparkles
} from 'lucide-react';
import CollapsibleLogDrawer from './CollapsibleLogDrawer';

interface ManageProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

interface WorkspacePluginItem {
  id: string;
  name: string;
  version: string;
  category: string;
  type: string;
  iconSymbol: string;
  description: string;
}

export default function ManagePluginsView({ logs, onAddLog, userToken }: ManageProps) {
  const [workspacePlugins, setWorkspacePlugins] = useState<WorkspacePluginItem[]>([]);
  const [selectedPluginFile, setSelectedPluginFile] = useState<File | null>(null);
  const [pluginName, setPluginName] = useState('');
  const [pluginVersion, setPluginVersion] = useState('0.1.0');
  const [pluginCategory, setPluginCategory] = useState('Developer Tools');
  const [pluginDescription, setPluginDescription] = useState('');
  const [pluginChangelog, setPluginChangelog] = useState('');
  const [pluginIcon, setPluginIcon] = useState('extension');
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchWorkspacePlugins = async () => {
    try {
      const res = await fetch('/api/workspace-plugins');
      if (res.ok) {
        const data = await res.json();
        setWorkspacePlugins(data);
      }
    } catch (e) {
      console.error('Failed to load workspace plugins:', e);
    }
  };

  useEffect(() => {
    fetchWorkspacePlugins();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPluginFile(file);
      if (!pluginName) {
        // Auto derive a clean name from filename
        const baseName = file.name.replace(/\.(zip|vsix)$/i, '').replace(/[-_]/g, ' ');
        setPluginName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }
    }
  };

  const handleUploadAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPluginFile && !pluginName) return;

    setIsUploading(true);
    setNotification(null);

    try {
      let checksumSha256: string | undefined;
      let packageUrl: string | undefined;

      // 1. Upload archive file if selected
      if (selectedPluginFile) {
        const formData = new FormData();
        formData.append('pluginFile', selectedPluginFile);

        const uploadRes = await fetch('/api/plugins/upload', {
          method: 'POST',
          body: formData,
          headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || 'Failed to upload archive package.');
        }

        const uploadData = await uploadRes.json();
        checksumSha256 = uploadData.checksumSha256;
        packageUrl = uploadData.packageUrl;
      }

      // 2. Publish to WorkspacePlugin catalog with version & changelog
      const pubRes = await fetch('/api/workspace-plugins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          name: pluginName,
          version: pluginVersion,
          category: pluginCategory,
          type: 'Community',
          description: pluginDescription || `Workspace extension package ${selectedPluginFile?.name || pluginName}.`,
          iconSymbol: pluginIcon || 'extension',
          changelog: pluginChangelog || `Release v${pluginVersion}`,
          checksumSha256,
          packageUrl
        })
      });

      if (!pubRes.ok) {
        const err = await pubRes.json();
        throw new Error(err.error || 'Failed to publish plugin metadata.');
      }

      const created = await pubRes.json();
      setNotification({
        type: 'success',
        message: `Plugin "${created.name}" (v${created.version}) published to workspace catalog.`
      });

        onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `ADMIN: Uploaded and cataloged workspace plugin: ${created.name} v${created.version}`
      });

      // Reset form
      setSelectedPluginFile(null);
      setPluginName('');
      setPluginDescription('');
      setPluginChangelog('');
      setPluginVersion('0.1.0');

      // Refresh list
      await fetchWorkspacePlugins();

    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'An error occurred during plugin installation.'
      });
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `ADMIN: Plugin upload failed: ${err.message}`
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleDeletePlugin = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to unpublish "${name}" from the workspace catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/workspace-plugins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });

      if (res.ok) {
        setNotification({ type: 'success', message: `Unpublished "${name}".` });
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `ADMIN: Removed workspace plugin: ${name}`
        });
        await fetchWorkspacePlugins();
      } else {
        const err = await res.json();
        setNotification({ type: 'error', message: err.error || 'Failed to delete plugin.' });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Network error deleting plugin.' });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00dbe7]/10 border border-[#00dbe7]/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#00dbe7] text-2xl">extension</span>
          </div>
          <div>
            <h2 className="text-xl font-sans font-bold text-on-surface">Workspace Plugin Administration</h2>
            <p className="text-xs text-on-surface-variant font-mono">
              Deploy and maintain extensions available across all workspace developer accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#00e476]/10 text-[#00e476] border border-[#00e476]/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e476] animate-pulse"></span>
            {workspacePlugins.length} Active in Catalog
          </span>
        </div>
      </div>

      {notification && (
        <div className={`p-3.5 rounded text-xs font-mono flex items-center gap-2.5 border transition-all ${
          notification.type === 'success' 
            ? 'bg-[#00e476]/10 border-[#00fb83]/30 text-[#00e476]' 
            : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Upload & Package Installation Form */}
      <div className="glass-panel p-5 sm:p-6 rounded-xl border border-outline/30 bg-surface-container-low/40">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface mb-4">
          <PlusCircle className="w-4 h-4 text-[#00dbe7]" />
          <span>Upload & Package Workspace Extension</span>
        </div>

        <form onSubmit={handleUploadAndPublish} className="space-y-4">
          {/* File Upload Drop Area */}
          <div className="border border-dashed border-outline/40 hover:border-[#00dbe7]/60 rounded-lg p-5 transition-colors bg-[#0e0e10]/60 text-center flex flex-col items-center justify-center gap-2 cursor-pointer relative">
            <UploadCloud className="w-8 h-8 text-[#00dbe7]/80" />
            <div>
              <span className="text-xs font-semibold text-on-surface block">
                {selectedPluginFile ? selectedPluginFile.name : 'Choose a .zip or .vsix plugin package'}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant block mt-0.5">
                {selectedPluginFile 
                  ? `${(selectedPluginFile.size / 1024).toFixed(1)} KB — Ready to deploy` 
                  : 'Packages must contain manifest.json and root entry point'}
              </span>
            </div>
            <input 
              type="file" 
              accept=".zip,.vsix" 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">Plugin Name</label>
              <input
                type="text"
                placeholder="e.g. Docker Inspector"
                value={pluginName}
                onChange={(e) => setPluginName(e.target.value)}
                required
                className="w-full bg-[#131315] border border-outline/40 rounded px-3 py-1.5 text-xs text-on-surface focus:border-[#00dbe7] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">Category</label>
              <select
                value={pluginCategory}
                onChange={(e) => setPluginCategory(e.target.value)}
                className="w-full bg-[#131315] border border-outline/40 rounded px-3 py-1.5 text-xs text-on-surface focus:border-[#00dbe7] outline-none cursor-pointer"
              >
                <option value="Finance">Finance</option>
                <option value="Architecture">Architecture</option>
                <option value="Documentation">Documentation</option>
                <option value="Operations">Operations</option>
                <option value="Developer Tools">Developer Tools</option>
                <option value="AI / ML">AI / ML</option>
                <option value="Security">Security</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">Version</label>
              <input
                type="text"
                placeholder="1.0.0"
                value={pluginVersion}
                onChange={(e) => setPluginVersion(e.target.value)}
                className="w-full bg-[#131315] border border-outline/40 rounded px-3 py-1.5 text-xs text-on-surface focus:border-[#00dbe7] outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">Icon Symbol (Material)</label>
              <input
                type="text"
                placeholder="extension"
                value={pluginIcon}
                onChange={(e) => setPluginIcon(e.target.value)}
                className="w-full bg-[#131315] border border-outline/40 rounded px-3 py-1.5 text-xs text-on-surface focus:border-[#00dbe7] outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">Description</label>
            <input
              type="text"
              placeholder="Brief description of the extension capabilities..."
              value={pluginDescription}
              onChange={(e) => setPluginDescription(e.target.value)}
              className="w-full bg-[#131315] border border-outline/40 rounded px-3 py-1.5 text-xs text-on-surface focus:border-[#00dbe7] outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">Release Notes / Changelog (Markdown)</label>
            <textarea
              rows={2}
              placeholder="e.g. Initial v0.1.0 release with real-time analytics and workspace integration."
              value={pluginChangelog}
              onChange={(e) => setPluginChangelog(e.target.value)}
              className="w-full bg-[#131315] border border-outline/40 rounded px-3 py-1.5 text-xs text-on-surface focus:border-[#00dbe7] outline-none font-mono resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUploading || (!selectedPluginFile && !pluginName)}
              className="py-2 px-5 rounded bg-[#00dbe7] text-[#002022] font-mono font-bold text-xs uppercase flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Deploying Package...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Publish to Catalog</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Currently Available Plugins Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#74f5ff]" />
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
              Available Workspace Extensions ({workspacePlugins.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-on-surface-variant">
            All users can install these from the Plugin Store
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspacePlugins.map((wp) => (
            <div 
              key={wp.id} 
              className="glass-panel p-5 rounded-xl border border-outline/30 bg-[#131315]/80 hover:border-[#00dbe7]/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-[#0e0e10] border border-outline/50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#00dbe7] text-2xl">
                        {wp.iconSymbol || 'extension'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-on-surface group-hover:text-[#74f5ff] transition-colors">
                        {wp.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase px-2 py-0.5 bg-surface-container-low rounded border border-outline/30">
                          {wp.category}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          v{wp.version}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          wp.type === 'Native' 
                            ? 'bg-[#00e476]/10 text-[#00e476] border border-[#00e476]/20' 
                            : 'bg-[#ce5dff]/10 text-[#ebb2ff] border border-[#ce5dff]/20'
                        }`}>
                          {wp.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePlugin(wp.id, wp.name)}
                    title="Remove from Catalog"
                    className="p-1.5 rounded text-on-surface-variant hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#b9cacb] leading-relaxed mt-3 line-clamp-2">
                  {wp.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-outline/20 flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                <span className="flex items-center gap-1.5 text-[#00e476]">
                  <CheckCircle className="w-3.5 h-3.5" /> Published in Store
                </span>
                <span className="text-gray-500 truncate max-w-[150px]">
                  ID: {wp.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CollapsibleLogDrawer
        title="PLUGIN REGISTRY AUDIT LOG"
        logs={logs}
        defaultExpanded={false}
      />
    </div>
  );
}
