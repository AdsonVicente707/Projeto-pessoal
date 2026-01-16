import { checkAuth, logout, currentUser, userInfo } from './auth.js';
import { initTimeline, showTimelineView } from './timeline.js';
import { showProfileView, initProfile } from './profile.js';
import { initSpaces, showSpacesView } from './spaces.js';
import { API_URL, getAuthHeaders, getUploadHeaders } from './api.js';
import { initMessages, openMessagesModal } from './messages.js';
import { initStories } from './stories.js';
import { initExplore, showExploreView } from './explore.js';
import { loadActiveTheme } from './themes.js';
import { createEnhancedThemeModal, getThemeFormData } from './themeModal.js';

// Verifica autenticação antes de tudo
if (!checkAuth()) {
  throw new Error("Redirecionando para login...");
}

// --- APLICAÇÃO IMEDIATA DO TEMA (Evita flash de luz) ---
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', function () {
  // Elementos da UI
  const menuItems = document.querySelectorAll('.sidebar nav li');
  const logoutButton = document.getElementById('logout-button');
  const timelineFeed = document.getElementById('timeline-feed');
  const mainContent = document.querySelector('.main-content');
  const profilePage = document.getElementById('profile-page');
  const explorePage = document.getElementById('explore-page');
  const spacesPage = document.getElementById('spaces-page');
  const spaceDetailPage = document.getElementById('space-detail-page');
  const invitationsPage = document.getElementById('invitations-page');
  const settingsPage = document.getElementById('settings-page');

  // Inicializa Top Bar Profile
  if (currentUser) {
    const topName = document.getElementById('top-profile-name');
    const topAvatar = document.getElementById('top-profile-avatar');
    if (topName) topName.innerText = currentUser.name;
    if (topAvatar) {
      topAvatar.src = currentUser.avatar;
      topAvatar.style.objectPosition = `${currentUser.avatarPosX || 50}% ${currentUser.avatarPosY || 50}%`;
    }
    const topTrigger = document.getElementById('top-profile-trigger');
    if (topTrigger) {
      topTrigger.addEventListener('click', () => showProfileView(currentUser));
    }

    // --- APLICAÇÃO DE PREFERÊNCIAS VISUAIS ---
    // 1. Fundo do Chat
    if (currentUser.chatBackground) {
      const chatArea = document.getElementById('msg-chat-area');
      if (chatArea) chatArea.style.backgroundImage = `url('${currentUser.chatBackground}')`;
    }
    // 2. Banner do Perfil (será aplicado no showProfileView, mas podemos pré-carregar se quiser)

    initSettings(); // Inicializa lógica da página de configurações
  }

  // Inicializa Módulos
  initTimeline();
  initProfile();

  // Inicializa Socket.io para notificações
  const socket = window.io('http://localhost:5000', {
    auth: {
      token: userInfo.token
    }
  });

  // Garante que o usuário entre na sala correta ao conectar ou reconectar
  socket.on('connect', () => {
    socket.emit('user_connected', currentUser._id);
  });

  // Inicializa o módulo de mensagens passando o socket
  initMessages(socket);
  initSpaces(socket); // Passa o socket para os espaços também
  initStories(); // Inicializa Stories
  initExplore(); // Inicializa Explore

  // Load active theme
  loadActiveTheme();

  // Show admin panel link if user is admin
  console.log('🔐 Checking admin access...');
  console.log('Current user:', currentUser);
  console.log('Current user role:', currentUser?.role);

  if (currentUser && currentUser.role === 'admin') {
    console.log('✅ User is admin - showing admin panel link');
    const adminMenuLink = document.getElementById('admin-menu-link');
    if (adminMenuLink) {
      adminMenuLink.style.display = 'block';

      // Add click handler
      adminMenuLink.addEventListener('click', () => {
        console.log('🛡️ Admin panel clicked');
        showAdminPanel();
      });

      console.log('✅ Admin panel link configured!');
    } else {
      console.error('❌ Admin menu link element not found in HTML!');
    }
  } else {
    console.log('❌ User is not admin or currentUser is null');
    console.log('   Role:', currentUser?.role);
  }

  socket.on('new_notification', () => {
    const notificationDot = document.querySelector('.notification-dot');
    let count = parseInt(notificationDot.textContent) || 0;
    if (notificationDot.textContent === '9+') count = 10;
    count++;
    notificationDot.textContent = count > 9 ? '9+' : count;
    notificationDot.classList.remove('hidden');
  });

  async function updateNotificationCount() {
    const notificationDot = document.querySelector('.notification-dot');
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const notifications = await res.json();
        const unreadCount = notifications.filter(n => !n.read).length;

        if (unreadCount > 0) {
          notificationDot.textContent = unreadCount > 9 ? '9+' : unreadCount;
          notificationDot.classList.remove('hidden');
        } else {
          notificationDot.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  }

  updateNotificationCount();

  menuItems.forEach(item => {
    item.addEventListener('click', function () {
      // Se for o botão de mensagens, abre o modal e não muda a view principal
      if (this.innerText.includes('Mensagens')) {
        openMessagesModal();
        return;
      }

      // Se for o painel admin, mostra o painel
      if (this.innerText.includes('Painel Admin') || this.id === 'admin-menu-link') {
        console.log('🛡️ Admin panel menu clicked');
        showAdminPanel();
        return;
      }

      menuItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      // Esconde tudo por padrão
      mainContent.classList.remove('profile-view');
      profilePage.style.display = 'none';
      explorePage.style.display = 'none';
      spacesPage.style.display = 'none';
      spaceDetailPage.style.display = 'none';
      invitationsPage.style.display = 'none';
      timelineFeed.style.display = 'none';
      settingsPage.style.display = 'none';
      document.querySelector('.create-post').style.display = 'none';
      document.getElementById('stories-section').style.display = 'none';

      // Hide admin panel too
      const adminPanel = document.getElementById('admin-panel-page');
      if (adminPanel) adminPanel.style.display = 'none';

      if (this.innerText.includes('Início')) {
        timelineFeed.style.display = 'block';
        document.querySelector('.create-post').style.display = 'block';
        document.getElementById('stories-section').style.display = 'block';
        showTimelineView();
      }
      if (this.innerText.includes('Perfil')) {
        showProfileView(currentUser);
      }
      if (this.innerText.includes('Explorar')) {
        showExploreView();
      }
      if (this.innerText.includes('Espaços')) {
        showSpacesView();
      }
      if (this.innerText.includes('Convites')) {
        showInvitationsView();
      }
      if (this.innerText.includes('Configurações')) {
        settingsPage.style.display = 'block';
      }
    });
  });

  logoutButton.addEventListener('click', logout);

  // --- Lógica de Convites (Mantida aqui por simplicidade) ---

  function showInvitationsView() {
    invitationsPage.style.display = 'block';
    fetchAndRenderSpaceInvitations();
    fetchAndRenderConnectionRequests();
  }

  async function fetchAndRenderSpaceInvitations() {
    const spaceInvitationsList = document.getElementById('space-invitations-list');
    try {
      const res = await fetch(`${API_URL}/invitations/my`, {
        headers: getAuthHeaders()
      });
      const myInvitations = await res.json();

      spaceInvitationsList.innerHTML = '';
      if (myInvitations.length === 0) {
        spaceInvitationsList.innerHTML = '<p>Nenhum convite para espaços.</p>';
      } else {
        myInvitations.forEach(inv => {
          const card = document.createElement('div');
          card.classList.add('invitation-card');
          card.innerHTML = `
            <p><strong>${inv.from.name}</strong> convidou você para o espaço <strong>${inv.space.name}</strong>.</p>
            <div>
              <button onclick="handleAcceptSpaceInvite('${inv._id}')">Aceitar</button>
            </div>
          `;
          spaceInvitationsList.appendChild(card);
        });
      }
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      spaceInvitationsList.innerHTML = '<p>Erro ao carregar convites para espaços.</p>';
    }
  }

  async function fetchAndRenderConnectionRequests() {
    const connectionRequestsList = document.getElementById('connection-requests-list');
    try {
      const res = await fetch(`${API_URL}/connections/pending`, {
        headers: getAuthHeaders()
      });
      const pendingRequests = await res.json();

      connectionRequestsList.innerHTML = '';
      if (pendingRequests.length === 0) {
        connectionRequestsList.innerHTML = '<p>Nenhum pedido de conexão pendente.</p>';
      } else {
        pendingRequests.forEach(req => {
          const card = document.createElement('div');
          card.classList.add('connection-request-card');
          card.innerHTML = `
            <div class="user-info">
              <img src="${req.requester.avatar}" alt="Avatar" class="avatar">
              <strong>${req.requester.name}</strong> quer se conectar com você.
            </div>
            <div style="margin: 10px 0;">
                <label><input type="checkbox" class="family-checkbox"> Marcar como Familiar</label>
            </div>
            <div>
              <button class="accept-request-button" data-requestid="${req._id}">Aceitar</button>
              <button class="decline-request-button" data-requestid="${req._id}">Recusar</button>
            </div>
          `;
          connectionRequestsList.appendChild(card);
        });
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos de conexão:', error);
      connectionRequestsList.innerHTML = '<p>Erro ao carregar pedidos de conexão.</p>';
    }
  }

  // Eventos Globais para Convites
  window.handleAcceptSpaceInvite = async (invitationId) => {
    await fetch(`${API_URL}/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    fetchAndRenderSpaceInvitations();
  };

  mainContent.addEventListener('click', async (e) => {
    if (e.target.matches('.add-user-button')) {
      const btn = e.target;
      await fetch(`${API_URL}/connections/request/${btn.dataset.userid}`, { method: 'POST', headers: getAuthHeaders() });
      btn.textContent = 'Pedido Enviado';
      btn.disabled = true;
    }
    if (e.target.matches('.accept-request-button, .decline-request-button')) {
      const btn = e.target;
      const response = btn.classList.contains('accept-request-button') ? 'accept' : 'decline';

      // Verifica se o checkbox de família está marcado
      const card = btn.closest('.connection-request-card');
      const isFamily = card.querySelector('.family-checkbox') ? card.querySelector('.family-checkbox').checked : false;

      await fetch(`${API_URL}/connections/${btn.dataset.requestid}/respond`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ response, isFamily })
      });
      fetchAndRenderConnectionRequests();
    }
  });

  // --- Lógica da Página de Configurações ---
  function initSettings() {
    const saveBannerBtn = document.getElementById('save-banner-btn');
    const saveChatBgBtn = document.getElementById('save-chatbg-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Configura o estado inicial do toggle
    if (localStorage.getItem('theme') === 'dark') {
      darkModeToggle.checked = true;
    }

    // Evento de troca de tema
    darkModeToggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    if (saveBannerBtn) {
      saveBannerBtn.addEventListener('click', async () => {
        const input = document.getElementById('settings-banner-input');
        if (input.files.length === 0) return alert('Selecione uma imagem para o banner.');

        const formData = new FormData();
        formData.append('banner', input.files[0]);

        try {
          saveBannerBtn.textContent = 'Salvando...';

          const res = await fetch(`${API_URL}/users/profile/banner`, {
            method: 'PUT',
            body: formData,
            headers: getUploadHeaders()
          });

          if (!res.ok) throw new Error('Erro ao salvar banner');

          const updatedUser = await res.json();

          // Atualiza currentUser e LocalStorage com a URL real do servidor
          currentUser.bannerUrl = updatedUser.bannerUrl;

          const stored = JSON.parse(localStorage.getItem('userInfo'));
          stored.bannerUrl = updatedUser.bannerUrl;
          localStorage.setItem('userInfo', JSON.stringify(stored));

          alert('Banner atualizado com sucesso!');
          saveBannerBtn.textContent = 'Atualizar Banner';
        } catch (e) { console.error(e); }
      });
    }

    if (saveChatBgBtn) {
      saveChatBgBtn.addEventListener('click', () => {
        const input = document.getElementById('settings-chatbg-input');
        if (input.files.length === 0) return alert('Selecione uma imagem.');

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target.result;
          currentUser.chatBackground = result;
          const stored = JSON.parse(localStorage.getItem('userInfo'));
          stored.chatBackground = result;
          localStorage.setItem('userInfo', JSON.stringify(stored));

          document.getElementById('msg-chat-area').style.backgroundImage = `url('${result}')`;
          alert('Fundo do chat atualizado!');
        };
        reader.readAsDataURL(input.files[0]);
      });
    }
  }

  // --- Admin Panel Logic ---
  function showAdminPanel() {
    console.log('🛡️ Showing admin panel...');

    // Hide all other sections
    document.querySelectorAll('main > section').forEach(section => {
      section.style.display = 'none';
    });

    // Show admin panel
    const adminPanel = document.getElementById('admin-panel-page');
    if (adminPanel) {
      adminPanel.style.display = 'block';
      console.log('✅ Admin panel displayed');

      // Load admin data
      loadAdminDashboard();

      // Setup tab switching
      setupAdminTabs();
    } else {
      console.error('❌ Admin panel element not found!');
    }

    // Update active menu item
    document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active'));
    const adminMenuItem = document.getElementById('admin-menu-link');
    if (adminMenuItem) {
      adminMenuItem.classList.add('active');
      console.log('✅ Admin menu item marked as active');
    }
  }

  function setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Hide all tab contents
        document.querySelectorAll('.admin-tab-content').forEach(content => {
          content.style.display = 'none';
        });

        // Show selected tab
        const tabName = tab.dataset.tab;
        const tabContent = document.getElementById(`admin-${tabName}-tab`);
        if (tabContent) {
          tabContent.style.display = 'block';
        }

        // Load data for the tab
        if (tabName === 'dashboard') {
          loadAdminDashboard();
        } else if (tabName === 'users') {
          loadAdminUsers();
        } else if (tabName === 'themes') {
          loadAdminThemes();
        }
      });
    });
  }

  async function loadAdminDashboard() {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const stats = await response.json();
        const statsGrid = document.getElementById('admin-stats-grid');
        statsGrid.innerHTML = `
          <div class="admin-stat-card">
            <i class="fas fa-users"></i>
            <h3>${stats.totalUsers || 0}</h3>
            <p>Total de Usuários</p>
          </div>
          <div class="admin-stat-card">
            <i class="fas fa-file-alt"></i>
            <h3>${stats.totalPosts || 0}</h3>
            <p>Total de Posts</p>
          </div>
          <div class="admin-stat-card">
            <i class="fas fa-layer-group"></i>
            <h3>${stats.totalSpaces || 0}</h3>
            <p>Total de Espaços</p>
          </div>
          <div class="admin-stat-card">
            <i class="fas fa-user-check"></i>
            <h3>${stats.onlineNow || 0}</h3>
            <p>Usuários Online</p>
          </div>
        `;
      } else {
        console.error('Failed to load admin stats');
      }
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    }
  }

  async function loadAdminUsers() {
    console.log('👥 Loading admin users...');
    const usersList = document.getElementById('admin-users-list');

    try {
      usersList.innerHTML = '<div style="text-align: center; padding: 40px;">Carregando usuários...</div>';

      const response = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeaders()
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data);

        // API returns { users: [...], totalPages, currentPage, total }
        const users = data.users || data;

        if (!users || users.length === 0) {
          usersList.innerHTML = '<div style="text-align: center; padding: 40px;">Nenhum usuário encontrado</div>';
          return;
        }

        usersList.innerHTML = users.map(user => `
          <div class="admin-user-card">
            <img src="${user.avatar || 'https://i.pravatar.cc/40?img=0'}" alt="${user.name}">
            <div class="admin-user-info">
              <h4>${user.name}</h4>
              <p>${user.email}</p>
              <span class="admin-user-role ${user.role === 'admin' ? 'admin' : 'user'}">${user.role || 'user'}</span>
            </div>
            <div class="admin-user-actions">
              ${user.role === 'admin' ?
            `<button onclick="demoteUser('${user._id}')">Rebaixar</button>` :
            `<button onclick="promoteUser('${user._id}')">Promover a Admin</button>`
          }
            </div>
          </div>
        `).join('');

        console.log(`✅ Loaded ${users.length} users`);
      } else {
        const errorText = await response.text();
        console.error('Failed to load users:', response.status, errorText);
        usersList.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Erro ao carregar usuários: ${response.status}</div>`;
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
      usersList.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Erro: ${error.message}</div>`;
    }
  }

  async function loadAdminThemes() {
    console.log('🎨 Loading admin themes...');
    const themesList = document.getElementById('admin-themes-list');

    try {
      themesList.innerHTML = '<div style="text-align: center; padding: 40px;">Carregando temas...</div>';

      const response = await fetch(`${API_URL}/admin/themes`, {
        headers: getAuthHeaders()
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const themes = await response.json();
        console.log('Themes data received:', themes);

        if (!themes || themes.length === 0) {
          themesList.innerHTML = '<div style="text-align: center; padding: 40px;">Nenhum tema criado ainda. Clique em "Criar Novo Tema" para começar.</div>';
          return;
        }

        themesList.innerHTML = themes.map(theme => `
          <div class="admin-theme-card ${theme.isActive ? 'active' : ''}">
            <h4>${theme.name}</h4>
            <div class="admin-theme-colors">
              <span style="background: ${theme.colors.primary}"></span>
              <span style="background: ${theme.colors.secondary}"></span>
            </div>
            <div class="admin-theme-actions">
              ${theme.isActive ?
            `<button onclick="deactivateTheme('${theme._id}')">Desativar</button>` :
            `<button onclick="activateTheme('${theme._id}')">Ativar</button>`
          }
              <button onclick="deleteTheme('${theme._id}')">Deletar</button>
            </div>
          </div>
        `).join('');

        console.log(`✅ Loaded ${themes.length} themes`);
      } else {
        const errorText = await response.text();
        console.error('Failed to load themes:', response.status, errorText);
        themesList.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Erro ao carregar temas: ${response.status}</div>`;
      }
    } catch (error) {
      console.error('Error loading themes:', error);
      themesList.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Erro: ${error.message}</div>`;
    }
  }

  // Make functions global for onclick handlers
  window.promoteUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: 'admin' })
      });
      if (response.ok) {
        alert('Usuário promovido a admin!');
        loadAdminUsers();
      }
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  window.demoteUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: 'user' })
      });
      if (response.ok) {
        alert('Usuário rebaixado!');
        loadAdminUsers();
      }
    } catch (error) {
      console.error('Error demoting user:', error);
    }
  };

  window.activateTheme = async (themeId) => {
    try {
      const response = await fetch(`${API_URL}/admin/themes/${themeId}/activate`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert('Tema ativado!');
        loadAdminThemes();
        loadActiveTheme(); // Reload theme on main page
      }
    } catch (error) {
      console.error('Error activating theme:', error);
    }
  };

  window.deactivateTheme = async (themeId) => {
    try {
      const response = await fetch(`${API_URL}/admin/themes/deactivate-all`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert('Tema desativado!');
        loadAdminThemes();
        removeTheme(); // Remove theme from main page
      }
    } catch (error) {
      console.error('Error deactivating theme:', error);
    }
  };

  window.deleteTheme = async (themeId) => {
    if (!confirm('Tem certeza que deseja deletar este tema?')) return;
    try {
      const response = await fetch(`${API_URL}/admin/themes/${themeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert('Tema deletado!');
        loadAdminThemes();
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  };

  // Enhanced Theme Creation Modal Logic
  // Create enhanced modal on page load
  createEnhancedThemeModal();

  const createThemeBtn = document.getElementById('admin-create-theme-btn');
  let themeModal, themeForm, cancelThemeBtn, previewBtn;

  // Wait a bit for modal to be created
  setTimeout(() => {
    themeModal = document.getElementById('admin-theme-modal');
    themeForm = document.getElementById('admin-theme-form');
    cancelThemeBtn = document.getElementById('admin-cancel-theme-btn');
    previewBtn = document.getElementById('admin-preview-theme-btn');

    if (createThemeBtn) {
      createThemeBtn.addEventListener('click', () => {
        console.log('🎨 Opening enhanced theme creation modal...');
        if (themeModal) {
          themeModal.style.display = 'flex';
        }
      });
    }

    if (cancelThemeBtn) {
      cancelThemeBtn.addEventListener('click', () => {
        console.log('❌ Closing theme creation modal...');
        if (themeModal) {
          themeModal.style.display = 'none';
        }
        if (themeForm) {
          themeForm.reset();
        }
      });
    }

    if (themeForm) {
      themeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Submitting enhanced theme creation form...');

        const themeData = await getThemeFormData();
        console.log('Theme data:', themeData);

        try {
          const response = await fetch(`${API_URL}/admin/themes`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(themeData)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ${response.status}`);
          }

          const result = await response.json();
          console.log('✅ Tema criado:', result);

          alert('✅ Tema criado com sucesso!');
          if (themeModal) {
            themeModal.style.display = 'none';
          }
          if (themeForm) {
            themeForm.reset();
          }
          loadAdminThemes(); // Reload themes list
        } catch (error) {
          console.error('❌ Erro ao criar tema:', error);
          alert(`❌ Erro ao criar tema: ${error.message}`);
        }
      });
    }

    // Preview button
    if (previewBtn) {
      previewBtn.addEventListener('click', async () => {
        console.log('👁️ Previewing theme...');
        const themeData = await getThemeFormData();
        previewTheme(themeData);
      });
    }

    // Close modal when clicking outside
    if (themeModal) {
      themeModal.addEventListener('click', (e) => {
        if (e.target === themeModal) {
          themeModal.style.display = 'none';
          if (themeForm) {
            themeForm.reset();
          }
        }
      });
    }
  }, 100);

  // Preview theme function
  function previewTheme(themeData) {
    console.log('Previewing theme:', themeData);

    // Apply colors temporarily
    document.documentElement.style.setProperty('--primary-color', themeData.colors.primary);
    document.documentElement.style.setProperty('--secondary-color', themeData.colors.secondary);

    // Apply background
    if (themeData.background.type === 'color') {
      document.body.style.background = themeData.background.value;
    } else if (themeData.background.type === 'gradient') {
      document.body.style.background = themeData.background.value;
    } else if (themeData.background.type === 'image') {
      document.body.style.backgroundImage = `url(${themeData.background.value})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }
    document.body.style.opacity = themeData.background.opacity;

    alert(`👁️ Preview do tema "${themeData.name}"!\n\nRecarregue a página para voltar ao normal.`);
  }
});
