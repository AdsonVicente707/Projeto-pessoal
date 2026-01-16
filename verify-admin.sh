#!/bin/bash

echo "========================================"
echo "  VERIFICACAO RAPIDA - PAINEL ADMIN"
echo "========================================"
echo ""

echo "[1/4] Verificando MongoDB..."
node backend/utils/testAdminEndpoints.js
if [ $? -ne 0 ]; then
    echo "ERRO: MongoDB não está acessível!"
    exit 1
fi

echo ""
echo "[2/4] Verificando usuário admin..."
node backend/utils/testLoginFlow.js
if [ $? -ne 0 ]; then
    echo "ERRO: Problema com usuário admin!"
    exit 1
fi

echo ""
echo "[3/4] Verificando servidor..."
curl -s http://localhost:5000 > /dev/null
if [ $? -ne 0 ]; then
    echo "AVISO: Servidor não está rodando!"
    echo "Execute: npm start"
    exit 1
fi

echo ""
echo "[4/4] Tudo pronto!"
echo "========================================"
echo "  PAINEL ADMIN - PRONTO PARA USO"
echo "========================================"
echo ""
echo "Credenciais:"
echo "  Email: adsonvicente@admin.com"
echo "  Senha: adson123"
echo ""
echo "URLs:"
echo "  Login:  http://localhost:5000/login.html"
echo "  Admin:  http://localhost:5000/admin.html"
echo ""
echo "Abrindo painel admin..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5000/admin.html
elif command -v open > /dev/null; then
    open http://localhost:5000/admin.html
else
    echo "Abra manualmente: http://localhost:5000/admin.html"
fi
