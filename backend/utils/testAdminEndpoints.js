// Test Admin Endpoints Script
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/projeto-pessoal';

async function testEndpoints() {
    try {
        console.log('🧪 Testando endpoints do Admin Panel...\n');
        console.log(`📍 Conectando ao MongoDB: ${MONGO_URI}`);

        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado ao MongoDB!\n');

        // Import models
        const User = require('../models/userModel');
        const Post = require('../models/postModel');
        const Space = require('../models/spaceModel');
        const Theme = require('../models/themeModel');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 TESTE 1: Stats Endpoint');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const totalSpaces = await Space.countDocuments();

        console.log(`✅ Total de Usuários: ${totalUsers}`);
        console.log(`✅ Total de Posts: ${totalPosts}`);
        console.log(`✅ Total de Espaços: ${totalSpaces}`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👥 TESTE 2: Users Endpoint');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const users = await User.find().select('-password').limit(10);
        console.log(`✅ Encontrados ${users.length} usuários:`);
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name} (${user.email})`);
            console.log(`      Role: ${user.role || 'user'}`);
            console.log(`      ID: ${user._id}`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎨 TESTE 3: Themes Endpoint');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const themes = await Theme.find();
        console.log(`✅ Encontrados ${themes.length} temas:`);
        if (themes.length === 0) {
            console.log('   ℹ️  Nenhum tema criado ainda (isso é normal)');
        } else {
            themes.forEach((theme, index) => {
                console.log(`   ${index + 1}. ${theme.name} (${theme.slug})`);
                console.log(`      Ativo: ${theme.isActive ? 'Sim ✨' : 'Não'}`);
                console.log(`      Cores: ${theme.colors.primary}, ${theme.colors.secondary}`);
            });
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 TESTE 4: Admin User Verification');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const adminUser = await User.findOne({ email: 'adsonvicente@admin.com' });
        if (adminUser) {
            console.log('✅ Usuário admin encontrado:');
            console.log(`   Nome: ${adminUser.name}`);
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Role: ${adminUser.role}`);
            console.log(`   ID: ${adminUser._id}`);

            if (adminUser.role === 'admin') {
                console.log('\n✅✅✅ Admin configurado corretamente!');
            } else {
                console.log('\n❌ ERRO: Role não é admin!');
            }
        } else {
            console.log('❌ Usuário admin NÃO encontrado!');
            console.log('   Execute: node backend/utils/setupAdmin.js');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ TODOS OS TESTES CONCLUÍDOS!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testEndpoints();
