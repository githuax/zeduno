# PowerShell script to kill processes on specific ports
param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow

try {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connections) {
        foreach ($connection in $connections) {
            $processId = $connection.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Host "Found process: $($process.ProcessName) (ID: $processId) using port $Port" -ForegroundColor Red
                Write-Host "Killing process $processId..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force
                Write-Host "Process $processId killed successfully!" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "No processes found using port $Port" -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}