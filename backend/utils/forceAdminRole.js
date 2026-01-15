// SCRIPT DEFINITIVO - Garantir Admin Role
const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function forceAdminRole() {
    try {
        console.log('🔄 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado!\n');

        const email = 'adsonvicente@admin.com';

        // Buscar usuário
        let user = await User.findOne({ email });

        if (!user) {
            console.log('❌ Usuário não encontrado. Criando...');
            user = await User.create({
                name: 'adsonvicente',
                email: 'adsonvicente@admin.com',
                password: 'adson123',
                role: 'admin'
            });
            console.log('✅ Usuário admin criado com sucesso!');
        } else {
            console.log(`📋 Usuário encontrado:`);
            console.log(`   Nome: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role ANTES: ${user.role || 'undefined'}`);

            // Forçar atualização
            user.role = 'admin';
            await user.save();

            console.log(`   Role DEPOIS: ${user.role}`);
            console.log('\n✅ Role atualizado para ADMIN!');
        }

        // Verificar novamente
        const verified = await User.findOne({ email });
        console.log('\n🔍 Verificação final:');
        console.log(`   Email: ${verified.email}`);
        console.log(`   Role: ${verified.role}`);
        console.log(`   ID: ${verified._id}`);

        if (verified.role === 'admin') {
            console.log('\n✅✅✅ SUCESSO! Usuário é ADMIN!');
            console.log('\n🔐 Faça login agora:');
            console.log('   Email: adsonvicente@admin.com');
            console.log('   Senha: adson123');
            console.log('\n💡 IMPORTANTE: Faça LOGOUT e LOGIN novamente no navegador!');
        } else {
            console.log('\n❌ ERRO: Role não foi salvo corretamente!');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    }
}

forceAdminRole();
