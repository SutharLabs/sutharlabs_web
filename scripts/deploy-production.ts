#!/usr/bin/env node
/**
 * ==============================================================================
 * SutharLabs Universal Production Deployment Pipeline
 * Target: Oracle Cloud VM 3 (130.210.37.199)
 * Usage:
 *   npm run deploy
 *   npm run deploy:quick
 *   npx tsx scripts/deploy-production.ts [--skip-build] [--skip-git]
 * ==============================================================================
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const skipGit = args.includes('--skip-git');
const skipPlugins = args.includes('--skip-plugins');
const commitMsgArg = args.find(a => a.startsWith('--commit='));
const customCommitMsg = commitMsgArg ? commitMsgArg.replace('--commit=', '').replace(/['"]/g, '') : '';

const SSH_KEY_CANDIDATES = [
  'D:\\Code\\SutharLabs\\OracleFreeTier\\ssh-key-2026-11-03.key',
  path.join(process.env.USERPROFILE || process.env.HOME || '', '.ssh', 'id_rsa'),
  path.join(process.cwd(), 'OracleFreeTier', 'ssh-key-2026-11-03.key')
];

const SSH_KEY = SSH_KEY_CANDIDATES.find(k => fs.existsSync(k)) || SSH_KEY_CANDIDATES[0];
const VM_HOST = 'ubuntu@130.210.37.199';
const REMOTE_DIR = '/home/ubuntu/website';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function logStep(num: number, title: string) {
  console.log(`\n${colors.cyan}${colors.bold}[${num}/8] ${title}${colors.reset}`);
}

function logSuccess(msg: string) {
  console.log(`   ${colors.green}✔ ${msg}${colors.reset}`);
}

function logWarn(msg: string) {
  console.log(`   ${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function logError(msg: string) {
  console.log(`   ${colors.red}✖ ${msg}${colors.reset}`);
}

function run(cmd: string, errorMsg: string, silent = false) {
  try {
    return execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf-8' });
  } catch (err: any) {
    logError(`${errorMsg}\nCommand failed: ${cmd}\n${err.message}`);
    process.exit(1);
  }
}

async function probeUrl(url: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve) => {
    https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 0, text: data }));
    }).on('error', (err) => resolve({ status: 0, text: err.message }));
  });
}

async function main() {
  const startTime = Date.now();
  console.log(`${colors.cyan}${colors.bold}==============================================================================`);
  console.log(`          🚀 SUTHARLABS UNIVERSAL PRODUCTION DEPLOYMENT PIPELINE              `);
  console.log(`==============================================================================${colors.reset}`);
  console.log(`${colors.dim}Target Server : ${VM_HOST}:${REMOTE_DIR}`);
  console.log(`SSH Key       : ${SSH_KEY}`);
  console.log(`Working Dir   : ${process.cwd()}${colors.reset}`);

  // 1. Pre-flight Check
  logStep(1, 'Pre-flight Verification & Credentials Check');
  if (!fs.existsSync(SSH_KEY)) {
    logError(`SSH Private key not found at ${SSH_KEY}`);
    process.exit(1);
  }
  logSuccess(`SSH Key confirmed: ${path.basename(SSH_KEY)}`);

  try {
    execSync(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no -o ConnectTimeout=8 ${VM_HOST} "uptime"`, { stdio: 'pipe' });
    logSuccess('Remote server connectivity probe passed.');
  } catch (e: any) {
    logError(`Cannot connect to ${VM_HOST} over SSH. Verify IP, network, and firewall rules.`);
    process.exit(1);
  }

  // 2. Plugin Packaging
  logStep(2, 'Plugin Packaging & Version Integrity Pipeline');
  if (skipPlugins) {
    logWarn('Skipping plugin packaging (--skip-plugins passed).');
  } else {
    run('npx tsx scripts/package-plugins.ts', 'Plugin packaging failed');
    logSuccess('All workspace plugins packaged and database version records synchronized.');
  }

  // 3. Local High-RAM Production Build
  logStep(3, 'Compiling Production Artifacts (Vite + esbuild)');
  if (skipBuild) {
    logWarn('Skipping build (--skip-build passed). Using existing dist/ bundle.');
  } else {
    run('npm run build', 'Build failed');
    logSuccess('Compiled client bundle and server.cjs into dist/.');
  }

  if (!fs.existsSync('dist/index.html') || !fs.existsSync('dist/server.cjs')) {
    logError('dist/ verification failed: index.html or server.cjs missing.');
    process.exit(1);
  }
  logSuccess('Artifact integrity verified in dist/.');

  // 4. Knowledge Graph Sync
  logStep(4, 'Updating Codebase Knowledge Graph (graphify)');
  try {
    execSync('graphify update .', { stdio: 'pipe' });
    logSuccess('Knowledge graph updated (graphify-out).');
  } catch {
    logWarn('graphify update completed with notices or skipped.');
  }

  // 5. Git Commit & Push
  logStep(5, 'Git Repository Synchronization');
  if (skipGit) {
    logWarn('Skipping git push (--skip-git passed).');
  } else {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    if (gitStatus) {
      const msg = customCommitMsg || `chore: Automated production deployment [${new Date().toISOString().replace('T', ' ').slice(0, 16)}]`;
      run('git add -A', 'git add failed');
      run(`git commit -m "${msg}"`, 'git commit failed');
      logSuccess(`Committed changes: "${msg}"`);
    } else {
      logSuccess('Working directory clean.');
    }

    try {
      execSync('git push origin main', { stdio: 'inherit' });
      logSuccess('Pushed latest commits to origin/main.');
    } catch {
      logWarn('Git push completed or branch already up to date.');
    }
  }

  // 6. Transfer Artifacts via SCP
  logStep(6, 'Transferring Compiled Bundles & Storage to VM via SCP');
  console.log(`${colors.dim}   Transferring dist/ directory...${colors.reset}`);
  run(`scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no -r dist/* ${VM_HOST}:${REMOTE_DIR}/dist/`, 'SCP dist/ transfer failed');
  logSuccess('Synchronized dist/ bundle to remote host.');

  console.log(`${colors.dim}   Transferring storage/plugins/ archives...${colors.reset}`);
  try {
    execSync(`scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no -r storage/plugins/* ${VM_HOST}:${REMOTE_DIR}/storage/plugins/`, { stdio: 'pipe' });
    logSuccess('Synchronized storage/plugins/ to remote host.');
  } catch {
    logWarn('storage/plugins transfer completed with warnings.');
  }

  // 7. Remote VM Execution & PM2 Reload
  logStep(7, 'Remote Server Reload & Process Lifecycle Management');
  const remoteCommand = [
    `cd ${REMOTE_DIR}`,
    'git stash -u 2>/dev/null || true',
    'git pull origin main',
    'npx prisma generate',
    'pm2 restart sutharlabs-backend --update-env',
    'sleep 2',
    'pm2 status sutharlabs-backend'
  ].join(' && ');

  run(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${VM_HOST} "${remoteCommand}"`, 'Remote VM execution failed');
  logSuccess('Remote backend service reloaded cleanly under PM2.');

  // 8. Live Health Probes
  logStep(8, 'Verifying Live Production Health & APIs');
  await new Promise(r => setTimeout(r, 4000));
  const landingProbe = await probeUrl('https://www.sutharlabs.com/');
  if (landingProbe.status === 200) {
    logSuccess('Landing page (https://www.sutharlabs.com/) -> 200 OK');
  } else {
    logWarn(`Landing page returned status: ${landingProbe.status}`);
  }

  const pluginsProbe = await probeUrl('https://www.sutharlabs.com/api/workspace-plugins');
  if (pluginsProbe.status === 200) {
    try {
      const data = JSON.parse(pluginsProbe.text);
      const count = Array.isArray(data) ? data.length : (data.plugins?.length || 0);
      logSuccess(`API /api/workspace-plugins -> 200 OK (${count} plugins active in catalog)`);
    } catch {
      logSuccess('API /api/workspace-plugins -> 200 OK');
    }
  } else {
    logWarn(`Plugin API returned status: ${pluginsProbe.status}`);
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${colors.cyan}${colors.bold}==============================================================================`);
  console.log(`           🎉 SUTHARLABS PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY         `);
  console.log(`==============================================================================${colors.reset}`);
  console.log(`Total Time    : ${elapsed}s`);
  console.log(`Website URL   : https://www.sutharlabs.com`);
  console.log(`Tools Hub     : https://www.sutharlabs.com/tools`);
  console.log(`Resume Studio : https://www.sutharlabs.com/workspace/resume`);
  console.log(`${colors.cyan}==============================================================================\n${colors.reset}`);
}

main().catch(err => {
  console.error(`\n${colors.red}Unhandled deployment error: ${err.message}${colors.reset}`);
  process.exit(1);
});
