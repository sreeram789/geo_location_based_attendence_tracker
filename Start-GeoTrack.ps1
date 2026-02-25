# Professional GeoTrack System Startup Script

# 1. Clear stale sessions
Write-Host "--- Terminating stale GeoTrack processes ---" -ForegroundColor Cyan
# Kill any processes using our target ports
$ports = @(3000, 8000, 3001)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            Write-Host "Killing process $($conn.OwningProcess) on port $port..."
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
# Kill by name as well
Get-Process -Name "node", "python", "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Re-initialize Database with BIT Campus
Write-Host "--- Syncing Personnel Database (BIT Campus) ---" -ForegroundColor Cyan
cd backend
if (!(Test-Path "venv")) {
    Write-Host "Creating Virtual Environment..."
    python -m venv venv
}
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe init_db.py
cd ..

# 3. Start Backend in new window
Write-Host "--- Launching BIT Personnel API (Port 8000) ---" -ForegroundColor Green
start powershell "-Command `$Host.UI.RawUI.WindowTitle = 'GeoTrack Backend [Port 8000]'; cd backend; .\venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# 4. Start Frontend in new window
Write-Host "--- Launching BIT Dashboard (Port 3000) ---" -ForegroundColor Green
start powershell "-Command `$Host.UI.RawUI.WindowTitle = 'GeoTrack Dashboard [Port 3000]'; cd frontend; npm run dev"

Write-Host "--- System initialization complete ---" -ForegroundColor Cyan
Write-Host "Personnel ID Portal: http://localhost:3000/login" -ForegroundColor Yellow
