$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

$devices = & $adb devices | Select-String -Pattern "\tdevice$"
if (-not $devices) {
    Write-Host "No Android device connected. Plug in the phone (USB debugging on) and rerun." -ForegroundColor Red
    exit 1
}
Write-Host "Device detected: $($devices[0])" -ForegroundColor Green

& $adb reverse tcp:8081 tcp:8081 | Out-Null
Write-Host "Port 8081 forwarded." -ForegroundColor Green

Write-Host "Starting Metro in a new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; yarn start"

Write-Host "Waiting 5s for Metro to boot..."
Start-Sleep -Seconds 5

Write-Host "Launching app on device..." -ForegroundColor Cyan
& $adb shell monkey -p com.beyomo -c android.intent.category.LAUNCHER 1 | Out-Null
Write-Host "Done. Metro window will keep serving the JS bundle." -ForegroundColor Green
