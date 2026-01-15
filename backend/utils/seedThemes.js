// Pre-configured Seasonal Themes
// Run this script to populate the database with default themes
// Usage: node backend/utils/seedThemes.js

const mongoose = require('mongoose');
const Theme = require('../models/themeModel');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rede-social-familiar';

const defaultThemes = [
    {
        name: 'Natal 2026',
        slug: 'christmas',
        isActive: false,
        colors: {
            primary: '#C41E3A',
            secondary: '#165B33',
            accent: '#FFD700',
            background: '#F8FAFC'
        },
        decorations: {
            headerIcon: 'fas fa-tree',
            particles: true,
            particleType: 'snow'
        },
        customCSS: `
      .theme-christmas .sidebar h1 {
        background: linear-gradient(135deg, #C41E3A 0%, #165B33 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    `
    },
    {
        name: 'Páscoa 2026',
        slug: 'easter',
        isActive: false,
        colors: {
            primary: '#FF69B4',
            secondary: '#9370DB',
            accent: '#FFD700',
            background: '#FFF5F7'
        },
        decorations: {
            headerIcon: 'fas fa-egg',
            particles: true,
            particleType: 'flowers'
        },
        customCSS: `
      .theme-easter .sidebar h1 {
        background: linear-gradient(135deg, #FF69B4 0%, #9370DB 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    `
    },
    {
        name: 'Carnaval 2026',
        slug: 'carnival',
        isActive: false,
        colors: {
            primary: '#FF6B35',
            secondary: '#F7B801',
            accent: '#6A0572',
            background: '#FFF9F0'
        },
        decorations: {
            headerIcon: 'fas fa-masks-theater',
            particles: true,
            particleType: 'confetti'
        },
        customCSS: `
      .theme-carnival .sidebar h1 {
        background: linear-gradient(135deg, #FF6B35 0%, #F7B801 50%, #6A0572 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    `
    },
    {
        name: 'Dia dos Namorados',
        slug: 'valentines',
        isActive: false,
        colors: {
            primary: '#FF1493',
            secondary: '#DC143C',
            accent: '#FFB6C1',
            background: '#FFF0F5'
        },
        decorations: {
            headerIcon: 'fas fa-heart',
            particles: true,
            particleType: 'hearts'
        },
        customCSS: `
      .theme-valentines .sidebar h1 {
        background: linear-gradient(135deg, #FF1493 0%, #DC143C 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    `
    },
    {
        name: 'Halloween',
        slug: 'halloween',
        isActive: false,
        colors: {
            primary: '#FF8C00',
            secondary: '#8B008B',
            accent: '#000000',
            background: '#1A1A1A'
        },
        decorations: {
            headerIcon: 'fas fa-ghost',
            particles: true,
            particleType: 'bats'
        },
        customCSS: `
      .theme-halloween .sidebar h1 {
        background: linear-gradient(135deg, #FF8C00 0%, #8B008B 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .theme-halloween body {
        --bg-body: #1A1A1A;
        --text-main: #FAFAFA;
      }
    `
    }
];

async function seedThemes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        // Get first user to be the creator
        const User = require('../models/userModel');
        const firstUser = await User.findOne();

        if (!firstUser) {
            console.log('⚠️  Nenhum usuário encontrado. Crie um usuário primeiro.');
            process.exit(1);
        }

        // Clear existing themes
        await Theme.deleteMany({});
        console.log('🗑️  Temas antigos removidos');

        // Insert default themes
        const themes = defaultThemes.map(theme => ({
            ...theme,
            createdBy: firstUser._id
        }));

        await Theme.insertMany(themes);
        console.log(`✅ ${themes.length} temas criados com sucesso!`);

        console.log('\n📋 Temas disponíveis:');
        themes.forEach(theme => {
            console.log(`  - ${theme.name} (${theme.slug})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

seedThemes();
