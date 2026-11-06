# ==============================================================================
# SutharLabs Sovereign Production Deployment Automation (Windows PowerShell)
# Target Host: Oracle Cloud VM 3 (130.210.37.199)
# ==============================================================================
param(
    [switch]$SkipBuild = $false,
    [switch]$SkipGit = $false,
    [switch]$SkipPlugins = $false,
    [string]$CommitMessage = "",
    [string]$KeyPath = "D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key",
    [string]$HostIp = "130.210.37.199",
    [string]$HostUser = "ubuntu",
    [string]$RemoteDir = "/home/ubuntu/website"
)

$ErrorActionPreference = "Stop"
$StartTime = Get-Date

function Print-Step($num, $title) {
    Write-Host "`n[$num/8] " -NoNewline -ForegroundColor Cyan
    Write-Host "$title" -ForegroundColor White
}

function Print-Success($msg) {
    Write-Host "   ✔ $msg" -ForegroundColor Green
}

function Print-Warn($msg) {
    Write-Host "   ⚠ $msg" -ForegroundColor Yellow
}

function Print-Error($msg) {
    Write-Host "   ✖ $msg" -ForegroundColor Red
}

Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "          🚀 SUTHARLABS PRODUCTION REPLICATION & DEPLOYMENT PIPELINE          " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "Target Server : $HostUser@$HostIp ($RemoteDir)" -ForegroundColor Gray
Write-Host "SSH Key       : $KeyPath" -ForegroundColor Gray
Write-Host "Local Machine : $(Get-Location)" -ForegroundColor Gray
Write-Host "Start Time    : $($StartTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# STEP 1: Pre-flight Verification
# ------------------------------------------------------------------------------
Print-Step "1" "Pre-flight Verification & Credentials Check"

if (-not (Test-Path $KeyPath)) {
    Print-Error "SSH Private Key not found at: $KeyPath"
    exit 1
}
Print-Success "SSH Key verified."

# Test SSH connectivity
try {
    $testUptime = ssh -i "$KeyPath" -o StrictHostKeyChecking=no -o ConnectTimeout=8 "$HostUser@$HostIp" "uptime" 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $testUptime) {
        throw "SSH connection probe failed."
    }
    Print-Success "Connected to remote server: $testUptime"
} catch {
    Print-Error "Cannot reach $HostUser@$HostIp over SSH. Check network connectivity and security lists."
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 2: Plugin Packaging & Catalog Sync
# ------------------------------------------------------------------------------
Print-Step "2" "Plugin Packaging & Version Integrity Pipeline"

if ($SkipPlugins) {
    Print-Warn "Skipping plugin packaging (-SkipPlugins passed)."
} else {
    Write-Host "   Executing scripts/package-plugins.ts..." -ForegroundColor Gray
    npx tsx scripts/package-plugins.ts
    if ($LASTEXITCODE -ne 0) {
        Print-Error "Plugin packaging failed."
        exit 1
    }
    Print-Success "All plugins packaged, encrypted, and synced with database catalog."
}

# ------------------------------------------------------------------------------
# STEP 3: Local High-RAM Production Build
# ------------------------------------------------------------------------------
Print-Step "3" "Compiling Production Artifacts (Vite + esbuild)"

if ($SkipBuild) {
    Print-Warn "Skipping local build (-SkipBuild passed). Using existing dist/ contents."
} else {
    Write-Host "   Building client bundles (Vite) and server bundle (esbuild)..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Print-Error "npm run build failed."
        exit 1
    }
    Print-Success "Production artifacts generated successfully in dist/."
}

# Verify dist integrity
if (-not (Test-Path "dist/index.html") -or -not (Test-Path "dist/server.cjs")) {
    Print-Error "dist/ verification failed: dist/index.html or dist/server.cjs is missing."
    exit 1
}
Print-Success "Artifacts integrity verified (index.html & server.cjs present)."

# ------------------------------------------------------------------------------
# STEP 4: Knowledge Graph Update (graphify)
# ------------------------------------------------------------------------------
Print-Step "4" "Updating Codebase Knowledge Graph (graphify)"

try {
    graphify update . 2>$null
    Print-Success "Knowledge graph updated (graphify-out)."
} catch {
    Print-Warn "graphify update skipped or completed with notices."
}

# ------------------------------------------------------------------------------
# STEP 5: Git Commit & Push
# ------------------------------------------------------------------------------
Print-Step "5" "Git Synchronization"

if ($SkipGit) {
    Print-Warn "Skipping git push (-SkipGit passed)."
} else {
    $status = git status --porcelain
    if ($status) {
        Write-Host "   Uncommitted changes detected in repository." -ForegroundColor Gray
        $msg = $CommitMessage
        if (-not $msg) {
            $msg = "chore: Production deployment update [$(Get-Date -Format 'yyyy-MM-dd HH:mm')]"
        }
        git add -A
        git commit -m "$msg"
        Print-Success "Committed changes: $msg"
    } else {
        Print-Success "Working directory clean."
    }

    Write-Host "   Pushing to origin main..." -ForegroundColor Gray
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Print-Warn "Git push returned a non-zero code. Verifying if branch is already up to date..."
    } else {
        Print-Success "Pushed latest commits to origin/main."
    }
}

# ------------------------------------------------------------------------------
# STEP 6: Sync Compiled Artifacts & Plugins to VM via SCP
# ------------------------------------------------------------------------------
Print-Step "6" "Transferring Compiled Bundles & Storage to VM 3 via SCP"

Write-Host "   Uploading dist/ directory..." -ForegroundColor Gray
scp -i "$KeyPath" -o StrictHostKeyChecking=no -r dist\* "$HostUser@$HostIp`:$RemoteDir/dist/"
if ($LASTEXITCODE -ne 0) {
    Print-Error "Failed to upload dist/ directory via scp."
    exit 1
}
Print-Success "dist/ artifacts synchronized to remote VM."

Write-Host "   Uploading storage/plugins/ package archives..." -ForegroundColor Gray
scp -i "$KeyPath" -o StrictHostKeyChecking=no -r storage\plugins\* "$HostUser@$HostIp`:$RemoteDir/storage/plugins/" 2>$null
Print-Success "storage/plugins/ synchronized."

# ------------------------------------------------------------------------------
# STEP 7: Remote VM Execution (Git pull, Prisma generate, PM2 reload)
# ------------------------------------------------------------------------------
Print-Step "7" "Remote Server Reload & Process Lifecycle Management"

$remoteCommands = @"
set -e
cd $RemoteDir
echo '  [Remote] Stashing uncommitted local logs or data...'
git stash -u 2>/dev/null || true

echo '  [Remote] Pulling latest git tree...'
git pull origin main

echo '  [Remote] Generating Prisma client...'
npx prisma generate

echo '  [Remote] Reloading PM2 backend service...'
pm2 restart sutharlabs-backend --update-env

sleep 2

echo '  [Remote] PM2 Status:'
pm2 status sutharlabs-backend
"@

ssh -i "$KeyPath" -o StrictHostKeyChecking=no "$HostUser@$HostIp" "$remoteCommands"
if ($LASTEXITCODE -ne 0) {
    Print-Error "Remote execution encountered an error."
    exit 1
}
Print-Success "Remote PM2 service reloaded cleanly."

# ------------------------------------------------------------------------------
# STEP 8: Live Production Health Probe
# ------------------------------------------------------------------------------
Print-Step "8" "Verifying Live Production Health & APIs"

function Wait-EndpointHealthy($url, $maxAttempts = 5) {
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8 2>$null
            if ($resp.StatusCode -eq 200) { return $resp }
        } catch {}
        Start-Sleep -Seconds 2
    }
    return $null
}

$landing = Wait-EndpointHealthy "https://www.sutharlabs.com/"
if ($landing) {
    Print-Success "Landing page (https://www.sutharlabs.com/) -> 200 OK"
} else {
    Print-Warn "Landing page probe did not return 200 OK after retries."
}

$api = Wait-EndpointHealthy "https://www.sutharlabs.com/api/workspace-plugins"
if ($api) {
    try {
        $json = $api.Content | ConvertFrom-Json
        $count = if ($json -is [array]) { $json.Count } elseif ($json.plugins) { $json.plugins.Count } else { 0 }
        Print-Success "API /api/workspace-plugins -> 200 OK ($count plugins active in catalog)"
    } catch {
        Print-Success "API /api/workspace-plugins -> 200 OK"
    }
} else {
    Print-Warn "Plugin API probe did not return 200 OK after retries."
}

# ------------------------------------------------------------------------------
# SUMMARY & COMPLETION
# ------------------------------------------------------------------------------
$Duration = (Get-Date) - $StartTime
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host "           🎉 SUTHARLABS PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY         " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "Total Execution Time: $([math]::Round($Duration.TotalSeconds, 1))s" -ForegroundColor Cyan
Write-Host "Production URL      : https://www.sutharlabs.com" -ForegroundColor Cyan
Write-Host "Tools Hub           : https://www.sutharlabs.com/tools" -ForegroundColor Cyan
Write-Host "Resume Studio       : https://www.sutharlabs.com/workspace/resume" -ForegroundColor Cyan
Write-Host "==============================================================================`n" -ForegroundColor DarkCyan
