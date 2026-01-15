// DIAGNÓSTICO FINAL - Ver exatamente o que está no banco
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

async function diagnose() {
    try {
        console.log('🔄 Conectando...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado!\n');

        // Buscar TODOS os usuários
        const users = await mongoose.connection.db.collection('users').find({}).toArray();

        console.log(`📊 Total de usuários no banco: ${users.length}\n`);

        users.forEach((user, index) => {
            console.log(`\n👤 Usuário ${index + 1}:`);
            console.log(`   _id: ${user._id}`);
            console.log(`   name: ${user.name}`);
            console.log(`   email: ${user.email}`);
            console.log(`   role: ${user.role} (tipo: ${typeof user.role})`);
            console.log(`   password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);
        });

        // Buscar especificamente o admin
        console.log('\n\n🔍 Buscando adsonvicente@admin.com...');
        const admin = await mongoose.connection.db.collection('users').findOne({ email: 'adsonvicente@admin.com' });

        if (admin) {
            console.log('\n✅ ENCONTRADO!');
            console.log(JSON.stringify(admin, null, 2));
        } else {
            console.log('\n❌ NÃO ENCONTRADO!');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    }
}

diagnose();
