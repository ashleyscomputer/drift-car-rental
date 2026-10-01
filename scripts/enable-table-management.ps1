$ErrorActionPreference = 'Stop'
$mysqlExe = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
$adminPassword = Read-Host 'Enter your local MySQL root password (hidden)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
try {
  $env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  "GRANT CREATE, DROP ON drift_car_rental.* TO 'drift_local'@'localhost';" | & $mysqlExe --host=localhost --user=root --batch
  if ($LASTEXITCODE -ne 0) { throw 'MySQL did not grant table-management access.' }
  Write-Host 'Table management is ready. Existing data and passwords were not changed.'
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
