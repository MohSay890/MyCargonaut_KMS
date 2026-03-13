Write-Host "========================================="
Write-Host "   MyCargonaut One-Click E2E Test"
Write-Host "========================================="

# 1. Start Docker (in background, just in case)
Write-Host "Checking Database/Backend containers..."
docker-compose up -d

# 2. Wait a bit for DB to initialize
Start-Sleep -Seconds 5

# 3. Navigate to frontend
cd FRONTEND

# 4. Install playwright browsers if not exist (quick check)
npx playwright install chromium

# 5. Open Playwright UI - the webServer config in playwright.config.ts 
# will AUTOMATICALLY start the Angular frontend (ng serve) for us!
Write-Host "Opening Playwright UI Simulator..."
npx playwright test e2e/full-lifecycle.spec.ts --ui
