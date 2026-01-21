# 🚀 Guia de Inicialização do Projeto

## 📋 Pré-requisitos

Antes de iniciar o projeto, certifique-se de ter instalado:

- **Node.js** (versão 14 ou superior)
- **MongoDB** (versão 4.4 ou superior)
- **npm** ou **yarn**

## 🔧 Configuração Inicial

### 1. Instalar Dependências

#### Backend
```bash
cd backend
npm install
```

#### Frontend (Raiz do Projeto)
```bash
cd ..
npm install
```

### 2. Configurar Variáveis de Ambiente

O arquivo `.env` já está configurado na raiz do projeto com:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/projeto-pessoal
JWT_SECRET=minha_chave_secreta_super_segura_123
```

> [!IMPORTANT]
> Para produção, altere o `JWT_SECRET` para uma chave mais segura e complexa!

### 3. Iniciar o MongoDB

Certifique-se de que o MongoDB está rodando localmente:

```bash
# Windows (se instalado como serviço)
net start MongoDB

# Ou inicie manualmente
mongod
```

## ▶️ Iniciando o Projeto

### Opção 1: Iniciar Backend e Frontend Separadamente

#### Backend
```bash
cd backend
npm start
```

O servidor backend estará disponível em: `http://localhost:5000`

#### Frontend
O frontend é servido automaticamente pelo backend através de arquivos estáticos.

### Opção 2: Modo Desenvolvimento (com auto-reload)

```bash
cd backend
npm run dev
```

## 🌐 Acessando a Aplicação

Após iniciar o servidor, acesse:

- **Frontend**: http://localhost:5000
- **API Backend**: http://localhost:5000/api

### Páginas Disponíveis

- **Login**: http://localhost:5000/login.html
- **Registro**: http://localhost:5000/register.html
- **Home**: http://localhost:5000/index.html
- **Admin**: http://localhost:5000/admin.html

## 🔍 Verificando o Status

### Verificar se o MongoDB está conectado

Quando o servidor inicia, você deve ver no console:
```
MongoDB conectado: <seu-host>
Servidor rodando na porta 5000
Acesse o site em: http://localhost:5000
```

### Verificar se o Socket.IO está funcionando

Abra o console do navegador (F12) e verifique se há mensagens de conexão do Socket.IO.

## 🛠️ Funcionalidades Principais

- ✅ **Autenticação**: Login e registro de usuários
- ✅ **Posts**: Criar, editar e deletar posts
- ✅ **Spaces**: Criar espaços colaborativos
- ✅ **Mensagens**: Chat em tempo real com Socket.IO
- ✅ **Stories**: Publicar stories temporários
- ✅ **Notificações**: Sistema de notificações em tempo real
- ✅ **Admin**: Painel administrativo
- ✅ **Temas**: Sistema de temas personalizáveis

## 🐛 Solução de Problemas

### MongoDB não conecta

1. Verifique se o MongoDB está rodando:
   ```bash
   # Windows
   net start MongoDB
   ```

2. Verifique se a porta 27017 está disponível

3. Teste a conexão manualmente:
   ```bash
   mongo
   ```

### Porta 5000 já está em uso

Altere a porta no arquivo `.env`:
```env
PORT=3000
```

### Dependências não instaladas

Execute novamente:
```bash
npm install
cd backend
npm install
```

## 📁 Estrutura do Projeto

```
Projeto-pessoal/
├── backend/
│   ├── config/          # Configurações (DB, etc)
│   ├── controllers/     # Lógica de negócio
│   ├── middleware/      # Middlewares (auth, error)
│   ├── models/          # Modelos do MongoDB
│   ├── routes/          # Rotas da API
│   ├── utils/           # Utilitários
│   ├── uploads/         # Arquivos enviados
│   └── server.js        # Servidor principal
├── *.html               # Páginas HTML
├── *.js                 # Scripts do frontend
├── *.css                # Estilos
├── .env                 # Variáveis de ambiente
└── package.json         # Dependências
```

## 📝 Comandos Úteis

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Iniciar em modo produção
npm start

# Verificar logs do MongoDB
# Windows: C:\Program Files\MongoDB\Server\<version>\log\mongod.log
```

## 🔐 Usuário Admin Padrão

Para acessar o painel admin, você precisará criar um usuário e definir `isAdmin: true` no banco de dados.

Consulte o arquivo [ADMIN_GUIDE.md](file:///c:/Users/adson.vicente_murtac/Desktop/tentativas%20de%20projetos/Projeto-pessoal/ADMIN_GUIDE.md) para mais detalhes.

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do console do servidor
2. Logs do console do navegador (F12)
3. Status do MongoDB
4. Configurações do arquivo `.env`

---

**Desenvolvido com ❤️ para conectar famílias**
