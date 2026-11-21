@echo off
REM ============================================================
REM  LingoLive - start backend + public tunnel
REM  Run this after reboot / when the app is down.
REM ============================================================
setlocal

set "ROOT=%~dp0"
set "TUNNEL_URL_FILE=%ROOT%tunnel-url.txt"
set "CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,https://lingolive-seven.vercel.app"

REM --- backend -------------------------------------------------
start "LingoLive backend" /min cmd /c "cd /d "%ROOT%backend%" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

REM --- public tunnel (cloudflared quick tunnel) -----------------
if not exist "%ROOT%cloudflared.exe" (
  echo Downloading cloudflared...
  powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%ROOT%cloudflared.exe' -UseBasicParsing"
)
if exist "%TUNNEL_URL_FILE%" del "%TUNNEL_URL_FILE%"
if exist "%ROOT%tunnel-raw.log" del "%ROOT%tunnel-raw.log"
start "LingoLive tunnel" /min cmd /c ""%ROOT%cloudflared.exe" tunnel --url http://127.0.0.1:8000 2>"%ROOT%tunnel-raw.log""

echo.
echo Backend : http://127.0.0.1:8000
echo Waiting for the tunnel URL (saved to tunnel-url.txt)...
timeout /t 15 /nobreak >nul
findstr /i trycloudflare "%ROOT%tunnel-raw.log" > "%TUNNEL_URL_FILE%" 2>nul
if exist "%TUNNEL_URL_FILE%" (
  echo Public URL:
  type "%TUNNEL_URL_FILE%"
  echo.
  echo NOTE: the public URL changes every restart. If it changed,
  echo update Vercel:  cd frontend ^&^& echo https://new-url ^| npx vercel env add VITE_API_BASE_URL production
  echo then redeploy:  npx vercel deploy --prod
) else (
  echo Tunnel URL not captured yet - check the "LingoLive tunnel" window.
)
endlocal
