@echo off
echo Removing snipe-it.local from hosts file...
echo.

REM Create a temporary file with filtered content
powershell -Command "(Get-Content C:\Windows\System32\drivers\etc\hosts) | Where-Object { $_ -notmatch 'snipe-it.local' } | Out-File -FilePath 'temp_hosts' -Encoding ascii"

REM Replace the original hosts file
copy temp_hosts C:\Windows\System32\drivers\etc\hosts

REM Clean up
del temp_hosts

echo snipe-it.local removed from hosts file!
echo.
echo Flushing DNS cache...
ipconfig /flushdns

echo.
echo Done! Press any key to exit...
pause >nul