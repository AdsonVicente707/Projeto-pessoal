import { checkAuth, logout, currentUser, userInfo } from './auth.js';
import { initTimeline, showTimelineView } from './timeline.js';
import { showProfileView, initProfile } from './profile.js';
import { initSpaces, showSpacesView } from './spaces.js';
import { API_URL, getAuthHeaders } from './api.js';
import { initMessages, openMessagesModal } from './messages.js';

// Verifica autenticação antes de tudo
if (!checkAuth()) {
    throw new Error("Redirecionando para login...");
}

document.addEventListener('DOMContentLoaded', function() {
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
  }

  // Inicializa Módulos
  initTimeline();
  initSpaces();
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
    item.addEventListener('click', function() {
      // Se for o botão de mensagens, abre o modal e não muda a view principal
      if (this.innerText.includes('Mensagens')) {
        openMessagesModal();
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
      document.querySelector('.create-post').style.display = 'none';

      if (this.innerText.includes('Início')) {
        timelineFeed.style.display = 'block';
        document.querySelector('.create-post').style.display = 'block';
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
    });
  });

  logoutButton.addEventListener('click', logout);

  // --- Lógica de Explorar e Convites (Mantida aqui por simplicidade) ---

  function showExploreView() {
    explorePage.style.display = 'block';
    const userSearchResults = document.getElementById('user-search-results');
    userSearchResults.innerHTML = '<p>Use a busca acima para encontrar pessoas.</p>';
    
    const userSearchButton = document.getElementById('user-search-button');
    const userSearchInput = document.getElementById('user-search-input');

    userSearchButton.onclick = handleUserSearch;
    userSearchInput.onkeyup = (e) => {
      if (e.key === 'Enter') handleUserSearch();
    };
  }

  async function handleUserSearch() {
    const userSearchInput = document.getElementById('user-search-input');
    const userSearchResults = document.getElementById('user-search-results');
    const query = userSearchInput.value.trim();
    if (!query) return;

    try {
      const res = await fetch(`${API_URL}/connections/search?name=${query}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Falha na busca');
      const users = await res.json();
      
      userSearchResults.innerHTML = '';
      if (users.length === 0) {
        userSearchResults.innerHTML = '<p>Nenhum usuário encontrado.</p>';
        return;
      }

      users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.classList.add('user-card');
        let buttonHtml = `<button class="add-user-button" data-userid="${user._id}">Adicionar</button>`;
        if (user.status === 'connected') buttonHtml = '<button disabled>Conectado</button>';
        
        userCard.innerHTML = `<img src="${user.avatar}" class="avatar"><div><strong>${user.name}</strong>${buttonHtml}</div>`;
        userSearchResults.appendChild(userCard);
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  }

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
});