const express = require('express');
const dotenv = require('dotenv');
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
const noteRoutes = require('./routes/noteRoutes');
const postRoutes = require('./routes/postRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const ensureUploadsDir = require('./middleware/ensureUploadsDir');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes'); // Importa as novas rotas
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Conecta ao banco de dados
connectDB();

const app = express();

// Habilita o CORS para todas as requisições
app.use(cors());

// Permite que o servidor aceite dados JSON no corpo da requisição
app.use(express.json());

// Middleware para upload de arquivos
app.use(fileUpload());

// Cria o servidor HTTP a partir do app Express
const server = http.createServer(app);

// Inicializa o Socket.IO atrelado ao servidor HTTP
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500", // Permite a conexão do seu frontend
    methods: ["GET", "POST"]
  }
});

// Disponibiliza a instância do io para ser usada nas rotas
app.set('socketio', io);

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('API está rodando...');
});

// Middleware para servir arquivos estáticos da pasta 'public'
// Esta linha deve vir ANTES das suas rotas de API.
app.use(express.static(path.join(__dirname, 'public')));

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
  // Usuário entra em uma sala com seu próprio ID para receber notificações privadas
  socket.on('join', (userId) => socket.join(userId));
  socket.on('joinSpace', (spaceId) => socket.join(spaceId));
  socket.on('chatMessage', ({ spaceId, message, user }) => {
    io.to(spaceId).emit('newChatMessage', { message, user });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => { // Usa server.listen em vez de app.listen
  console.log(`Servidor rodando na porta ${PORT}`);
});