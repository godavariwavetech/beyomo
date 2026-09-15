$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Resolve adb from the SDK env vars first. Hardcoding %LOCALAPPDATA%\Android\Sdk
# breaks whenever the SDK lives elsewhere (here it's D:\Android\sdk), and the
# failure looks like "no device connected" rather than "adb not found".
$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $sdkRoot) { $sdkRoot = "$env:LOCALAPPDATA\Android\Sdk" }
$adb = Join-Path $sdkRoot 'platform-tools\adb.exe'

if (-not (Test-Path $adb)) {
    Write-Host "adb not found at $adb" -ForegroundColor Red
    Write-Host "Set ANDROID_HOME to your SDK folder and rerun." -ForegroundColor Red
    exit 1
}

# A freshly plugged phone sits in 'offline'/'unauthorized' for a few seconds while
# the USB-debugging prompt is pending. Launching then gives "No online devices
# found", so wait for it to reach 'device' instead of failing immediately.
Write-Host "Waiting for a device..." -ForegroundColor Cyan
$deviceId = $null
foreach ($i in 1..30) {
    $line = & $adb devices | Select-String -Pattern "\tdevice$" | Select-Object -First 1
    if ($line) { $deviceId = ($line -split "\t")[0]; break }
    Start-Sleep -Seconds 1
}

if (-not $deviceId) {
    Write-Host "No online device." -ForegroundColor Red
    & $adb devices
    Write-Host "If it shows 'offline' or 'unauthorized': replug the cable and accept" -ForegroundColor Yellow
    Write-Host "the 'Allow USB debugging' prompt on the phone, then rerun." -ForegroundColor Yellow
    exit 1
}
Write-Host "Device detected: $deviceId" -ForegroundColor Green

# 8081 serves the JS bundle; 3000 is the local API the app calls. Without the 3000
# reverse the app loads but every request fails, which reads as "no data".
foreach ($port in 8081, 3000) {
    & $adb reverse "tcp:$port" "tcp:$port" | Out-Null
    Write-Host "Port $port forwarded." -ForegroundColor Green
}

# The app is useless without the API, and a missing backend is easy to miss.
try {
    Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 3 -UseBasicParsing | Out-Null
    Write-Host "Backend is up on :3000." -ForegroundColor Green
} catch {
    Write-Host "Backend NOT running on :3000 - start it with 'npm run dev' in backend\" -ForegroundColor Yellow
}

Write-Host "Starting Metro in a new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; yarn start"

Write-Host "Waiting 5s for Metro to boot..."
Start-Sleep -Seconds 5

Write-Host "Launching app on device..." -ForegroundColor Cyan
& $adb shell monkey -p com.beyomo -c android.intent.category.LAUNCHER 1 | Out-Null
Write-Host "Done. Metro window will keep serving the JS bundle." -ForegroundColor Green
