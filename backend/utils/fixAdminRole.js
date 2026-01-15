// Fix Admin Role - Update user in database
const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function fixAdminRole() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB\n');

        // Find user by email
        const user = await User.findOne({ email: 'adsonvicente@admin.com' });

        if (!user) {
            console.log('❌ Usuário não encontrado!');
            console.log('💡 Crie o usuário primeiro com: node backend/utils/createAdmin.js');
            process.exit(1);
        }

        console.log(`📋 Usuário encontrado:`);
        console.log(`   Nome: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role atual: ${user.role || 'user'}`);

        // Update role to admin
        user.role = 'admin';
        await user.save();

        console.log('\n✅ Role atualizado para ADMIN com sucesso!');
        console.log('\n🔐 Agora faça:');
        console.log('1. Faça logout no navegador');
        console.log('2. Faça login novamente');
        console.log('3. Você verá "Painel Admin" no menu!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

fixAdminRole();
