import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import 'dotenv/config';

interface PluginConfig {
  dirName: string;
  id: string;
  name: string;
  version: string;
  category: string;
  type: string;
  description: string;
  iconSymbol: string;
  minEngineVersion: string;
}

const IN_TREE_PLUGINS: PluginConfig[] = [
  {
    dirName: 'StockTracker',
    id: 'wp_stock_analyzer',
    name: 'Stock Tracker',
    version: '0.5.0',
    category: 'Finance',
    type: 'Native',
    description: 'Professional quantitative trading suite: interactive TradingView charts, drag-resizable split-pane workspace, multi-market global universes (India, US, Europe, Asia), pluggable algorithmic strategy engine (IStrategy), visual condition builder, real-time news & dual AI sentiment analysis, and high-performance quantitative backtesting engine with localized friction & statutory tax modeling (STT, SEC, GST, SDRT, slippage).',
    iconSymbol: 'monitoring',
    minEngineVersion: '0.1.0'
  },

  {
    dirName: 'FlowDesigner',
    id: 'wp_flow_designer',
    name: 'Interactive System Architecture Canvas',
    version: '0.1.0',
    category: 'Architecture',
    type: 'Native',
    description: 'Interactive canvas for architectural node topologies, microservices modeling, and JSON state import/export.',
    iconSymbol: 'account_tree',
    minEngineVersion: '0.1.0'
  },
  {
    dirName: 'DocNexus',
    id: 'wp_doc_nexus',
    name: 'Markdown Documentation & Knowledge Base',
    version: '0.1.0',
    category: 'Documentation',
    type: 'Native',
    description: 'Collaborative split-pane markdown documentation editor with live render, code snippet styling, and cloud persistence.',
    iconSymbol: 'description',
    minEngineVersion: '0.1.0'
  },
  {
    dirName: 'Accounting',
    id: 'wp_accounting',
    name: 'Financial Ledger & Invoice Engine',
    version: '0.1.0',
    category: 'Finance',
    type: 'Native',
    description: 'Financial ledger, invoicing, daily transaction sequences, and balance auditing.',
    iconSymbol: 'currency_exchange',
    minEngineVersion: '0.1.0'
  }
];

async function packageAllPlugins() {
  const rootDir = process.cwd();
  const pluginsSrcDir = path.join(rootDir, 'src', 'plugins');
  const storageDir = path.join(rootDir, 'storage', 'plugins');

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  console.log('📦 Starting Plugin Packaging & Version Integrity Pipeline...');
  console.log(`📂 Output Directory: ${storageDir}\n`);

  const manifestCatalog: any[] = [];

  for (const plugin of IN_TREE_PLUGINS) {
    const pluginDir = path.join(pluginsSrcDir, plugin.dirName);
    if (!fs.existsSync(pluginDir)) {
      console.warn(`⚠️ Warning: Plugin source directory not found: ${pluginDir}`);
      continue;
    }

    // 1. Generate or update manifest.json in the plugin directory
    const manifestPath = path.join(pluginDir, 'manifest.json');
    const manifestContent = {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      category: plugin.category,
      type: plugin.type,
      description: plugin.description,
      iconSymbol: plugin.iconSymbol,
      main: 'index.ts',
      minEngineVersion: plugin.minEngineVersion,
      packagedAt: new Date().toISOString()
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2), 'utf-8');
    console.log(`  [manifest] Generated ${plugin.id}/manifest.json (v${plugin.version})`);

    // 2. Archive package (.zip)
    const archiveFileName = `${plugin.id}-v${plugin.version}.zip`;
    const archiveFilePath = path.join(storageDir, archiveFileName);

    if (fs.existsSync(archiveFilePath)) {
      fs.unlinkSync(archiveFilePath);
    }

    try {
      // Create zip archive using PowerShell Compress-Archive
      const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${pluginDir}\\*' -DestinationPath '${archiveFilePath}' -Force"`;
      execSync(psCommand, { stdio: 'pipe' });
    } catch (err: any) {
      console.error(`❌ Failed to compress ${plugin.id}:`, err.message);
      continue;
    }

    // 3. Compute cryptographic SHA-256 hash
    const fileBuffer = fs.readFileSync(archiveFilePath);
    const checksumSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileStats = fs.statSync(archiveFilePath);
    const packageUrl = `/storage/plugins/${archiveFileName}`;

    console.log(`  [package]  ${archiveFileName} (${(fileStats.size / 1024).toFixed(1)} KB)`);
    console.log(`  [sha-256]  ${checksumSha256}\n`);

    manifestCatalog.push({
      ...manifestContent,
      archiveFileName,
      packageUrl,
      sizeBytes: fileStats.size,
      checksumSha256
    });
  }

  // 4. Save consolidated catalog manifest
  const catalogPath = path.join(storageDir, 'catalog-manifest.json');
  fs.writeFileSync(catalogPath, JSON.stringify(manifestCatalog, null, 2), 'utf-8');
  console.log(`✅ Saved catalog manifest: ${catalogPath}`);

  // 5. Optional DB Sync
  if (process.argv.includes('--sync-db') && process.env.DATABASE_URL) {
    console.log('\n🔄 Syncing package URLs and checksums to Neon PostgreSQL database...');
    try {
      const { PrismaClient } = await import('@prisma/client');
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const pg = await import('pg');

      const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
      const adapter = new PrismaPg(pool);
      const prisma = new PrismaClient({ adapter });

      for (const item of manifestCatalog) {
        await prisma.workspacePluginVersion.upsert({
          where: { pluginId_version: { pluginId: item.id, version: item.version } },
          update: {
            packageUrl: item.packageUrl,
            checksumSha256: item.checksumSha256
          },
          create: {
            pluginId: item.id,
            version: item.version,
            changelog: item.description,
            packageUrl: item.packageUrl,
            checksumSha256: item.checksumSha256,
            minEngineVersion: item.minEngineVersion,
            publishedBy: 'Suthar Suresh'
          }
        });
      }
      console.log('✅ Database version records synchronized successfully.');
      await prisma.$disconnect();
    } catch (e: any) {
      console.error('❌ Database sync failed:', e.message);
    }
  }

  console.log('\n🎉 Plugin packaging pipeline complete!');
}

packageAllPlugins().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
