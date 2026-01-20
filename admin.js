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

// Declare loadUsers early so it's available for the tab event listener
let loadUsers;

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
        if (tab.dataset.tab === 'users' && typeof loadUsers === 'function') loadUsers();
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
    resetThemeForm();
});

// Global cropper instance
let cropper = null;
let scaleX = 1;
let scaleY = 1;

// Background type toggle
document.getElementById('background-type').addEventListener('change', (e) => {
    const isImage = e.target.value === 'image';
    document.getElementById('color-options').style.display = isImage ? 'none' : 'block';
    document.getElementById('image-options').style.display = isImage ? 'block' : 'none';
});

// Image upload handler
document.getElementById('background-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido.');
        e.target.value = '';
        return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 50MB');
        e.target.value = '';
        return;
    }

    // Show preview and initialize cropper
    const reader = new FileReader();
    reader.onload = (event) => {
        const imagePreview = document.getElementById('image-preview');
        imagePreview.src = event.target.result;
        document.getElementById('image-preview-container').style.display = 'block';

        // Destroy previous cropper if exists
        if (cropper) {
            cropper.destroy();
        }

        // Initialize Cropper.js
        cropper = new Cropper(imagePreview, {
            aspectRatio: NaN, // Free aspect ratio
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            background: true,
            zoomable: true,
            scalable: true,
            rotatable: true,
        });

        // Reset scale values
        scaleX = 1;
        scaleY = 1;
    };
    reader.readAsDataURL(file);
});

// Image editing functions
window.rotateImage = (degree) => {
    if (cropper) {
        cropper.rotate(degree);
    }
};

window.flipImage = (direction) => {
    if (cropper) {
        if (direction === 'horizontal') {
            scaleX = -scaleX;
            cropper.scaleX(scaleX);
        } else {
            scaleY = -scaleY;
            cropper.scaleY(scaleY);
        }
    }
};

window.resetImage = () => {
    if (cropper) {
        cropper.reset();
        scaleX = 1;
        scaleY = 1;
    }
};

function resetThemeForm() {
    document.getElementById('theme-form').reset();
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('color-options').style.display = 'block';
    document.getElementById('image-options').style.display = 'none';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    scaleX = 1;
    scaleY = 1;
}

document.getElementById('theme-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const backgroundType = document.getElementById('background-type').value;
    const formData = new FormData();

    // Basic theme data
    formData.append('name', document.getElementById('theme-name').value);
    formData.append('slug', document.getElementById('theme-slug').value);

    // Colors
    formData.append('colors[primary]', document.getElementById('theme-primary').value);
    formData.append('colors[secondary]', document.getElementById('theme-secondary').value);
    formData.append('colors[accent]', document.getElementById('theme-primary').value);

    // Particles
    const particleType = document.getElementById('theme-particles').value;
    formData.append('decorations[particles]', particleType !== 'none');
    formData.append('decorations[particleType]', particleType);

    // Background configuration
    if (backgroundType === 'image') {
        const imageFile = document.getElementById('background-image').files[0];
        if (imageFile && cropper) {
            // Get cropped canvas
            const canvas = cropper.getCroppedCanvas({
                maxWidth: 1920,
                maxHeight: 1080,
                imageSmoothingQuality: 'high'
            });

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                formData.append('backgroundImage', blob, imageFile.name);
                formData.append('backgroundOpacity', document.getElementById('background-opacity').value / 100);
                formData.append('backgroundSize', document.getElementById('background-size').value);
                formData.append('backgroundPosition', document.getElementById('background-position').value);
                formData.append('backgroundRepeat', document.getElementById('background-repeat').value);

                submitTheme(formData);
            }, imageFile.type);
            return; // Wait for blob conversion
        } else {
            alert('Por favor, selecione uma imagem de fundo.');
            return;
        }
    } else {
        // Color background
        formData.append('background[type]', 'color');
        formData.append('background[value]', document.getElementById('background-color').value);
        formData.append('background[opacity]', 1);
        submitTheme(formData);
    }
});

async function submitTheme(formData) {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

        const response = await fetch(`${API_URL}/admin/themes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userInfo.token}`
                // Don't set Content-Type, FormData sets it automatically with boundary
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ${response.status}`);
        }

        const result = await response.json();
        console.log('Tema criado:', result);

        alert('✅ Tema criado com sucesso!');
        document.getElementById('theme-modal').classList.remove('active');
        resetThemeForm();
        loadThemes();
    } catch (error) {
        console.error('Erro ao criar tema:', error);
        alert(`❌ Erro ao criar tema: ${error.message}`);
    }
}

// ========================================
// USERS PANEL - Advanced Management
// ========================================

let currentUsersPage = 1;
let currentUsersFilters = { search: '', role: '', status: '', sortBy: 'recent' };
let selectedUser = null;

loadUsers = async function (page = 1) {
    try {
        console.log('🔄 Loading users...', { page, filters: currentUsersFilters });
        const params = new URLSearchParams({ page, limit: 12, ...currentUsersFilters });
        const response = await fetch(`${API_URL}/admin/users?${params}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Erro ao carregar usuários');
        const data = await response.json();
        console.log('✅ Users loaded:', data);
        currentUsersPage = data.currentPage;
        renderUsersGrid(data.users);
        renderPagination(data.totalPages, data.currentPage);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-grid').innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--error);">❌ Erro: ${error.message}</div>`;
    }
};

function renderUsersGrid(users) {
    const grid = document.getElementById('users-grid');
    if (!users || users.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum usuário encontrado</div>';
        return;
    }
    grid.innerHTML = users.map(user => `
        <div class="user-card" onclick="showUserDetails('${user._id}')">
            <div class="user-card-header">
                <img src="${user.avatar || '/uploads/default-avatar.png'}" alt="${user.name}" class="user-card-avatar" onerror="this.src='/uploads/default-avatar.png'">
                <div class="user-card-info"><h3>${user.name}</h3><p>${user.email}</p></div>
            </div>
            <div class="user-card-badges">
                <span class="user-badge ${user.role}">${user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}</span>
                <span class="user-status-badge ${user.isSuspended ? 'suspended' : 'active'}">${user.isSuspended ? '🚫 Suspenso' : '✅ Ativo'}</span>
            </div>
            ${user.bio ? `<p style="font-size: 13px; color: var(--text-secondary); margin: 8px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${user.bio}</p>` : ''}
            <div class="user-card-actions" onclick="event.stopPropagation()">
                <button class="btn-icon" onclick="showUserDetails('${user._id}')" title="Ver"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="quickEditUser('${user._id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="quickDeleteUser('${user._id}', '${user.name}')" title="Excluir"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('users-pagination');
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    pagination.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="loadUsers(${currentPage - 1})"><i class="fas fa-chevron-left"></i> Anterior</button>
        <span class="page-info">Página ${currentPage} de ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="loadUsers(${currentPage + 1})">Próxima <i class="fas fa-chevron-right"></i></button>
    `;
}

let searchTimeout;
document.getElementById('users-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { currentUsersFilters.search = e.target.value; loadUsers(1); }, 500);
});
document.getElementById('filter-role')?.addEventListener('change', (e) => { currentUsersFilters.role = e.target.value; loadUsers(1); });
document.getElementById('filter-status')?.addEventListener('change', (e) => { currentUsersFilters.status = e.target.value; loadUsers(1); });
document.getElementById('sort-by')?.addEventListener('change', (e) => { currentUsersFilters.sortBy = e.target.value; loadUsers(1); });

async function showUserDetails(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Erro ao carregar detalhes');
        const data = await response.json();
        selectedUser = data.user;
        document.getElementById('detail-avatar').src = data.user.avatar || '/uploads/default-avatar.png';
        document.getElementById('detail-name').textContent = data.user.name;
        document.getElementById('detail-email').textContent = data.user.email;
        document.getElementById('detail-bio').textContent = data.user.bio || 'Sem bio';
        const roleBadge = document.getElementById('detail-role-badge');
        roleBadge.textContent = data.user.role === 'admin' ? '👑 Admin' : '👤 Usuário';
        roleBadge.className = `user-badge ${data.user.role}`;
        const statusBadge = document.getElementById('detail-status-badge');
        statusBadge.textContent = data.user.isSuspended ? '🚫 Suspenso' : '✅ Ativo';
        statusBadge.className = `user-status-badge ${data.user.isSuspended ? 'suspended' : 'active'}`;
        document.getElementById('detail-posts').textContent = data.statistics.totalPosts;
        document.getElementById('detail-connections').textContent = data.statistics.totalConnections;
        document.getElementById('detail-messages').textContent = data.statistics.totalMessages;
        document.getElementById('user-details-modal').classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        alert('Erro ao carregar detalhes');
    }
}

function closeUserDetailsModal() { document.getElementById('user-details-modal').classList.remove('active'); selectedUser = null; }
function openEditUserModal() {
    if (!selectedUser) return;
    document.getElementById('edit-user-id').value = selectedUser._id;
    document.getElementById('edit-name').value = selectedUser.name;
    document.getElementById('edit-email').value = selectedUser.email;
    document.getElementById('edit-bio').value = selectedUser.bio || '';
    document.getElementById('edit-role').value = selectedUser.role;
    document.getElementById('edit-suspended').checked = selectedUser.isSuspended || false;
    closeUserDetailsModal();
    document.getElementById('user-edit-modal').classList.add('active');
}
function closeEditUserModal() { document.getElementById('user-edit-modal').classList.remove('active'); }
async function quickEditUser(userId) { await showUserDetails(userId); setTimeout(() => openEditUserModal(), 100); }

document.getElementById('user-edit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('edit-user-id').value;
    const userData = {
        name: document.getElementById('edit-name').value,
        email: document.getElementById('edit-email').value,
        bio: document.getElementById('edit-bio').value,
        role: document.getElementById('edit-role').value,
        isSuspended: document.getElementById('edit-suspended').checked
    };
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Erro ao atualizar');
        alert('✅ Usuário atualizado!');
        closeEditUserModal();
        loadUsers(currentUsersPage);
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

function confirmDeleteUser() {
    if (!selectedUser) return;
    if (confirm(`⚠️ Excluir ${selectedUser.name}?\n\nIsto irá deletar TODOS os dados!\n\nEsta ação é IRREVERSÍVEL!`)) {
        deleteUser(selectedUser._id);
    }
}
async function quickDeleteUser(userId, userName) {
    if (confirm(`⚠️ Excluir ${userName}?\n\nEsta ação é IRREVERSÍVEL!`)) deleteUser(userId);
}
async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Erro ao deletar');
        alert('✅ Usuário deletado!');
        closeUserDetailsModal();
        loadUsers(currentUsersPage);
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

function openChatWithUser() {
    if (!selectedUser) return;
    window.location.href = `/messages.html?user=${selectedUser._id}`;
}

window.showUserDetails = showUserDetails;
window.closeUserDetailsModal = closeUserDetailsModal;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.quickEditUser = quickEditUser;
window.quickDeleteUser = quickDeleteUser;
window.confirmDeleteUser = confirmDeleteUser;
window.openChatWithUser = openChatWithUser;

// Initialize
checkAdminAccess().then(isAdmin => {
    if (isAdmin) {
        loadStats();
    }
});
