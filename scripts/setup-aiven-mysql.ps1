$ErrorActionPreference = 'Stop'
$projectPath = Split-Path $PSScriptRoot -Parent
$mysqlExe = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
$defaultCertificate = Join-Path $env:USERPROFILE 'Downloads\ca.pem'
$certificatePath = Read-Host "Path to downloaded Aiven CA certificate (Enter for $defaultCertificate)"
if ([string]::IsNullOrWhiteSpace($certificatePath)) { $certificatePath = $defaultCertificate }
$certificatePath = $certificatePath.Trim('"')
if (-not (Test-Path -LiteralPath $certificatePath -PathType Leaf)) { throw 'Certificate not found. Download the CA certificate from your Aiven service first.' }
$certificate = [IO.File]::ReadAllText($certificatePath)
if (-not $certificate.Contains('-----BEGIN CERTIFICATE-----')) { throw 'The selected file is not a PEM certificate.' }
if (-not (Test-Path -LiteralPath $mysqlExe)) { throw 'MySQL command-line client was not found.' }
$password = Read-Host 'Enter your Aiven avnadmin password (hidden; NOT your local root password)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$previousPassword = $env:MYSQL_PWD
try {
  $env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  'SELECT 1;' | & $mysqlExe --host=mysql-3d40c119-ashleyvrfx-86ca.b.aivencloud.com --port=23418 --user=avnadmin --database=defaultdb --ssl-mode=VERIFY_IDENTITY "--ssl-ca=$certificatePath" --connect-timeout=20 --batch --skip-column-names
  if ($LASTEXITCODE -ne 0) { throw 'Connection failed. Wait until Aiven says Running and check the password and certificate. Nothing was saved.' }
  $settings = @{
    host = 'mysql-3d40c119-ashleyvrfx-86ca.b.aivencloud.com'
    port = 23418
    user = 'avnadmin'
    password = $env:MYSQL_PWD
    database = 'defaultdb'
    ssl = @{ ca = $certificate; rejectUnauthorized = $true }
  }
  $privateDirectory = Join-Path $projectPath 'tmp'
  New-Item -ItemType Directory -Force -Path $privateDirectory | Out-Null
  $settingsPath = Join-Path $privateDirectory 'aiven-connection.json'
  [IO.File]::WriteAllText($settingsPath, ($settings | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding($false)))
  Write-Host 'Aiven connection verified and ready for import. Credentials are saved in the ignored tmp folder. Local database settings were not changed.'
} finally {
  if ($null -eq $previousPassword) { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue } else { $env:MYSQL_PWD = $previousPassword }
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
