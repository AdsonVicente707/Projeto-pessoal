// ========================================
// USERS PANEL - Advanced Management
// ========================================

let currentUsersPage = 1;
let currentUsersFilters = {
    search: '',
    role: '',
    status: '',
    sortBy: 'recent'
};
let selectedUser = null;

// Load users with filters and pagination
async function loadUsers(page = 1) {
    try {
        const params = new URLSearchParams({
            page,
            limit: 12,
            ...currentUsersFilters
        });

        const response = await fetch(`${API_URL}/admin/users?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao carregar usuários');

        const data = await response.json();
        currentUsersPage = data.currentPage;

        renderUsersGrid(data.users);
        renderPagination(data.totalPages, data.currentPage);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('admin-users-list').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--error);">
                ❌ Erro ao carregar usuários: ${error.message}
            </div>
        `;
    }
}

// Render users grid
function renderUsersGrid(users) {
    const grid = document.getElementById('admin-users-list');

    if (!users || users.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                Nenhum usuário encontrado
            </div>
        `;
        return;
    }

    grid.innerHTML = users.map(user => `
        <div class="user-card" onclick="showUserDetails('${user._id}')">
            <div class="user-card-header">
                <img src="${user.avatar || '/uploads/default-avatar.png'}" 
                     alt="${user.name}" 
                     class="user-card-avatar"
                     onerror="this.src='/uploads/default-avatar.png'">
                <div class="user-card-info">
                    <h3>${user.name}</h3>
                    <p>${user.email}</p>
                </div>
            </div>
            <div class="user-card-badges">
                <span class="user-badge ${user.role}">${user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}</span>
                <span class="user-status-badge ${user.isSuspended ? 'suspended' : 'active'}">
                    ${user.isSuspended ? '🚫 Suspenso' : '✅ Ativo'}
                </span>
            </div>
            ${user.bio ? `<p style="font-size: 13px; color: var(--text-secondary); margin: 8px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${user.bio}</p>` : ''}
            <div class="user-card-actions" onclick="event.stopPropagation()">
                <button class="btn-icon" onclick="showUserDetails('${user._id}')" title="Ver Detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="quickEditUser('${user._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="quickDeleteUser('${user._id}', '${user.name}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Render pagination
function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('users-pagination');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    pagination.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="loadUsers(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
        <span class="page-info">Página ${currentPage} de ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="loadUsers(${currentPage + 1})">
            Próxima <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

// Search and filter handlers
let searchTimeout;
document.getElementById('users-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentUsersFilters.search = e.target.value;
        loadUsers(1);
    }, 500);
});

document.getElementById('filter-role')?.addEventListener('change', (e) => {
    currentUsersFilters.role = e.target.value;
    loadUsers(1);
});

document.getElementById('filter-status')?.addEventListener('change', (e) => {
    currentUsersFilters.status = e.target.value;
    loadUsers(1);
});

document.getElementById('sort-by')?.addEventListener('change', (e) => {
    currentUsersFilters.sortBy = e.target.value;
    loadUsers(1);
});

// Show user details modal
async function showUserDetails(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao carregar detalhes do usuário');

        const data = await response.json();
        selectedUser = data.user;

        // Populate modal
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
        console.error('Error loading user details:', error);
        alert('Erro ao carregar detalhes do usuário');
    }
}

function closeUserDetailsModal() {
    document.getElementById('user-details-modal').classList.remove('active');
    selectedUser = null;
}

// Open edit modal
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

function closeEditUserModal() {
    document.getElementById('user-edit-modal').classList.remove('active');
}

// Quick edit (opens modal directly)
async function quickEditUser(userId) {
    await showUserDetails(userId);
    setTimeout(() => openEditUserModal(), 100);
}

// Handle edit form submission
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

        if (!response.ok) throw new Error('Erro ao atualizar usuário');

        alert('✅ Usuário atualizado com sucesso!');
        closeEditUserModal();
        loadUsers(currentUsersPage);
    } catch (error) {
        console.error('Error updating user:', error);
        alert('❌ Erro ao atualizar usuário: ' + error.message);
    }
});

// Delete user
function confirmDeleteUser() {
    if (!selectedUser) return;

    if (confirm(`⚠️ Tem certeza que deseja excluir ${selectedUser.name}?\n\nEsta ação irá deletar:\n• Todos os posts\n• Todas as mensagens\n• Todas as conexões\n• Participação em espaços\n\nEsta ação é IRREVERSÍVEL!`)) {
        deleteUser(selectedUser._id);
    }
}

async function quickDeleteUser(userId, userName) {
    if (confirm(`⚠️ Tem certeza que deseja excluir ${userName}?\n\nEsta ação é IRREVERSÍVEL e irá deletar todos os dados associados!`)) {
        deleteUser(userId);
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao deletar usuário');

        alert('✅ Usuário deletado com sucesso!');
        closeUserDetailsModal();
        loadUsers(currentUsersPage);
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('❌ Erro ao deletar usuário: ' + error.message);
    }
}

// Open chat with user
function openChatWithUser() {
    if (!selectedUser) return;

    // Redirect to messages page with user ID
    window.location.href = `/messages.html?user=${selectedUser._id}`;
}

// Make functions global
window.showUserDetails = showUserDetails;
window.closeUserDetailsModal = closeUserDetailsModal;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.quickEditUser = quickEditUser;
window.quickDeleteUser = quickDeleteUser;
window.confirmDeleteUser = confirmDeleteUser;
window.openChatWithUser = openChatWithUser;
window.loadUsers = loadUsers;
window.loadAdminUsers = loadUsers; // Alias for script.js compatibility
