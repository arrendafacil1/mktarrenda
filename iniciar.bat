@echo off
setlocal EnableExtensions

REM === Caminhos ===
set "ROOT=C:\Projetos\Manus"
set "BACKEND=%ROOT%\rural_marketplace_backend"
set "FRONTEND=%ROOT%\rural_marketplace_frontend"

echo === Arrancando projeto ===

REM ===== BACKEND =====
if exist "%BACKEND%\server.js" (
  start "backend-node" /D "%BACKEND%" cmd /k node server.js
) else if exist "%BACKEND%\index.js" (
  start "backend-node" /D "%BACKEND%" cmd /k node index.js
) else if exist "%BACKEND%\app.js" (
  start "backend-node" /D "%BACKEND%" cmd /k node app.js
) else if exist "%BACKEND%\app.py" (
  REM Se usa venv, troque a linha abaixo por:
  REM start "backend-py" /D "%BACKEND%" cmd /k "call venv\Scripts\activate && python app.py"
  start "backend-py" /D "%BACKEND%" cmd /k python app.py
) else (
  echo [ERRO backend] Nao achei server.js/index.js/app.js/app.py em "%BACKEND%"
)

REM ===== DELAY PARA O BACKEND INICIALIZAR =====
echo.
echo Aguardando 5 segundos para o backend inicializar completamente...
timeout /t 5 >nul

REM ===== FRONTEND =====
if exist "%FRONTEND%\package.json" (
  REM 1) tenta npm start; 2) se nao existir, tenta npm run dev (Vite/Next)
  start "frontend" /D "%FRONTEND%" cmd /k "npm run start || npm run dev || echo [ERRO] Nao ha scripts start/dev no package.json"
) else (
  echo [AVISO frontend] Nao achei package.json em "%FRONTEND%"
)
