import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import 'dotenv/config';
import { encryptPluginPackage } from '../src/plugins/security/pluginCrypto.ts';

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
    version: '1.1.2',
    category: 'Finance',
    type: 'Native',
    description: 'Enterprise multi-market quantitative trading suite featuring live TradingView charts, algorithmic strategies, visual condition builder, institutional backtesting, and automated trade simulation.',
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
    name: 'Doc Nexus',
    version: '0.3.0',
    category: 'Creativity & Docs',
    type: 'Native',
    description: 'Omni-format creative document processing engine supporting visual vector canvas design, technical markdown & diagrams, paginated executive docs, spreadsheets, and slide presentations.',
    iconSymbol: 'auto_stories',
    minEngineVersion: '0.1.0'
  },
  {
    dirName: 'Accounting',
    id: 'wp_accounting',
    name: 'Accounting',
    version: '0.2.3',
    category: 'Operations',
    type: 'Native',
    description: 'Enterprise Indian GST Accounting, Rule 46 Tax Invoicing, GSTR-1 & GSTR-3B Returns, E-Invoicing (IRN), Double-Entry General Ledger, and Multi-Tenant PostgreSQL Cloud Sync.',
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

      // Encrypt the raw zip archive using AES-256-GCM to prevent exposing source code
      const rawZipBuffer = fs.readFileSync(archiveFilePath);
      const encryptedPackageBuffer = encryptPluginPackage(rawZipBuffer);
      fs.writeFileSync(archiveFilePath, encryptedPackageBuffer);
      console.log(`  [security] Encrypted archive package with AES-256-GCM (Source protected)`);
    } catch (err: any) {
      console.error(`❌ Failed to compress and encrypt ${plugin.id}:`, err.message);
      continue;
    }

    // 3. Compute cryptographic SHA-256 hash of the secured package
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

  // 5. Database Sync
  if ((process.argv.includes('--sync-db') || true) && (process.env.DATABASE_URL || process.env.NEON_DB_URL)) {
    console.log('\n🔄 Syncing package URLs and checksums to Neon PostgreSQL database...');
    try {
      const { getPrismaClient } = await import('../api/_utils.js');
      const prisma = getPrismaClient();

      for (const item of manifestCatalog) {
        await prisma.workspacePluginVersion.upsert({
          where: { pluginId_version: { pluginId: item.id, version: item.version } },
          update: {
            packageUrl: item.packageUrl,
            checksumSha256: item.checksumSha256,
            changelog: item.description
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

        // Also update parent plugin version and description
        await prisma.workspacePlugin.update({
          where: { id: item.id },
          data: {
            version: item.version,
            description: item.description,
            category: item.category,
            iconSymbol: item.iconSymbol
          }
        }).catch(() => {});
      }
      console.log('✅ Database version records synchronized successfully.');
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
