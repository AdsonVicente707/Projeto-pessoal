// Complete Test - Login and Admin Access
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/projeto-pessoal';
const JWT_SECRET = process.env.JWT_SECRET || 'minha_chave_secreta_super_segura_123';

async function testLoginFlow() {
    try {
        console.log('🧪 Testando fluxo completo de login admin...\n');
        console.log(`📍 Conectando ao MongoDB: ${MONGO_URI}`);

        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado ao MongoDB!\n');

        const User = require('../models/userModel');

        const email = 'adsonvicente@admin.com';
        const password = 'adson123';

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 TESTE 1: Buscar usuário admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ Usuário não encontrado!');
            console.log('   Execute: node backend/utils/setupAdmin.js');
            process.exit(1);
        }

        console.log('✅ Usuário encontrado:');
        console.log(`   Nome: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user._id}`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 TESTE 2: Verificar senha');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('❌ Senha incorreta!');
            console.log('   Execute: node backend/utils/setupAdmin.js');
            process.exit(1);
        }

        console.log('✅ Senha válida!');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎫 TESTE 3: Gerar token JWT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const token = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        console.log('✅ Token gerado com sucesso!');
        console.log(`   Token (primeiros 50 chars): ${token.substring(0, 50)}...`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 TESTE 4: Simular resposta de login');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const loginResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            avatarPosX: user.avatarPosX,
            avatarPosY: user.avatarPosY,
            token: token
        };

        console.log('✅ Resposta de login simulada:');
        console.log(JSON.stringify({
            ...loginResponse,
            token: loginResponse.token.substring(0, 30) + '...'
        }, null, 2));

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 TESTE 5: Verificar role de admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (loginResponse.role === 'admin') {
            console.log('✅ Role é admin - acesso ao painel permitido!');
        } else {
            console.log('❌ Role não é admin - acesso negado!');
            process.exit(1);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅✅✅ TODOS OS TESTES PASSARAM!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📝 RESUMO:');
        console.log('   ✅ Usuário admin existe no banco');
        console.log('   ✅ Senha está correta');
        console.log('   ✅ Token JWT pode ser gerado');
        console.log('   ✅ Role é admin');
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('   1. Inicie o servidor: npm start');
        console.log('   2. Abra: http://localhost:5000/login.html');
        console.log('   3. Login com:');
        console.log(`      Email: ${email}`);
        console.log(`      Senha: ${password}`);
        console.log('   4. Após login, acesse: http://localhost:5000/admin.html');
        console.log('   5. O painel admin deve carregar com todas as funcionalidades!\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testLoginFlow();
