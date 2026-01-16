@echo off
echo ========================================
echo   VERIFICACAO RAPIDA - PAINEL ADMIN
echo ========================================
echo.

echo [1/4] Verificando MongoDB...
node backend/utils/testAdminEndpoints.js
if %errorlevel% neq 0 (
    echo ERRO: MongoDB nao esta acessivel!
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando usuario admin...
node backend/utils/testLoginFlow.js
if %errorlevel% neq 0 (
    echo ERRO: Problema com usuario admin!
    pause
    exit /b 1
)

echo.
echo [3/4] Verificando servidor...
curl -s http://localhost:5000 > nul
if %errorlevel% neq 0 (
    echo AVISO: Servidor nao esta rodando!
    echo Execute: npm start
    pause
    exit /b 1
)

echo.
echo [4/4] Tudo pronto!
echo ========================================
echo   PAINEL ADMIN - PRONTO PARA USO
echo ========================================
echo.
echo Credenciais:
echo   Email: adsonvicente@admin.com
echo   Senha: adson123
echo.
echo URLs:
echo   Login:  http://localhost:5000/login.html
echo   Admin:  http://localhost:5000/admin.html
echo.
echo Pressione qualquer tecla para abrir o painel...
pause > nul
start http://localhost:5000/admin.html
