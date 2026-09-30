$ErrorActionPreference = 'Stop'
$projectPath = Split-Path $PSScriptRoot -Parent
$mysqlExe = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
$adminPassword = Read-Host 'Enter your local MySQL root password (hidden)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
try {
  $env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  $passwordBytes = New-Object byte[] 32
  $randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $randomGenerator.GetBytes($passwordBytes) } finally { $randomGenerator.Dispose() }
  $appPassword = [BitConverter]::ToString($passwordBytes).Replace('-', '')
  $sql = "CREATE USER IF NOT EXISTS 'drift_local'@'localhost' IDENTIFIED BY '$appPassword'; ALTER USER 'drift_local'@'localhost' IDENTIFIED BY '$appPassword'; GRANT SELECT, INSERT, UPDATE, DELETE ON drift_car_rental.* TO 'drift_local'@'localhost'; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='drift_car_rental';"
  $sql | & $mysqlExe --host=localhost --user=root --batch --skip-column-names
  if ($LASTEXITCODE -ne 0) { throw 'MySQL setup failed. No environment settings were saved.' }
  $envPath = Join-Path $projectPath '.env.local'
  $existing = if (Test-Path $envPath) { Get-Content $envPath | Where-Object { $_ -notmatch '^MYSQL_' } } else { @() }
  $settings = @('MYSQL_HOST=localhost','MYSQL_PORT=3306','MYSQL_DATABASE=drift_car_rental','MYSQL_USER=drift_local',"MYSQL_PASSWORD=$appPassword",'MYSQL_SSL=false')
  [IO.File]::WriteAllLines($envPath, @($existing) + $settings, [Text.UTF8Encoding]::new($false))
  Write-Host 'Drift local MySQL access is ready. The password is stored only in ignored .env.local.'
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
Read-Host 'Press Enter to close'
