$ErrorActionPreference = 'Stop'
& icacls.exe 'C:\xampp\xampp-control.ini' /grant '*S-1-5-21-4034146939-2901552732-915837597-1001:(M)'
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
