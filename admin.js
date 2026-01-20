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

// Admin State Management
const adminState = {
    currentPage: 1,
    itemsPerPage: 20,
    totalPages: 1,
    totalUsers: 0,
    filters: {
        search: '',
        role: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    }
};

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
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
        if (tab.dataset.tab === 'users') {
            resetFilters();
            loadUsers();
            setupUserControls();
        }
        if (tab.dataset.tab === 'themes') loadThemes();
    });
});

// Setup all user controls (search, filters, pagination)
let controlsSetup = false;
function setupUserControls() {
    if (controlsSetup) return;

    // Search
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            adminState.filters.search = searchInput.value.trim();
            adminState.currentPage = 1;
            loadUsers();
        }, 500);
        searchInput.addEventListener('input', debouncedSearch);
    }

    // Role filter
    const roleFilter = document.getElementById('role-filter');
    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            adminState.filters.role = roleFilter.value;
            adminState.currentPage = 1;
            loadUsers();
        });
    }

    // Sort by
    const sortBy = document.getElementById('sort-by');
    if (sortBy) {
        sortBy.addEventListener('change', () => {
            const [field, order] = sortBy.value.split('-');
            adminState.filters.sortBy = field;
            adminState.filters.sortOrder = order;
            adminState.currentPage = 1;
            loadUsers();
        });
    }

    // Clear filters
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            resetFilters();
            loadUsers();
        });
    }

    // Items per page
    const itemsPerPage = document.getElementById('items-per-page');
    if (itemsPerPage) {
        itemsPerPage.addEventListener('change', () => {
            adminState.itemsPerPage = parseInt(itemsPerPage.value);
            adminState.currentPage = 1;
            loadUsers();
        });
    }

    // Pagination buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (adminState.currentPage > 1) {
                adminState.currentPage--;
                loadUsers();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (adminState.currentPage < adminState.totalPages) {
                adminState.currentPage++;
                loadUsers();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    controlsSetup = true;
    console.log('✅ Controles de usuário configurados');
}

function resetFilters() {
    adminState.currentPage = 1;
    adminState.filters = {
        search: '',
        role: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    };

    // Reset UI
    const searchInput = document.getElementById('user-search');
    const roleFilter = document.getElementById('role-filter');
    const sortBy = document.getElementById('sort-by');

    if (searchInput) searchInput.value = '';
    if (roleFilter) roleFilter.value = '';
    if (sortBy) sortBy.value = 'createdAt-desc';
}

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

// Load users with pagination and filters
async function loadUsers() {
    console.log('👥 Carregando usuários...', adminState);
    const list = document.getElementById('users-list');
    list.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid var(--bg-hover); 
                 border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
            <div style="color: var(--text-secondary); font-size: 15px;">Carregando usuários...</div>
        </div>
    `;

    try {
        // Build query string
        const params = new URLSearchParams();
        params.append('page', adminState.currentPage);
        params.append('limit', adminState.itemsPerPage);

        if (adminState.filters.search) {
            params.append('search', adminState.filters.search);
        }
        if (adminState.filters.role) {
            params.append('role', adminState.filters.role);
        }

        const url = `${API_URL}/admin/users?${params.toString()}`;
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

        // Update state
        adminState.totalPages = data.totalPages || 1;
        adminState.totalUsers = data.total || 0;

        if (!data.users || data.users.length === 0) {
            const hasFilters = adminState.filters.search || adminState.filters.role;
            list.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">👥</div>
                    <div style="color: var(--text-main); font-size: 20px; font-weight: 600; margin-bottom: 8px;">
                        ${hasFilters ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 14px;">
                        ${hasFilters ? 'Tente ajustar os filtros ou pesquisa' : 'Ainda não há membros na família'}
                    </div>
                </div>
            `;
            hidePagination();
            return;
        }

        // Sort users client-side if needed
        let sortedUsers = [...data.users];
        if (adminState.filters.sortBy && adminState.filters.sortOrder) {
            sortedUsers.sort((a, b) => {
                let aVal = a[adminState.filters.sortBy];
                let bVal = b[adminState.filters.sortBy];

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (adminState.filters.sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }

        renderUsers(sortedUsers);
        renderPagination();
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        list.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <div style="color: var(--error); font-size: 18px; font-weight: 600; margin-bottom: 10px;">Erro ao carregar usuários</div>
                <div style="color: var(--text-secondary); margin-bottom: 20px;">${error.message}</div>
                <button class="btn btn-primary" onclick="loadUsers()" style="display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
        hidePagination();
    }
}

function renderUsers(users) {
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const list = document.getElementById('users-list');

    list.innerHTML = `
        <div style="margin-bottom: 16px; color: var(--text-secondary); font-size: 14px;">
            <i class="fas fa-users"></i> ${users.length} usuário${users.length !== 1 ? 's' : ''} encontrado${users.length !== 1 ? 's' : ''}
        </div>
    ` + users.map(user => {
        const isCurrentUser = currentUser.email === user.email;
        return `
        <div class="stat-card" style="margin-bottom: 16px; ${isCurrentUser ? 'border: 2px solid var(--primary);' : ''}">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" 
                 style="width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--border-color);" 
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}'">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <strong style="font-size: 16px;">${user.name}</strong>
                ${isCurrentUser ? '<span style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Você</span>' : ''}
              </div>
              <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 6px;">
                <i class="fas fa-envelope" style="width: 16px;"></i> ${user.email}
              </div>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span style="background: ${user.role === 'admin' ? 'var(--primary)' : 'var(--bg-hover)'}; 
                             color: ${user.role === 'admin' ? 'white' : 'var(--text-main)'}; 
                             padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                  ${user.role === 'admin' ? '👑 Administrador' : '👤 Membro da Família'}
                </span>
                ${user.isSuspended ? `<span style="background: #ff9800; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                  ⏸️ Suspenso
                </span>` : ''}
                ${user.createdAt ? `<span style="color: var(--text-secondary); font-size: 12px;">
                  <i class="fas fa-calendar-alt"></i> Desde ${new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </span>` : ''}
              </div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
              ${!isCurrentUser && !user.isSuspended ? `
                <button class="btn btn-secondary" onclick="suspendUser('${user._id}', '${user.name.replace(/'/g, "\\'")}')" 
                        title="Suspender temporariamente"
                        style="display: flex; align-items: center; gap: 6px; background: #ff9800; color: white;">
                  <i class="fas fa-pause-circle"></i> Suspender
                </button>
              ` : !isCurrentUser && user.isSuspended ? `
                <button class="btn btn-secondary" onclick="unsuspendUser('${user._id}', '${user.name.replace(/'/g, "\\'")}')" 
                        title="Reativar usuário"
                        style="display: flex; align-items: center; gap: 6px; background: #4caf50; color: white;">
                  <i class="fas fa-play-circle"></i> Reativar
                </button>
              ` : ''}
              ${user.role !== 'admin' ? `
                <button class="btn btn-secondary" onclick="promoteUser('${user._id}')" 
                        title="Promover a administrador"
                        style="display: flex; align-items: center; gap: 6px;">
                  <i class="fas fa-crown"></i> Promover
                </button>
              ` : !isCurrentUser ? `
                <button class="btn btn-secondary" onclick="demoteUser('${user._id}')" 
                        title="Remover privilégios de administrador"
                        style="display: flex; align-items: center; gap: 6px;">
                  <i class="fas fa-user"></i> Rebaixar
                </button>
              ` : ''}
              ${!isCurrentUser ? `
                <button class="btn btn-danger" onclick="deleteUser('${user._id}', '${user.name.replace(/'/g, "\\'")}')"
                        title="Remover usuário permanentemente"
                        style="display: flex; align-items: center; gap: 6px;">
                  <i class="fas fa-trash-alt"></i> Excluir
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
}

window.promoteUser = async (userId) => {
    if (!confirm('👑 Promover este usuário a administrador?\n\nEle terá acesso total ao painel administrativo e poderá gerenciar outros usuários.')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role: 'admin' })
        });

        if (response.ok) {
            alert('✅ Usuário promovido a administrador com sucesso!');
            loadUsers();
        } else {
            const error = await response.json();
            alert('❌ Erro ao promover usuário: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao promover usuário: ' + error.message);
    }
};

window.demoteUser = async (userId) => {
    if (!confirm('⚠️ Tem certeza que deseja remover os privilégios de administrador deste usuário?\n\nEle voltará a ser um membro comum da família.')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role: 'user' })
        });

        if (response.ok) {
            alert('✅ Usuário rebaixado com sucesso!');
            loadUsers();
        } else {
            const error = await response.json();
            alert('❌ Erro ao rebaixar usuário: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao rebaixar usuário: ' + error.message);
    }
};

window.deleteUser = async (userId, userName) => {
    if (!confirm(`⚠️ ATENÇÃO: Você está prestes a excluir permanentemente o usuário "${userName}"!\n\n` +
        `Esta ação irá:\n` +
        `• Remover o usuário da plataforma\n` +
        `• Deletar todas as publicações deste usuário\n` +
        `• Deletar todos os espaços criados por este usuário\n` +
        `• Esta ação NÃO pode ser desfeita\n\n` +
        `Tem certeza que deseja continuar?`)) return;

    try {
        console.log('🗑️ Deletando usuário:', userId);
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert(`✅ Usuário "${userName}" foi removido com sucesso da plataforma.`);
            loadUsers();
        } else {
            const error = await response.json();
            alert('❌ Erro ao deletar usuário: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        alert('❌ Erro ao deletar usuário: ' + error.message);
    }
};

// Render pagination controls
function renderPagination() {
    const paginationControls = document.getElementById('pagination-controls');
    if (!paginationControls) return;

    // Show pagination if there are multiple pages or many users
    if (adminState.totalPages > 1 || adminState.totalUsers > 10) {
        paginationControls.style.display = 'block';

        // Update pagination info
        document.getElementById('current-page').textContent = adminState.currentPage;
        document.getElementById('total-pages').textContent = adminState.totalPages;
        document.getElementById('total-users').textContent = adminState.totalUsers;

        // Update button states
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.disabled = adminState.currentPage === 1;
            prevBtn.style.opacity = adminState.currentPage === 1 ? '0.5' : '1';
            prevBtn.style.cursor = adminState.currentPage === 1 ? 'not-allowed' : 'pointer';
        }

        if (nextBtn) {
            nextBtn.disabled = adminState.currentPage >= adminState.totalPages;
            nextBtn.style.opacity = adminState.currentPage >= adminState.totalPages ? '0.5' : '1';
            nextBtn.style.cursor = adminState.currentPage >= adminState.totalPages ? 'not-allowed' : 'pointer';
        }
    } else {
        paginationControls.style.display = 'none';
    }
}

function hidePagination() {
    const paginationControls = document.getElementById('pagination-controls');
    if (paginationControls) {
        paginationControls.style.display = 'none';
    }
}

// Suspend user
window.suspendUser = async (userId, userName) => {
    if (!confirm(`⏸️ Suspender temporariamente o usuário "${userName}"?\n\n` +
        `O usuário será impedido de:\n` +
        `• Fazer login na plataforma\n` +
        `• Acessar qualquer conteúdo\n` +
        `• Interagir com outros membros\n\n` +
        `Você poderá reativar este usuário a qualquer momento.\n\n` +
        `Deseja continuar?`)) return;

    try {
        console.log('⏸️ Suspendendo usuário:', userId);
        const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ suspend: true })
        });

        if (response.ok) {
            alert(`✅ Usuário "${userName}" foi suspenso com sucesso.\n\nEle não poderá mais acessar a plataforma até ser reativado.`);
            loadUsers();
        } else {
            const error = await response.json();
            alert('❌ Erro ao suspender usuário: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('❌ Erro ao suspender usuário:', error);
        alert('❌ Erro ao suspender usuário: ' + error.message);
    }
};

// Unsuspend user
window.unsuspendUser = async (userId, userName) => {
    if (!confirm(`▶️ Reativar o usuário "${userName}"?\n\n` +
        `O usuário voltará a ter acesso completo à plataforma e poderá:\n` +
        `• Fazer login normalmente\n` +
        `• Acessar todo o conteúdo\n` +
        `• Interagir com outros membros da família\n\n` +
        `Deseja continuar?`)) return;

    try {
        console.log('▶️ Reativando usuário:', userId);
        const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ suspend: false })
        });

        if (response.ok) {
            alert(`✅ Usuário "${userName}" foi reativado com sucesso!\n\nEle já pode acessar a plataforma novamente.`);
            loadUsers();
        } else {
            const error = await response.json();
            alert('❌ Erro ao reativar usuário: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('❌ Erro ao reativar usuário:', error);
        alert('❌ Erro ao reativar usuário: ' + error.message);
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
