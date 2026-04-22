@echo off
echo Iniciando Backend (.NET API)...
start cmd /k "cd /d .\Backend\TransportManagement.API && dotnet run"

echo Iniciando Frontend (React/Vite)...
start cmd /k "cd /d .\Frontend && npm run dev"

echo ¡Servidores lanzados en ventanas separadas!
echo Backend estara en: http://localhost:5024
echo Frontend estara en: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar este script base.
pause >nul
