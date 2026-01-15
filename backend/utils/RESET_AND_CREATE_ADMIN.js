// SOLUÇÃO DEFINITIVA - Deletar tudo e recriar
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function resetAndCreateAdmin() {
    try {
        console.log('🔄 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado!\n');

        // DELETAR TODOS OS USUÁRIOS
        console.log('🗑️  DELETANDO TODOS OS USUÁRIOS...');
        const result = await mongoose.connection.db.collection('users').deleteMany({});
        console.log(`✅ ${result.deletedCount} usuários deletados\n`);

        // CRIAR NOVO ADMIN
        console.log('👤 Criando novo usuário admin...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('adson123', salt);

        const admin = {
            name: 'Adson Vicente',
            email: 'adsonvicente@admin.com',
            password: hashedPassword,
            role: 'admin',
            avatar: 'https://i.pravatar.cc/150?img=12',
            avatarPosX: 50,
            avatarPosY: 50,
            bannerUrl: 'https://placehold.co/1200x400/667eea/FFFFFF&text=Admin',
            connections: [],
            isSuspended: false,
            lastSeen: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const insertResult = await mongoose.connection.db.collection('users').insertOne(admin);
        console.log('✅ Admin criado com ID:', insertResult.insertedId);

        // VERIFICAR
        console.log('\n🔍 Verificando...');
        const verified = await mongoose.connection.db.collection('users').findOne({ email: 'adsonvicente@admin.com' });

        console.log('\n📋 Dados do admin:');
        console.log('   ID:', verified._id);
        console.log('   Nome:', verified.name);
        console.log('   Email:', verified.email);
        console.log('   Role:', verified.role);
        console.log('   Password hash:', verified.password.substring(0, 30) + '...');

        if (verified.role === 'admin') {
            console.log('\n✅✅✅ SUCESSO TOTAL!');
            console.log('\n🔐 Credenciais:');
            console.log('   Email: adsonvicente@admin.com');
            console.log('   Senha: adson123');
            console.log('\n💡 AGORA:');
            console.log('   1. Feche TODAS as abas do navegador');
            console.log('   2. Abra uma nova aba');
            console.log('   3. Acesse http://localhost:5000/login.html');
            console.log('   4. Faça login');
            console.log('   5. O "Painel Admin" DEVE aparecer!');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    }
}

resetAndCreateAdmin();
