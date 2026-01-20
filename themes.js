// Theme System - Apply seasonal themes dynamically
import { API_URL, getAuthHeaders } from './api.js';

let currentTheme = null;
let particlesInterval = null;

// Load and apply active theme
export async function loadActiveTheme() {
    try {
        const response = await fetch(`${API_URL}/themes/active`);
        if (response.ok) {
            const theme = await response.json();
            if (theme) {
                applyTheme(theme);
            }
        }
    } catch (error) {
        console.log('No active theme');
    }
}

// Apply theme to the page
export function applyTheme(theme) {
    if (!theme) return;

    currentTheme = theme;
    const root = document.documentElement;

    // Apply colors
    if (theme.colors) {
        root.style.setProperty('--primary', theme.colors.primary);
        root.style.setProperty('--secondary', theme.colors.secondary);
        root.style.setProperty('--accent', theme.colors.accent);
        if (theme.colors.background) {
            root.style.setProperty('--bg-body', theme.colors.background);
        }
    }

    // Apply background (color or image)
    if (theme.background) {
        if (theme.background.type === 'image' && theme.background.value) {
            // Apply background image
            const opacity = theme.background.opacity || 1;
            const size = theme.background.size || 'cover';
            const position = theme.background.position || 'center';
            const repeat = theme.background.repeat || 'no-repeat';

            // Create or update background overlay
            let bgOverlay = document.getElementById('theme-background-overlay');
            if (!bgOverlay) {
                bgOverlay = document.createElement('div');
                bgOverlay.id = 'theme-background-overlay';
                bgOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    pointer-events: none;
                `;
                document.body.prepend(bgOverlay);
            }

            bgOverlay.style.backgroundImage = `url(${theme.background.value})`;
            bgOverlay.style.backgroundSize = size;
            bgOverlay.style.backgroundPosition = position;
            bgOverlay.style.backgroundRepeat = repeat;
            bgOverlay.style.opacity = opacity;
            bgOverlay.style.backgroundAttachment = 'fixed';

            console.log(`🖼️ Imagem de fundo aplicada: ${theme.background.value}`);
        } else if (theme.background.type === 'color' && theme.background.value) {
            // Apply solid color background
            document.body.style.backgroundColor = theme.background.value;

            // Remove image overlay if exists
            const bgOverlay = document.getElementById('theme-background-overlay');
            if (bgOverlay) bgOverlay.remove();
        }
    }

    // Add theme class
    document.body.classList.add(`theme-${theme.slug}`);

    // Apply custom CSS
    if (theme.customCSS) {
        let styleEl = document.getElementById('theme-custom-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'theme-custom-css';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = theme.customCSS;
    }

    // Add header icon
    if (theme.decorations?.headerIcon) {
        addHeaderIcon(theme.decorations.headerIcon);
    }

    // Add particles
    if (theme.decorations?.particles && theme.decorations?.particleType !== 'none') {
        addParticles(theme.decorations.particleType);
    }

    console.log(`✨ Tema "${theme.name}" aplicado!`);
}

// Remove current theme
export function removeTheme() {
    if (!currentTheme) return;

    const root = document.documentElement;

    // Reset colors to default
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--bg-body');

    // Remove background overlay
    const bgOverlay = document.getElementById('theme-background-overlay');
    if (bgOverlay) bgOverlay.remove();

    // Reset body background
    document.body.style.backgroundColor = '';

    // Remove theme class
    document.body.classList.remove(`theme-${currentTheme.slug}`);

    // Remove custom CSS
    const styleEl = document.getElementById('theme-custom-css');
    if (styleEl) styleEl.remove();

    // Remove header icon
    removeHeaderIcon();

    // Remove particles
    removeParticles();

    currentTheme = null;
    console.log('Tema removido');
}

// Add decorative icon to header
function addHeaderIcon(iconClass) {
    const sidebar = document.querySelector('.sidebar h1');
    if (!sidebar) return;

    let iconEl = document.getElementById('theme-header-icon');
    if (!iconEl) {
        iconEl = document.createElement('i');
        iconEl.id = 'theme-header-icon';
        iconEl.style.marginLeft = '10px';
        sidebar.appendChild(iconEl);
    }

    iconEl.className = iconClass;
}

function removeHeaderIcon() {
    const iconEl = document.getElementById('theme-header-icon');
    if (iconEl) iconEl.remove();
}

// Add animated particles
function addParticles(type) {
    removeParticles(); // Remove existing first

    const container = document.createElement('div');
    container.id = 'theme-particles';
    container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;

    document.body.appendChild(container);

    // Create particles based on type
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => createParticle(type, container), i * 100);
    }

    // Keep creating particles
    particlesInterval = setInterval(() => {
        if (container.children.length < particleCount) {
            createParticle(type, container);
        }
    }, 2000);
}

function createParticle(type, container) {
    const particle = document.createElement('div');
    particle.className = `particle particle-${type}`;

    const startX = Math.random() * 100;
    const duration = 5 + Math.random() * 10;
    const size = type === 'snow' ? 5 + Math.random() * 10 : 8 + Math.random() * 15;

    particle.style.cssText = `
    position: absolute;
    left: ${startX}%;
    top: -20px;
    width: ${size}px;
    height: ${size}px;
    opacity: ${0.3 + Math.random() * 0.7};
    animation: fall ${duration}s linear;
  `;

    // Particle appearance based on type
    switch (type) {
        case 'snow':
            particle.style.background = 'white';
            particle.style.borderRadius = '50%';
            particle.style.boxShadow = '0 0 10px rgba(255,255,255,0.8)';
            break;
        case 'confetti':
            const colors = ['#FF6B35', '#F7B801', '#6A0572', '#FF1493', '#00CED1'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
            break;
        case 'hearts':
            particle.innerHTML = '❤️';
            particle.style.fontSize = `${size}px`;
            break;
        case 'flowers':
            const flowers = ['🌸', '🌺', '🌼', '🌻', '🌷'];
            particle.innerHTML = flowers[Math.floor(Math.random() * flowers.length)];
            particle.style.fontSize = `${size}px`;
            break;
        case 'bats':
            particle.innerHTML = '🦇';
            particle.style.fontSize = `${size}px`;
            break;
    }

    container.appendChild(particle);

    // Remove after animation
    setTimeout(() => particle.remove(), duration * 1000);
}

function removeParticles() {
    const container = document.getElementById('theme-particles');
    if (container) container.remove();

    if (particlesInterval) {
        clearInterval(particlesInterval);
        particlesInterval = null;
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fall {
    to {
      transform: translateY(100vh) translateX(${Math.random() * 100 - 50}px);
    }
  }
  
  .particle-confetti {
    animation: fall linear, spin 2s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Auto-load theme on page load
if (typeof window !== 'undefined') {
    loadActiveTheme();
}

// Export functions
window.loadActiveTheme = loadActiveTheme;
window.applyTheme = applyTheme;
window.removeTheme = removeTheme;
