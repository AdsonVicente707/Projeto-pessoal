// SOLUÇÃO DEFINITIVA - Verificar e Corrigir Admin
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function fixAdmin() {
    try {
        console.log('🔄 Conectando ao MongoDB...');
        console.log(`📍 URI: ${MONGODB_URI}\n`);

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado!\n');

        // Definir schema manualmente para garantir
        const userSchema = new mongoose.Schema({
            name: String,
            email: String,
            password: String,
            role: { type: String, default: 'user' },
            avatar: String,
            avatarPosX: Number,
            avatarPosY: Number,
            bannerUrl: String
        });

        const User = mongoose.model('User', userSchema);

        const email = 'adsonvicente@admin.com';

        // Deletar usuário existente
        console.log('🗑️  Deletando usuário existente...');
        await User.deleteMany({ email });
        console.log('✅ Usuário deletado\n');

        // Criar novo usuário com senha hash
        console.log('👤 Criando novo usuário admin...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('adson123', salt);

        const newUser = await User.create({
            name: 'Adson Vicente',
            email: 'adsonvicente@admin.com',
            password: hashedPassword,
            role: 'admin',
            avatar: 'https://i.pravatar.cc/150?img=12',
            avatarPosX: 50,
            avatarPosY: 50
        });

        console.log('✅ Usuário criado com sucesso!\n');
        console.log('📋 Detalhes:');
        console.log(`   ID: ${newUser._id}`);
        console.log(`   Nome: ${newUser.name}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Role: ${newUser.role}`);
        console.log(`   Password Hash: ${newUser.password.substring(0, 20)}...`);

        // Verificar
        console.log('\n🔍 Verificando...');
        const verified = await User.findOne({ email });
        console.log(`   Role no banco: ${verified.role}`);
        console.log(`   Tipo: ${typeof verified.role}`);

        if (verified.role === 'admin') {
            console.log('\n✅✅✅ SUCESSO TOTAL!');
            console.log('\n🔐 Credenciais:');
            console.log('   Email: adsonvicente@admin.com');
            console.log('   Senha: adson123');
            console.log('\n💡 IMPORTANTE:');
            console.log('   1. Faça LOGOUT no navegador');
            console.log('   2. Limpe o cache (Ctrl+Shift+Delete)');
            console.log('   3. Faça LOGIN novamente');
            console.log('   4. O link "Painel Admin" DEVE aparecer!');
        } else {
            console.log('\n❌ ERRO: Role não é admin!');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    }
}

fixAdmin();
