# SutharLabs One-Command Fleet Deployment Automation
$SSH_KEY = "D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key"

Write-Host "🚀 [SutharLabs Fleet Deploy] Deploying latest commit to VM 3 Backend (130.210.37.199)..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no -i $SSH_KEY ubuntu@130.210.37.199 "bash /home/ubuntu/website/scripts/deploy.sh"

Write-Host "✅ [SutharLabs Fleet Deploy] VM 3 deployment complete!" -ForegroundColor Green

