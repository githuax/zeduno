# PowerShell script to remove a host entry from the hosts file
param(
    [Parameter(Mandatory=$true)]
    [string]$HostName
)

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

try {
    Write-Host "Removing $HostName from hosts file..." -ForegroundColor Yellow
    
    # Read all lines from hosts file
    $hostsContent = Get-Content $hostsPath
    
    # Filter out lines containing the hostname
    $filteredContent = $hostsContent | Where-Object { $_ -notmatch $HostName }
    
    # Write back to hosts file
    $filteredContent | Set-Content $hostsPath
    
    Write-Host "$HostName removed successfully from hosts file!" -ForegroundColor Green
    Write-Host "You may need to flush DNS cache: ipconfig /flushdns" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this script as Administrator" -ForegroundColor Yellow
}