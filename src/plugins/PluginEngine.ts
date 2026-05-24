import path from 'path';
import fs from 'fs/promises';
import { Application, Router } from 'express';

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  main: string; // usually server.mjs
}

export class PluginEngine {
  private app: Application;
  private pluginsDir: string;
  private activePlugins: Map<string, any> = new Map();

  constructor(app: Application) {
    this.app = app;
    this.pluginsDir = path.join(process.cwd(), 'installed_plugins');
  }

  async initialize() {
    // Ensure directory exists
    try {
      await fs.mkdir(this.pluginsDir, { recursive: true });
    } catch (e) {
      // ignore
    }

    await this.loadAllPlugins();
  }

  async loadAllPlugins() {
    try {
      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPlugin(entry.name);
        }
      }
    } catch (err) {
      console.error('[PluginEngine] Error reading plugins directory:', err);
    }
  }

  async loadPlugin(pluginId: string) {
    if (this.activePlugins.has(pluginId)) {
      console.log(`[PluginEngine] Plugin ${pluginId} is already loaded.`);
      return;
    }

    try {
      const pluginPath = path.join(this.pluginsDir, pluginId);
      const manifestPath = path.join(pluginPath, 'manifest.json');
      
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      const serverModulePath = path.join(pluginPath, manifest.main || 'server.mjs');
      
      // Convert to file:// URL for Windows compatibility with dynamic import
      const moduleUrl = `file://${serverModulePath.replace(/\\\\/g, '/')}`;
      
      console.log(`[PluginEngine] Loading plugin module from ${moduleUrl}...`);
      const pluginModule = await import(moduleUrl);

      // Create a sub-router for this plugin
      const pluginRouter = Router();
      
      if (pluginModule.activate) {
        await pluginModule.activate({
          router: pluginRouter,
          pluginId: manifest.id,
          // pass database or other shared resources here
        });
      }

      // Mount the plugin's router
      this.app.use(`/api/plugins/${manifest.id}`, pluginRouter);
      
      this.activePlugins.set(pluginId, pluginModule);
      console.log(`[PluginEngine] Successfully activated plugin: ${manifest.name} (${manifest.version})`);

    } catch (err) {
      console.error(`[PluginEngine] Failed to load plugin ${pluginId}:`, err);
    }
  }

  async unloadPlugin(pluginId: string) {
    const pluginModule = this.activePlugins.get(pluginId);
    if (!pluginModule) return;

    try {
      if (pluginModule.deactivate) {
        await pluginModule.deactivate();
      }
      this.activePlugins.delete(pluginId);
      
      // Note: In Express, dynamically removing a mounted router is tricky.
      // Usually requires replacing the router array or restarting the server.
      // For a true hot-reload, we would use a root router wrapper.
      console.log(`[PluginEngine] Deactivated plugin: ${pluginId}. Note: routes may remain active until restart.`);
    } catch (err) {
      console.error(`[PluginEngine] Failed to deactivate plugin ${pluginId}:`, err);
    }
  }
}
