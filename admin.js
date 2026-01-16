// Admin Panel JavaScript
const API_URL = 'http://localhost:5000/api';

// Check if user is admin
async function checkAdminAccess() {
    console.log('🔐 Verificando acesso admin...');

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    console.log('User Info:', {
        hasToken: !!userInfo.token,
        email: userInfo.email,
        role: userInfo.role,
        name: userInfo.name
    });

    if (!userInfo.token) {
        console.log('❌ Sem token - redirecionando para login');
        alert('Você precisa fazer login primeiro.');
        window.location.href = '/login.html';
        return false;
    }

    if (userInfo.role !== 'admin') {
        console.log('❌ Não é admin - role:', userInfo.role);
        alert('Acesso negado. Apenas administradores podem acessar esta página.');
        window.location.href = '/index.html';
        return false;
    }

    console.log('✅ Acesso admin confirmado!');
    return true;
}

function getAuthHeaders() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
    };
    console.log('📡 Auth Headers:', { hasToken: !!userInfo.token });
    return headers;
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
    console.log('📊 Carregando estatísticas...');
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Carregando estatísticas...</div>';

    try {
        const url = `${API_URL}/admin/stats`;
        console.log('📡 Fazendo requisição para:', url);

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        console.log('📥 Resposta recebida:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const stats = await response.json();
        console.log('✅ Estatísticas carregadas:', stats);
        renderStats(stats);
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="color: var(--error); font-size: 18px; margin-bottom: 10px;">❌ Erro ao carregar estatísticas</div>
                <div style="color: var(--text-secondary);">${error.message}</div>
                <button class="btn btn-primary" onclick="loadStats()" style="margin-top: 20px;">Tentar Novamente</button>
            </div>
        `;
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
    console.log('👥 Carregando usuários...');
    const list = document.getElementById('users-list');
    list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Carregando usuários...</div>';

    try {
        const url = `${API_URL}/admin/users`;
        console.log('📡 Fazendo requisição para:', url);

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        console.log('📥 Resposta recebida:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Usuários carregados:', data);

        if (!data.users || data.users.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="color: var(--text-secondary); font-size: 18px;">👥 Nenhum usuário encontrado</div>
                </div>
            `;
            return;
        }

        renderUsers(data.users);
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        list.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="color: var(--error); font-size: 18px; margin-bottom: 10px;">❌ Erro ao carregar usuários</div>
                <div style="color: var(--text-secondary);">${error.message}</div>
                <button class="btn btn-primary" onclick="loadUsers()" style="margin-top: 20px;">Tentar Novamente</button>
            </div>
        `;
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
    const grid = document.getElementById('themes-grid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Carregando temas...</div>';

    try {
        const response = await fetch(`${API_URL}/admin/themes`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const themes = await response.json();
        console.log('Temas carregados:', themes); // Debug log

        if (!themes || themes.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div style="color: var(--text-secondary); font-size: 18px;">🎨 Nenhum tema criado ainda</div>
                    <div style="color: var(--text-secondary); margin-top: 10px;">Clique em "Criar Novo Tema" para começar</div>
                </div>
            `;
            return;
        }

        renderThemes(themes);
    } catch (error) {
        console.error('Erro ao carregar temas:', error);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="color: var(--error); font-size: 18px; margin-bottom: 10px;">❌ Erro ao carregar temas</div>
                <div style="color: var(--text-secondary);">${error.message}</div>
                <button class="btn btn-primary" onclick="loadThemes()" style="margin-top: 20px;">Tentar Novamente</button>
            </div>
        `;
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

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Tema ativado:', result);

        alert('✅ Tema ativado! Todos os usuários verão as mudanças.');
        loadThemes();

        // Refresh theme on current page to preview
        if (window.loadActiveTheme) {
            window.loadActiveTheme();
        }
    } catch (error) {
        console.error('Erro ao ativar tema:', error);
        alert(`❌ Erro ao ativar tema: ${error.message}`);
    }
};

window.deactivateTheme = async () => {
    try {
        const response = await fetch(`${API_URL}/admin/themes/deactivate-all`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Tema desativado:', result);

        alert('✅ Tema desativado! Sistema voltou ao tema padrão.');
        loadThemes();

        // Refresh theme on current page to preview
        if (window.removeTheme) {
            window.removeTheme();
        }
    } catch (error) {
        console.error('Erro ao desativar tema:', error);
        alert(`❌ Erro ao desativar tema: ${error.message}`);
    }
};

window.deleteTheme = async (themeId) => {
    if (!confirm('⚠️ Deletar este tema permanentemente?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/themes/${themeId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Tema deletado:', result);

        alert('✅ Tema deletado com sucesso!');
        loadThemes();
    } catch (error) {
        console.error('Erro ao deletar tema:', error);
        alert(`❌ Erro ao deletar tema: ${error.message}`);
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
            secondary: document.getElementById('theme-secondary').value,
            accent: document.getElementById('theme-primary').value // Use primary as accent for now
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ${response.status}`);
        }

        const result = await response.json();
        console.log('Tema criado:', result);

        alert('✅ Tema criado com sucesso!');
        document.getElementById('theme-modal').classList.remove('active');
        document.getElementById('theme-form').reset();
        loadThemes();
    } catch (error) {
        console.error('Erro ao criar tema:', error);
        alert(`❌ Erro ao criar tema: ${error.message}`);
    }
});

// Initialize
checkAdminAccess().then(isAdmin => {
    if (isAdmin) {
        loadStats();
    }
});
