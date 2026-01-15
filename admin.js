// Admin Panel JavaScript
const API_URL = 'http://localhost:5000/api';

// Check if user is admin
async function checkAdminAccess() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo.token) {
        window.location.href = '/login.html';
        return false;
    }

    if (userInfo.role !== 'admin') {
        alert('Acesso negado. Apenas administradores.');
        window.location.href = '/index.html';
        return false;
    }

    return true;
}

function getAuthHeaders() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
    };
}

// Tab switching
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const panelId = `${tab.dataset.tab}-panel`;
        document.getElementById(panelId).classList.add('active');

        // Load data for the panel
        if (tab.dataset.tab === 'dashboard') loadStats();
        if (tab.dataset.tab === 'users') loadUsers();
        if (tab.dataset.tab === 'themes') loadThemes();
    });
});

// Load dashboard stats
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const stats = await response.json();
            renderStats(stats);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

function renderStats(stats) {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total de Usuários</div>
      <div class="stat-value">${stats.totalUsers || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Posts Criados</div>
      <div class="stat-value">${stats.totalPosts || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Espaços Ativos</div>
      <div class="stat-value">${stats.totalSpaces || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Usuários Online</div>
      <div class="stat-value">${stats.usersOnline || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Novos Usuários Hoje</div>
      <div class="stat-value">${stats.newUsersToday || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Novos Posts Hoje</div>
      <div class="stat-value">${stats.newPostsToday || 0}</div>
    </div>
  `;
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            renderUsers(data.users);
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function renderUsers(users) {
    const list = document.getElementById('users-list');
    list.innerHTML = users.map(user => `
    <div class="stat-card" style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <img src="${user.avatar}" style="width: 50px; height: 50px; border-radius: 50%;">
        <div style="flex: 1;">
          <strong>${user.name}</strong>
          <div style="color: var(--text-secondary); font-size: 14px;">${user.email}</div>
          <div style="margin-top: 4px;">
            <span style="background: ${user.role === 'admin' ? 'var(--primary)' : 'var(--bg-hover)'}; color: ${user.role === 'admin' ? 'white' : 'var(--text-main)'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          ${user.role !== 'admin' ? `
            <button class="btn btn-secondary" onclick="promoteUser('${user._id}')">
              Promover a Admin
            </button>
          ` : `
            <button class="btn btn-secondary" onclick="demoteUser('${user._id}')">
              Rebaixar
            </button>
          `}
        </div>
      </div>
    </div>
  `).join('');
}

window.promoteUser = async (userId) => {
    if (!confirm('Promover este usuário a administrador?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role: 'admin' })
        });

        if (response.ok) {
            alert('Usuário promovido com sucesso!');
            loadUsers();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
};

window.demoteUser = async (userId) => {
    if (!confirm('Rebaixar este administrador?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role: 'user' })
        });

        if (response.ok) {
            alert('Usuário rebaixado com sucesso!');
            loadUsers();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
};

// Load themes
async function loadThemes() {
    try {
        const response = await fetch(`${API_URL}/admin/themes`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const themes = await response.json();
            renderThemes(themes);
        }
    } catch (error) {
        console.error('Erro ao carregar temas:', error);
    }
}

function renderThemes(themes) {
    const grid = document.getElementById('themes-grid');
    grid.innerHTML = themes.map(theme => `
    <div class="theme-card ${theme.isActive ? 'active' : ''}">
      <h3>${theme.name} ${theme.isActive ? '✨' : ''}</h3>
      <div class="theme-colors">
        <div class="color-swatch" style="background: ${theme.colors.primary}"></div>
        <div class="color-swatch" style="background: ${theme.colors.secondary}"></div>
        <div class="color-swatch" style="background: ${theme.colors.accent}"></div>
      </div>
      <div style="color: var(--text-secondary); font-size: 14px; margin: 8px 0;">
        Partículas: ${theme.decorations.particleType || 'nenhuma'}
      </div>
      <div style="display: flex; gap: 8px; margin-top: 16px;">
        ${!theme.isActive ? `
          <button class="btn btn-primary" onclick="activateTheme('${theme._id}')">
            Ativar
          </button>
        ` : `
          <button class="btn btn-secondary" onclick="deactivateTheme()">
            Desativar
          </button>
        `}
        <button class="btn btn-danger" onclick="deleteTheme('${theme._id}')">
          Deletar
        </button>
      </div>
    </div>
  `).join('');
}

window.activateTheme = async (themeId) => {
    try {
        const response = await fetch(`${API_URL}/admin/themes/${themeId}/activate`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Tema ativado! Todos os usuários verão as mudanças.');
            loadThemes();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
};

window.deactivateTheme = async () => {
    try {
        const response = await fetch(`${API_URL}/admin/themes/deactivate-all`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Tema desativado!');
            loadThemes();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
};

window.deleteTheme = async (themeId) => {
    if (!confirm('Deletar este tema permanentemente?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/themes/${themeId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Tema deletado!');
            loadThemes();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
};

// Theme creation modal
document.getElementById('create-theme-btn').addEventListener('click', () => {
    document.getElementById('theme-modal').classList.add('active');
});

document.getElementById('cancel-theme-btn').addEventListener('click', () => {
    document.getElementById('theme-modal').classList.remove('active');
});

document.getElementById('theme-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const theme = {
        name: document.getElementById('theme-name').value,
        slug: document.getElementById('theme-slug').value,
        colors: {
            primary: document.getElementById('theme-primary').value,
            secondary: document.getElementById('theme-secondary').value
        },
        decorations: {
            particles: document.getElementById('theme-particles').value !== 'none',
            particleType: document.getElementById('theme-particles').value
        }
    };

    try {
        const response = await fetch(`${API_URL}/admin/themes`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(theme)
        });

        if (response.ok) {
            alert('Tema criado com sucesso!');
            document.getElementById('theme-modal').classList.remove('active');
            document.getElementById('theme-form').reset();
            loadThemes();
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao criar tema');
    }
});

// Initialize
checkAdminAccess().then(isAdmin => {
    if (isAdmin) {
        loadStats();
    }
});
