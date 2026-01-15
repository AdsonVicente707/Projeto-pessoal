// Diagnostic Script - Check MongoDB Connection and Users
const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function diagnose() {
    try {
        console.log('🔍 Tentando conectar ao MongoDB...');
        console.log(`📍 URI: ${MONGODB_URI}`);

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB com sucesso!\n');

        // List all users
        const users = await User.find().select('-password');
        console.log(`👥 Total de usuários no banco: ${users.length}\n`);

        if (users.length === 0) {
            console.log('⚠️  Nenhum usuário encontrado no banco de dados.');
            console.log('💡 Solução: Registre-se normalmente em http://localhost:5000/login.html');
            console.log('   Depois execute: node backend/utils/promoteToAdmin.js SEU_EMAIL\n');
        } else {
            console.log('📋 Usuários encontrados:');
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role || 'user'}`);
                console.log(`   ID: ${user._id}`);
            });

            const adminUser = users.find(u => u.email === 'adsonvicente@admin.com');
            if (adminUser) {
                console.log('\n✅ Usuário admin encontrado!');
                console.log('   Tente fazer login com:');
                console.log('   Email: adsonvicente@admin.com');
                console.log('   Senha: adson123');
            } else {
                console.log('\n⚠️  Usuário admin não encontrado.');
                console.log('💡 Execute: node backend/utils/createAdmin.js');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro ao conectar ao MongoDB:');
        console.error(error.message);
        console.log('\n💡 Possíveis soluções:');
        console.log('1. Verifique se o MongoDB está rodando');
        console.log('2. Verifique a variável MONGODB_URI no arquivo .env');
        console.log('3. Tente: net start MongoDB (Windows)');
        console.log('4. Ou use MongoDB Atlas (nuvem)');
        process.exit(1);
    }
}

diagnose();
