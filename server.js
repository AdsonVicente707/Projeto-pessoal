// 1. Importar o framework Express
const express = require('express');
const bcrypt = require('bcrypt'); // Importar a biblioteca de criptografia
const multer = require('multer'); // Importar o multer para upload de arquivos
const path = require('path'); // Módulo para lidar com caminhos de arquivos

// 2. Inicializar a aplicação Express
const app = express();

// 3. Definir a porta do servidor
const PORT = 3000;

// Middleware para o Express entender JSON no corpo das requisições
app.use(express.json());
// Middleware para servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Configuração do Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Define a pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        // Cria um nome de arquivo único para evitar conflitos (timestamp + nome original)
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --- Simulação de Banco de Dados ---
// Por enquanto, vamos guardar os usuários em um array na memória.
// IMPORTANTE: Isso será perdido toda vez que o servidor reiniciar. É apenas temporário.
const users = [];
const posts = []; // Novo array para guardar as postagens com fotos

// --- Definição das Rotas (Endpoints) ---

// Rota de Teste
app.get('/api', (req, res) => {
    res.json({ message: 'Olá! O backend da Cápsula Familiar está no ar!' });
});

// Rota para Registro de Usuários (ainda vazia)
app.post('/api/register', async (req, res) => {
    try {
        // 1. Extrair dados do corpo da requisição
        const { name, email, password } = req.body;

        // 2. Validar se os dados foram recebidos
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Por favor, forneça nome, email e senha.' });
        }

        // 3. Verificar se o usuário já existe no nosso array
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({ message: 'Este email já está em uso.' }); // 409 Conflict
        }

        // 4. Criptografar a senha antes de salvar
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 5. Criar o objeto do novo usuário
        const newUser = {
            id: users.length + 1, // ID simples para simulação
            name: name,
            email: email,
            password: hashedPassword // Salvar a senha criptografada
        };

        // 6. "Salvar" o usuário no nosso array
        users.push(newUser);
        console.log('Usuários no sistema:', users); // Log para vermos o que está acontecendo

        // 7. Enviar uma resposta de sucesso (201 = Created)
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
});

// Rota para Login de Usuários (ainda vazia)
app.post('/api/login', (req, res) => {
    // Lógica de login virá aqui
    res.json({ message: 'Rota de login funcionando!' });
});

// Rota para criar um novo post com foto
app.post('/api/posts', upload.single('photo'), (req, res) => {
    // 'photo' deve ser o nome do campo <input type="file" name="photo"> no frontend
    try {
        const { description } = req.body; // Pega a descrição do post
        const imageUrl = `/uploads/${req.file.filename}`; // Pega o caminho do arquivo salvo

        const newPost = {
            id: posts.length + 1,
            description: description,
            imageUrl: imageUrl,
            createdAt: new Date()
        };

        posts.push(newPost);
        console.log('Novo post criado:', newPost);

        res.status(201).json(newPost);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar o post. Verifique se a foto foi enviada.' });
    }
});

// Rota para buscar todos os posts
app.get('/api/posts', (req, res) => {
    // Retorna os posts em ordem cronológica inversa (mais novos primeiro)
    res.json([...posts].reverse());
});

// 4. Iniciar o servidor para ouvir na porta definida
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});