// Create First Admin User
// Usage: node backend/utils/createAdmin.js

const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        // Check if user already exists
        const existingUser = await User.findOne({ email: 'adsonvicente@admin.com' });

        if (existingUser) {
            console.log('⚠️  Usuário já existe. Promovendo a admin...');
            existingUser.role = 'admin';
            await existingUser.save();
            console.log('✅ Usuário promovido a admin com sucesso!');
            process.exit(0);
        }

        // Create new admin user
        const adminUser = await User.create({
            name: 'adsonvicente',
            email: 'adsonvicente@admin.com',
            password: 'adson123',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Adson+Vicente&background=3B82F6&color=fff&size=150'
        });

        console.log('✅ Usuário admin criado com sucesso!');
        console.log('\n📋 Credenciais:');
        console.log(`   Email: adsonvicente@admin.com`);
        console.log(`   Senha: adson123`);
        console.log(`   Nome: adsonvicente`);
        console.log(`   Role: admin`);
        console.log('\n🔐 Faça login com essas credenciais para acessar o painel admin!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

createAdmin();
