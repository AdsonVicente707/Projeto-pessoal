// Complete Admin Setup Script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/projeto-pessoal';

async function setupAdmin() {
    try {
        console.log('🚀 Iniciando configuração do Admin...\n');
        console.log(`📍 Conectando ao MongoDB: ${MONGO_URI}`);

        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado ao MongoDB!\n');

        // Define User schema inline to avoid model conflicts
        const userSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: String,
            role: { type: String, default: 'user' },
            avatar: String,
            avatarPosX: Number,
            avatarPosY: Number,
            bannerUrl: String,
            bio: String,
            createdAt: { type: Date, default: Date.now }
        });

        // Clear existing model if it exists
        if (mongoose.models.User) {
            delete mongoose.models.User;
        }

        const User = mongoose.model('User', userSchema);

        const adminEmail = 'adsonvicente@admin.com';
        const adminPassword = 'adson123';

        // Check if admin already exists
        console.log('🔍 Verificando se admin já existe...');
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('📋 Admin encontrado:');
            console.log(`   ID: ${existingAdmin._id}`);
            console.log(`   Nome: ${existingAdmin.name}`);
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Role: ${existingAdmin.role}`);

            if (existingAdmin.role !== 'admin') {
                console.log('\n⚠️  Role incorreto! Atualizando para admin...');
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Role atualizado para admin!');
            } else {
                console.log('✅ Admin já está configurado corretamente!');
            }

            // Update password to ensure it's correct
            console.log('\n🔐 Atualizando senha para garantir acesso...');
            const salt = await bcrypt.genSalt(10);
            existingAdmin.password = await bcrypt.hash(adminPassword, salt);
            await existingAdmin.save();
            console.log('✅ Senha atualizada!');
        } else {
            console.log('❌ Admin não encontrado. Criando novo usuário admin...\n');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const newAdmin = await User.create({
                name: 'Adson Vicente',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                avatar: 'https://i.pravatar.cc/150?img=12',
                avatarPosX: 50,
                avatarPosY: 50,
                bio: 'Administrador do sistema'
            });

            console.log('✅ Admin criado com sucesso!');
            console.log(`   ID: ${newAdmin._id}`);
            console.log(`   Nome: ${newAdmin.name}`);
            console.log(`   Email: ${newAdmin.email}`);
            console.log(`   Role: ${newAdmin.role}`);
        }

        // Verify final state
        console.log('\n🔍 Verificação final...');
        const finalAdmin = await User.findOne({ email: adminEmail });

        if (finalAdmin && finalAdmin.role === 'admin') {
            console.log('✅✅✅ SUCESSO TOTAL!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔐 CREDENCIAIS DE ADMIN:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Senha: ${adminPassword}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('📝 PRÓXIMOS PASSOS:');
            console.log('   1. Inicie o servidor: npm start');
            console.log('   2. Acesse: http://localhost:5000/login.html');
            console.log('   3. Faça login com as credenciais acima');
            console.log('   4. Acesse o painel admin: http://localhost:5000/admin.html\n');
        } else {
            console.log('❌ ERRO: Algo deu errado na verificação final!');
        }

        // Show all users for debugging
        console.log('👥 Todos os usuários no banco:');
        const allUsers = await User.find().select('name email role');
        allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Conexão fechada.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupAdmin();
