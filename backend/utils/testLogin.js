// Test Login - Verify credentials
const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function testLogin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB\n');

        const email = 'adsonvicente@admin.com';
        const password = 'adson123';

        console.log(`🔐 Testando login com:`);
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${password}\n`);

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ Usuário não encontrado!');
            console.log('💡 Execute: node backend/utils/createAdmin.js');
            process.exit(1);
        }

        console.log('✅ Usuário encontrado!');
        console.log(`   Nome: ${user.name}`);
        console.log(`   Role: ${user.role}`);

        // Test password
        const isMatch = await user.matchPassword(password);

        if (isMatch) {
            console.log('\n✅ Senha CORRETA!');
            console.log('\n📋 Você pode fazer login com:');
            console.log(`   Email: ${email}`);
            console.log(`   Senha: ${password}`);
            console.log('\n🌐 Acesse: http://localhost:5000/login.html');
        } else {
            console.log('\n❌ Senha INCORRETA!');
            console.log('💡 Vou resetar a senha para "adson123"...\n');

            user.password = 'adson123';
            await user.save();

            console.log('✅ Senha resetada com sucesso!');
            console.log('   Tente fazer login novamente.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

testLogin();
