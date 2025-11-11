@echo off
REM Script de verificación e inicio del proyecto UAP Analysis System

echo.
echo UAP Analysis System - Script de inicio
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js no esta instalado
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [OK] Node.js !NODE_VERSION!
)

REM Verificar npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] npm no esta instalado
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [OK] npm v!NPM_VERSION!
)

REM Verificar MongoDB
where mongod >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] MongoDB no detectado localmente
    echo     Asegurate de usar MongoDB Atlas en .env
) else (
    echo [OK] MongoDB instalado
)

echo.
echo Verificando dependencias del backend...

REM Verificar si existe node_modules en server
if not exist "server\node_modules" (
    echo [!] Instalando dependencias del backend...
    cd server
    call npm install
    cd ..
    echo [OK] Dependencias instaladas
) else (
    echo [OK] Dependencias ya instaladas
)

REM Verificar archivo .env
if not exist "server\.env" (
    echo [!] Archivo .env no encontrado
    echo     Copiando .env.example a .env...
    copy server\.env.example server\.env
    echo [OK] Archivo .env creado
    echo [!] Por favor, revisa y configura server\.env segun tu entorno
) else (
    echo [OK] Archivo .env encontrado
)

echo.
echo ========================================
echo Proyecto verificado y listo para usar
echo ========================================
echo.
echo Para iniciar el servidor backend:
echo   cd server ^&^& npm run dev
echo.
echo Para abrir el frontend:
echo   Abrir frontend\index.html en el navegador
echo.
echo API disponible en: http://localhost:3000/api/users
echo.
pause
