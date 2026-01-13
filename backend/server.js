const dotenv = require('dotenv');
// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const express = require('express');
const fs = require('fs'); // Necessário para verificar/criar diretórios
const connectDB = require('./config/db');
const fileUpload = require('express-fileupload');
const path = require('path');
const http = require('http'); // Módulo http nativo do Node
const cors = require('cors'); // Importa o pacote cors
const { Server } = require('socket.io'); // Classe Server do socket.io

// Importa os arquivos de rota
const userRoutes = require('./routes/userRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const spacePostRoutes = require('./routes/spacePostRoutes');
const User = require('./models/userModel'); // Importar o modelo de Usuário
const Message = require('./models/Message'); // Importar modelo de Mensagem
const noteRoutes = require('./routes/noteRoutes');
const postRoutes = require('./routes/postRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes'); // Importa as novas rotas
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Conecta ao banco de dados
connectDB();

const app = express();

// Habilita o CORS para todas as requisições
app.use(cors());

// Permite que o servidor aceite dados JSON no corpo da requisição
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Garante parsing de formulários

// Middleware para upload de arquivos
app.use(fileUpload());

// Cria o servidor HTTP a partir do app Express
const server = http.createServer(app);

// Inicializa o Socket.IO atrelado ao servidor HTTP
const io = new Server(server, {
  cors: {
    origin: "*", // Permite qualquer origem para evitar problemas de conexão em dev
    methods: ["GET", "POST"]
  }
});

// Disponibiliza a instância do io para ser usada nas rotas
app.set('socketio', io);

// Mapa para rastrear usuários online: userId -> socketId
const onlineUsers = new Map();

// Garante que a pasta de uploads exista fora de 'public' para evitar reloads do frontend
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Middleware para servir arquivos estáticos da pasta 'public'
// Esta linha deve vir ANTES das suas rotas de API.
const publicPath = path.join(__dirname, 'public');
const rootPath = path.join(__dirname, '../');
let staticDir = publicPath;

// Verifica se o frontend está na pasta public, caso contrário serve da raiz (fallback)
if (!fs.existsSync(path.join(publicPath, 'index.html')) && fs.existsSync(path.join(rootPath, 'index.html'))) {
  console.log(`ℹ️  Frontend servido da raiz (Modo Dev). Para produção, mova arquivos para 'backend/public'.`);
  staticDir = rootPath;
} else {
  console.log(`Servindo arquivos do frontend da pasta: ${publicPath}`);
}

app.use(express.static(staticDir));
app.use('/uploads', express.static(uploadsDir)); // Serve os arquivos da pasta uploads na rota /uploads

// Monta as rotas
app.use('/api/users', userRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/invitations', invitationRoutes); // Não precisa do middleware
app.use('/api/space-posts', spacePostRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes); // Monta as rotas de mensagem

// Middlewares de tratamento de erro
// Devem ser os últimos middlewares a serem adicionados.
app.use(notFound);
app.use(errorHandler);

// Lógica do Socket.IO
io.on('connection', (socket) => {
  
  // Quando um usuário se conecta e se identifica
  socket.on('user_connected', (userId) => {
    console.log(`Usuário ${userId} conectado e entrou na sala.`);
    onlineUsers.set(userId, socket.id);
    socket.join(userId); // Entra na sala privada
    
    // Avisa a todos que este usuário está online
    io.emit('user_status_change', { userId, status: 'online' });
    
    // Envia a lista atual de usuários online para quem acabou de entrar
    socket.emit('online_users_list', Array.from(onlineUsers.keys()));
  });

  // Usuário entra em uma sala com seu próprio ID para receber notificações privadas
  socket.on('join', (userId) => socket.join(userId));
  socket.on('joinSpace', (spaceId) => socket.join(spaceId));
  
  socket.on('chatMessage', ({ spaceId, message, user }) => {
    io.to(spaceId).emit('newChatMessage', { message, user });
  });

  // Eventos de Digitando
  socket.on('typing', ({ recipientId, senderId }) => {
    io.to(recipientId).emit('display_typing', { senderId });
  });

  socket.on('stop_typing', ({ recipientId, senderId }) => {
    io.to(recipientId).emit('hide_typing', { senderId });
  });

  // Marcar como lido em tempo real
  socket.on('mark_as_read', async ({ senderId, recipientId }) => {
    await Message.updateMany(
      { sender: senderId, recipient: recipientId, read: false },
      { read: true, readAt: Date.now() }
    );
    // Avisa o remetente (senderId) que o destinatário (recipientId) leu
    io.to(senderId).emit('messages_read', { byUserId: recipientId });
  });

  socket.on('disconnect', () => {
    // Encontra o userId baseado no socket.id
    const userId = [...onlineUsers.entries()].find(([key, val]) => val === socket.id)?.[0];
    if (userId) {
      onlineUsers.delete(userId);
      const lastSeen = new Date();
      // Atualiza o lastSeen no banco de dados
      User.findByIdAndUpdate(userId, { lastSeen }).catch(err => console.error('Erro ao atualizar lastSeen:', err));
      io.emit('user_status_change', { userId, status: 'offline', lastSeen });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => { // Usa server.listen em vez de app.listen
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse o site em: http://localhost:${PORT}`);
});