document.addEventListener('DOMContentLoaded', function() {
  // Elementos da UI
  const menuItems = document.querySelectorAll('.sidebar nav li');
  const logoutButton = document.getElementById('logout-button');
  const postButton = document.getElementById('post-button');
  const addPhotoButton = document.getElementById('add-photo-button');
  const imageUploadInput = document.getElementById('image-upload');
  const postTextArea = document.getElementById('post-text');
  const timelineFeed = document.getElementById('timeline-feed');
  const mainContent = document.querySelector('.main-content');
  const profilePage = document.getElementById('profile-page');
  const profileAvatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-name');
  const profilePostsTitle = document.getElementById('profile-posts-title');
  const profilePostsFeed = document.getElementById('profile-posts-feed');
  const explorePage = document.getElementById('explore-page');
  const exploreGrid = document.getElementById('explore-grid');
  const spacesPage = document.getElementById('spaces-page');
  const createSpaceButton = document.getElementById('create-space-button');
  const spaceNameInput = document.getElementById('space-name-input');
  const spacesList = document.getElementById('spaces-list');
  const spaceDetailPage = document.getElementById('space-detail-page');
  const spaceDetailName = document.getElementById('space-detail-name');
  const backToSpacesButton = document.getElementById('back-to-spaces-button');
  const inviteMemberContainer = document.getElementById('invite-member-container');
  const sendInviteButton = document.getElementById('send-invite-button');
  const spaceMembersList = document.getElementById('space-members-list');
  const invitationsPage = document.getElementById('invitations-page');
  const invitationsList = document.getElementById('invitations-list');
  const addSpacePhotoButton = document.getElementById('add-space-photo-button');
  const photoUploadInput = document.getElementById('photo-upload-input');
  const spacePhotoGrid = document.getElementById('space-photo-grid');
  const spaceTimelineFeed = document.getElementById('space-timeline-feed');
  const createSpacePostButton = document.getElementById('create-space-post-button');
  const addSpacePostPhotoButton = document.getElementById('add-space-post-photo-button');
  const spacePostImageUpload = document.getElementById('space-post-image-upload');
  const spacePostText = document.getElementById('space-post-text');
  const notesList = document.getElementById('notes-list');
  const createNoteButton = document.getElementById('create-note-button');
  const noteTextInput = document.getElementById('note-text-input');
  const chatInputForm = document.getElementById('chat-input-form');
  const recordAudioButton = document.getElementById('record-audio-button');
  const recordingStatus = document.getElementById('recording-status');
  const audioList = document.getElementById('audio-list');

  const notificationDot = document.querySelector('.notification-dot');

  // --- Estado da Aplicação ---
  let posts = [];
  let notifications = [];
  let spacePostImageFile = null;
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let socket = null; // Variável para a conexão do socket
  let selectedImageFile = null; // Variável para guardar a imagem selecionada
  let currentUser = null;
  const API_URL = 'http://localhost:5000/api';

  // Verifica se o usuário está logado
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (!userInfo || !userInfo.token) {
    window.location.href = 'login.html';
    return; // Para a execução do script se não estiver logado
  } else {
    // Define o usuário atual a partir do localStorage
    currentUser = { name: userInfo.name, avatar: 'https://i.pravatar.cc/40?img=0', _id: userInfo._id };
  }

  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove a classe 'active' de todos os itens
      menuItems.forEach(i => i.classList.remove('active'));

      // Adiciona a classe 'active' apenas ao item clicado
      // Se o item for 'Início', volta para a timeline
      if (this.innerText.includes('Início')) {
        showTimelineView();
      }
      // Se o item for 'Perfil', mostra o perfil do usuário logado (Você)
      if (this.innerText.includes('Perfil')) {
        showProfileView(currentUser);
      }
      // Se o item for 'Notificações', esconde o ponto
      if (this.innerText.includes('Notificações')) {
        // Lógica de notificações com backend virá depois
        // Aqui você poderia mostrar uma página de notificações no futuro
        // Por enquanto, apenas voltamos para a timeline se não estiver nela
        showTimelineView();
      }
      // Se o item for 'Explorar', mostra a página de explorar
      if (this.innerText.includes('Explorar')) {
        showExploreView();
      }
      // Se o item for 'Espaços', mostra a página de espaços
      if (this.innerText.includes('Espaços')) {
        showSpacesView();
      }
      // Se o item for 'Convites', mostra a página de convites
      if (this.innerText.includes('Convites')) {
        showInvitationsView();
      }
      this.classList.add('active');
    });
  });

  // Lógica de Logout
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('userInfo');
    window.location.href = 'login.html';
  });

  // --- Funções de Renderização ---

  // Função auxiliar para criar um elemento de post (evita duplicação de código)
  function criarElementoPost(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('timeline-post');
    postElement.dataset.postId = post._id; // Usa o _id do MongoDB

    const postImageHTML = post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image">` : '';
    const likedClass = post.likes.includes(currentUser._id) ? 'liked' : ''; // Verifica se o ID do usuário está no array
    const likeIcon = post.likedByMe ? 'fas' : 'far';
    const likeText = post.likedByMe ? 'Curtido' : 'Curtir';

    postElement.innerHTML = `
      <div class="post-header">
        <img src="${post.author.avatar}" alt="Avatar" class="avatar">
        <div class="author-info">
          <strong>${post.author.name}</strong>
          <small>${post.timestamp}</small>
        </div>
      </div>
      ${postImageHTML}
      <div class="post-content">
        <p>${post.text}</p>
      </div>
      <div class="post-actions">
        <div class="action-button like-button ${likedClass}">
          <i class="${likeIcon} fa-heart"></i>
          <span>${likeText}</span>
          <span class="like-count">${post.likes.length}</span>
        </div>
        <div class="action-button comment-button"><i class="far fa-comment"></i> Comentar</div>
        <div class="action-button"><i class="fas fa-share"></i> Compartilhar</div>
      </div>
    `;

    // Renderiza os comentários se existirem
    if (post.comments && post.comments.length > 0) {
      const commentsList = document.createElement('div');
      commentsList.classList.add('comments-list');
      post.comments.forEach(comment => {
        // O backend precisa popular o autor do comentário para ter o nome
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment-item');
        commentElement.innerHTML = `
          <p><strong>${comment.author.name}</strong> ${comment.text}</p>
        `;
        commentsList.appendChild(commentElement);
      });
      postElement.appendChild(commentsList);
    }

    return postElement;
  }

  function renderizarTimeline() {
    timelineFeed.innerHTML = ''; // Limpa a timeline antes de renderizar
    posts.forEach(post => {
      const postElement = criarElementoPost(post);
      timelineFeed.appendChild(postElement);
    });

    addClickEventsToPosts(); // Re-adiciona os eventos de clique após renderizar
  }

  // Função para criar um novo post
  async function createNewPost() {
    const postText = postTextArea.value.trim();

    // Validação: não posta se não houver nem texto nem imagem
    if (postText === '' && !selectedImageFile) {
      alert('Por favor, escreva algo ou adicione uma foto para postar.');
      return;
    }

    const formData = new FormData();
    formData.append('text', postText);
    if (selectedImageFile) {
      formData.append('photo', selectedImageFile);
    }

    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userInfo.token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Falha ao criar o post');

      // Limpa os campos e atualiza a timeline
      postTextArea.value = '';
      selectedImageFile = null;
      imageUploadInput.value = '';
      addPhotoButton.innerHTML = '<i class="fas fa-camera"></i> Adicionar Foto';
      addPhotoButton.style.backgroundColor = '#e6ecf0';

      fetchAndRenderTimeline();
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert('Não foi possível criar o post.');
    }
  }
  
  // Função para mostrar a página de perfil
  function showProfileView(author) {
    // Preenche as informações do perfil
    profileAvatar.src = author.avatar.replace('40', '80'); // Pega uma imagem maior
    profileName.innerText = author.name;
    profilePostsTitle.innerText = `Posts de ${author.name}`;
    
    // Limpa o feed de perfil antes de adicionar novos posts
    profilePostsFeed.innerHTML = '';

    // Mostra a página de perfil e esconde o resto
    mainContent.classList.add('profile-view');
    profilePage.style.display = 'block';

    // Filtra os posts do autor e os renderiza na página de perfil
    const authorPosts = posts.filter(post => post.author.name === author.name);
    authorPosts.slice().reverse().forEach(post => {
      const postElement = criarElementoPost(post);
      // Na página de perfil, o cabeçalho do post não deve ser clicável
      const postHeader = postElement.querySelector('.post-header');
      postHeader.style.cursor = 'default';
      postHeader.style.pointerEvents = 'none'; // Desabilita eventos de clique
      profilePostsFeed.appendChild(postElement);
    });
  }

  // Função para voltar para a timeline
  function showTimelineView() {
    mainContent.classList.remove('profile-view');
    profilePage.style.display = 'none';
    explorePage.style.display = 'none';
    spacesPage.style.display = 'none';
    spaceDetailPage.style.display = 'none';
    invitationsPage.style.display = 'none';
    // Garante que o feed da timeline esteja visível
    timelineFeed.style.display = 'block';
    document.querySelector('.create-post').style.display = 'block';
  }

  // Função para mostrar a página de explorar
  function showExploreView() {
    mainContent.classList.remove('profile-view');
    profilePage.style.display = 'none';
    timelineFeed.style.display = 'none';
    document.querySelector('.create-post').style.display = 'none';
    spacesPage.style.display = 'none';
    spaceDetailPage.style.display = 'none';
    invitationsPage.style.display = 'none';
    explorePage.style.display = 'block';

    // Popula a grade de explorar apenas se estiver vazia
    if (exploreGrid.innerHTML === '') {
      for (let i = 0; i < 21; i++) {
        const img = document.createElement('img');
        img.src = `https://picsum.photos/300/300?random=${i}`;
        exploreGrid.appendChild(img);
      }
    }
  }

  // Função para mostrar a página de espaços
  function showSpacesView() {
    mainContent.classList.remove('profile-view');
    profilePage.style.display = 'none';
    timelineFeed.style.display = 'none';
    document.querySelector('.create-post').style.display = 'none';
    explorePage.style.display = 'none';
    spaceDetailPage.style.display = 'none';
    invitationsPage.style.display = 'none';
    spacesPage.style.display = 'block';

    fetchAndRenderSpaces();
  }

  // Função para buscar e renderizar os espaços do usuário
  async function fetchAndRenderSpaces() {
    try {
      const res = await fetch(`${API_URL}/spaces`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      if (!res.ok) throw new Error('Falha ao buscar espaços');
      const userSpaces = await res.json();

      spacesList.innerHTML = ''; // Limpa a lista
      if (userSpaces.length === 0) {
        spacesList.innerHTML = '<p>Você ainda não faz parte de nenhum espaço. Crie um!</p>';
      } else {
        userSpaces.forEach(space => {
          const spaceCard = document.createElement('div');
          spaceCard.classList.add('space-card');
          spaceCard.innerHTML = `<h3>${space.name}</h3>`;
          spaceCard.addEventListener('click', () => showSpaceDetailView(space._id));
          spacesList.appendChild(spaceCard);
        });
      }
    } catch (error) {
      console.error(error);
      spacesList.innerHTML = '<p>Ocorreu um erro ao carregar seus espaços.</p>';
    }
  }

  // Função para criar um novo espaço
  async function handleCreateSpace() {
    const name = spaceNameInput.value.trim();
    if (!name) {
      alert('Por favor, dê um nome ao seu espaço.');
      return;
    }

    try {
      await fetch(`${API_URL}/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ name })
      });
      spaceNameInput.value = ''; // Limpa o input
      fetchAndRenderSpaces(); // Atualiza a lista
    } catch (error) {
      console.error('Erro ao criar espaço:', error);
      alert('Não foi possível criar o espaço.');
    }
  }

  // Função para mostrar a página de detalhes de um espaço
  async function showSpaceDetailView(spaceId) {
    mainContent.classList.remove('profile-view');
    spacesPage.style.display = 'none';
    spaceDetailPage.style.display = 'block';

    try {
      const res = await fetch(`${API_URL}/spaces/${spaceId}`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (!res.ok) throw new Error('Falha ao buscar detalhes do espaço');
      const space = await res.json();

      spaceDetailName.innerText = space.name;
      spaceMembersList.innerHTML = space.members.map(member => `<p>${member.name} (${member.email})</p>`).join('');

      // Renderiza o mural de fotos
      spacePhotoGrid.innerHTML = '';
      space.photoUrls.forEach(url => {
        spacePhotoGrid.innerHTML += `<img src="http://localhost:5000${url}" alt="Foto do mural">`;
      });

      // Busca e renderiza a linha do tempo do espaço
      fetchAndRenderSpacePosts(spaceId);
      createSpacePostButton.onclick = () => handleCreateSpacePost(spaceId);

      // Busca e renderiza as anotações e atribui o evento de criação
      fetchAndRenderNotes(spaceId); 
      createNoteButton.onclick = () => handleCreateNote(spaceId);

      // Lógica do Mural de Áudio
      fetchAndRenderAudios(spaceId);
      recordAudioButton.onclick = () => toggleAudioRecording(spaceId);

      // Mostra o container de convite apenas para o criador
      if (space.creator._id === currentUser._id) {
        inviteMemberContainer.style.display = 'flex';
        // Remove listener antigo para evitar duplicação
        sendInviteButton.replaceWith(sendInviteButton.cloneNode(true));
        document.getElementById('send-invite-button').addEventListener('click', () => handleSendInvite(spaceId));
      } else {
        inviteMemberContainer.style.display = 'none';
      }

      // Lógica das Abas
      const tabs = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const targetTab = tab.dataset.tab;
          tabContents.forEach(content => {
            content.style.display = content.id === `${targetTab}-content` ? 'block' : 'none';
          });
        });
      });
      // Reseta para a aba mural por padrão
      document.querySelector('.tab-button[data-tab="mural"]').click();

      // Conecta ao chat
      if (socket) socket.disconnect(); // Desconecta de chats anteriores
      socket = io('http://localhost:5000');
      socket.emit('joinSpace', spaceId);

      socket.on('newChatMessage', ({ message, user }) => {
        addMessageToChat(message, user);
      });

      chatInputForm.onsubmit = (e) => handleSendMessage(e, spaceId);

      // Adiciona listener para o botão de adicionar foto
      addSpacePhotoButton.onclick = () => photoUploadInput.click();
      // Adiciona listener para o input de arquivo
      photoUploadInput.onchange = (e) => handlePhotoUpload(e, spaceId);

    } catch (error) {
      console.error(error);
      spaceDetailPage.innerHTML = '<h2>Erro ao carregar o espaço.</h2>';
    }
  }

  // Função para buscar e renderizar os posts de um espaço
  async function fetchAndRenderSpacePosts(spaceId) {
    try {
      const res = await fetch(`${API_URL}/space-posts/${spaceId}`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      const spacePosts = await res.json();
      spaceTimelineFeed.innerHTML = '';
      spacePosts.forEach(post => {
        // Reutiliza a função de criar elemento de post, mas com dados diferentes
        const postData = {
          _id: post._id,
          author: { name: post.author.name, avatar: 'https://i.pravatar.cc/40' }, // Avatar genérico por enquanto
          timestamp: new Date(post.createdAt).toLocaleDateString(),
          text: post.text,
          imageUrl: post.imageUrl ? `http://localhost:5000${post.imageUrl}` : null,
          likes: 0, // Lógica de likes para space-posts não implementada
          comments: [] // Lógica de comentários para space-posts não implementada
        };
        const postElement = criarElementoPost(postData);
        // Desabilita interações que não se aplicam aqui
        postElement.querySelector('.like-button').style.display = 'none';
        postElement.querySelector('.comment-button').style.display = 'none';
        spaceTimelineFeed.appendChild(postElement);
      });
    } catch (error) {
      console.error('Erro ao buscar posts do espaço:', error);
    }
  }

  // Função para criar um post dentro de um espaço
  async function handleCreateSpacePost(spaceId) {
    const text = spacePostText.value.trim();
    if (!text && !spacePostImageFile) return alert('Escreva algo ou adicione uma foto.');

    const formData = new FormData();
    formData.append('text', text);
    if (spacePostImageFile) {
      formData.append('photo', spacePostImageFile);
    }

    try {
      const res = await fetch(`${API_URL}/space-posts/${spaceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userInfo.token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Falha ao criar post no espaço');

      // Limpa os campos e atualiza a timeline do espaço
      spacePostText.value = '';
      spacePostImageFile = null;
      spacePostImageUpload.value = '';
      addSpacePostPhotoButton.innerHTML = '<i class="fas fa-camera"></i> Adicionar Foto';
      fetchAndRenderSpacePosts(spaceId);

    } catch (error) {
      console.error('Erro ao criar post no espaço:', error);
      alert('Não foi possível criar o post.');
    }
  }

  addSpacePostPhotoButton.addEventListener('click', () => spacePostImageUpload.click());
  spacePostImageUpload.addEventListener('change', (e) => {
    spacePostImageFile = e.target.files[0];
    addSpacePostPhotoButton.innerHTML = '<i class="fas fa-check"></i> Foto Selecionada';
  });

    // Função para buscar e renderizar as anotações de um espaço
    async function fetchAndRenderNotes(spaceId) {
      try {
        const res = await fetch(`${API_URL}/notes/${spaceId}`, {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        const notes = await res.json();
        notesList.innerHTML = '';
        notes.forEach(note => {
          const noteCard = document.createElement('div');
          noteCard.classList.add('note-card');
          noteCard.innerHTML = `<p>${note.text}</p>`;
          // Adicionar botões de editar/deletar se for o autor
          if (note.author._id === currentUser._id) {
            noteCard.innerHTML += `
              <div style="text-align: right; margin-top: 10px;">
                <button onclick="deleteNote('${note._id}', '${spaceId}')">Excluir</button>
              </div>
            `;
          }
          notesList.appendChild(noteCard);
        });
      } catch (error) {
        console.error('Erro ao buscar anotações:', error);
      }
    }

    // Função para criar uma nova anotação
    async function handleCreateNote(spaceId) {
      const text = noteTextInput.value.trim();
      if (!text) return;

      try {
        await fetch(`${API_URL}/notes/${spaceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userInfo.token}`
          },
          body: JSON.stringify({ text })
        });
        noteTextInput.value = '';
        fetchAndRenderNotes(spaceId);
      } catch (error) {
        console.error('Erro ao criar anotação:', error);
      }
    }

    // Função para deletar uma anotação
    window.deleteNote = async (noteId, spaceId) => {
      if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;
      await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      fetchAndRenderNotes(spaceId);
    };

    // Função para buscar e renderizar os áudios de um espaço
    async function fetchAndRenderAudios(spaceId) {
      try {
        const res = await fetch(`${API_URL}/spaces/${spaceId}`, {
          headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        const space = await res.json();
        audioList.innerHTML = '';
        space.audioUrls.forEach(url => {
          audioList.innerHTML += `<audio controls src="http://localhost:5000${url}"></audio>`;
        });
      } catch (error) {
        console.error('Erro ao buscar áudios:', error);
      }
    }

    // Função para iniciar/parar a gravação de áudio
    async function toggleAudioRecording(spaceId) {
      if (isRecording) {
        mediaRecorder.stop();
        recordAudioButton.textContent = 'Gravar Áudio';
        recordAudioButton.classList.remove('recording');
        recordingStatus.textContent = 'Enviando...';
        isRecording = false;
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            await fetch(`${API_URL}/spaces/${spaceId}/audios`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${userInfo.token}` },
              body: formData
            });
            recordingStatus.textContent = '';
            fetchAndRenderAudios(spaceId); // Atualiza a lista com o novo áudio
            stream.getTracks().forEach(track => track.stop()); // Desliga o microfone
          };

          mediaRecorder.start();
          recordAudioButton.textContent = 'Parar Gravação';
          recordAudioButton.classList.add('recording');
          recordingStatus.textContent = 'Gravando...';
          isRecording = true;
        } catch (error) {
          console.error('Erro ao acessar o microfone:', error);
          alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
        }
      }
    }

    // Função para adicionar uma mensagem à janela do chat
    function addMessageToChat(message, user) {
      const chatWindow = document.getElementById('chat-window');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');

    // Verifica se a mensagem é do usuário atual
    if (user._id === currentUser._id) {
      messageElement.classList.add('my-message');
    } else {
      messageElement.classList.add('other-message');
    }

    messageElement.innerHTML = `<strong>${user.name}</strong><p>${message}</p>`;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Rola para a última mensagem
  }

  // Função para enviar uma mensagem de chat
  function handleSendMessage(event, spaceId) {
    event.preventDefault();
    const messageInput = document.getElementById('chat-message-input');
    const message = messageInput.value.trim();
    if (!message) return;

    socket.emit('chatMessage', { spaceId, message, user: currentUser });
    messageInput.value = '';
  }

  // Função para enviar um convite
  async function handleSendInvite(spaceId) {
    const emailInput = document.getElementById('invite-email-input');
    const email = emailInput.value.trim();
    if (!email) return alert('Digite um email para convidar.');

    try {
      const res = await fetch(`${API_URL}/spaces/${spaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao enviar convite');

      alert('Convite enviado com sucesso!');
      emailInput.value = '';
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  }

  // Função para fazer upload de uma foto para o mural
  async function handlePhotoUpload(event, spaceId) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file); // 'photo' é o nome do campo esperado pelo backend

    try {
      const res = await fetch(`${API_URL}/spaces/${spaceId}/photos`, {
        method: 'POST',
        headers: {
          // NÃO defina 'Content-Type', o navegador fará isso automaticamente
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Falha no upload da foto');
      }

      // Atualiza a visualização para mostrar a nova foto
      showSpaceDetailView(spaceId);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Não foi possível enviar a foto.');
    }
  }

  // Função para mostrar a página de convites
  function showInvitationsView() {
    mainContent.classList.remove('profile-view');
    spacesPage.style.display = 'none';
    spaceDetailPage.style.display = 'none';
    timelineFeed.style.display = 'none';
    document.querySelector('.create-post').style.display = 'none';
    explorePage.style.display = 'none';
    invitationsPage.style.display = 'block';

    fetchAndRenderInvitations();
  }

  // Função para buscar e renderizar convites
  async function fetchAndRenderInvitations() {
    try {
      const res = await fetch(`${API_URL}/invitations/my`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      const myInvitations = await res.json();

      invitationsList.innerHTML = '';
      if (myInvitations.length === 0) {
        invitationsList.innerHTML = '<p>Você não tem nenhum convite pendente.</p>';
      } else {
        myInvitations.forEach(inv => {
          const card = document.createElement('div');
          card.classList.add('invitation-card');
          card.innerHTML = `
            <p><strong>${inv.from.name}</strong> convidou você para o espaço <strong>${inv.space.name}</strong>.</p>
            <div>
              <button onclick="handleAcceptInvite('${inv._id}')">Aceitar</button>
            </div>
          `;
          invitationsList.appendChild(card);
        });
      }
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
    }
  }

  // Função para aceitar um convite (exposta globalmente para o onclick)
  window.handleAcceptInvite = async (invitationId) => {
    await fetch(`${API_URL}/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchAndRenderInvitations(); // Atualiza a lista de convites
  };

  // Função para adicionar eventos de clique aos cabeçalhos dos posts
  function addClickEventsToPosts() {
    const postHeaders = document.querySelectorAll('.post-header');
    postHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const authorName = this.querySelector('.author-info strong').innerText;
        const authorAvatar = this.querySelector('.avatar').src;
        
        showProfileView({ name: authorName, avatar: authorAvatar });
      });
    });
  }

  // Adiciona o evento de clique ao botão de postar
  if (postButton) {
    postButton.addEventListener('click', () => {
      createNewPost();
    });
  }

  // Adiciona o evento de clique ao botão de criar espaço
  if (createSpaceButton) {
    createSpaceButton.addEventListener('click', handleCreateSpace);
  }

  // Adiciona evento ao botão de voltar
  if (backToSpacesButton) {
    backToSpacesButton.addEventListener('click', showSpacesView);
  }

  // Função para lidar com o clique no botão de curtir (usando delegação de evento)
  async function handleLike(event) {
    const likeButton = event.target.closest('.like-button');
    if (!likeButton) return;
    
    const postElement = likeButton.closest('.timeline-post');
    const postId = postElement.dataset.postId;

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` },
      });

      if (!res.ok) throw new Error('Falha ao curtir o post');

      // Atualiza a timeline para refletir a mudança
      fetchAndRenderTimeline();

    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  }

  // Função para lidar com o clique no botão de comentar
  function handleComment(event) {
    const commentButton = event.target.closest('.comment-button');
    if (!commentButton) return;

    const postActions = commentButton.parentElement;
    const postElement = postActions.closest('.timeline-post');
    const existingCommentSection = postElement.querySelector('.comment-section');

    // Se já existe uma seção de comentário, remove (toggle)
    if (existingCommentSection) {
      existingCommentSection.remove();
    } else {
      // Cria a seção de comentários
      const commentSection = document.createElement('div');
      commentSection.classList.add('comment-section');
      commentSection.innerHTML = `
        <textarea placeholder="Escreva seu comentário..."></textarea>
        <button class="submit-comment-button">Enviar</button>
      `;
      // Insere a seção logo após as ações do post
      postActions.insertAdjacentElement('afterend', commentSection);
    }
  }

  // Função para lidar com o envio de um comentário
  async function handleSubmitComment(event) {
    const submitButton = event.target.closest('.submit-comment-button');
    if (!submitButton) return;

    const postElement = submitButton.closest('.timeline-post');
    const postId = postElement.dataset.postId;
    const textArea = postElement.querySelector('.comment-section textarea');
    const commentText = textArea.value.trim();

    if (commentText === '') return;

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });
      if (!res.ok) throw new Error('Falha ao adicionar comentário');
      fetchAndRenderTimeline(); // Atualiza a timeline para mostrar o novo comentário
    } catch (error) {
      console.error('Erro ao comentar:', error);
      alert('Não foi possível adicionar o comentário.');
    }
  }

  // Evento para o botão "Adicionar Foto"
  if (addPhotoButton) {
    addPhotoButton.addEventListener('click', () => {
      imageUploadInput.click(); // Aciona o input de arquivo escondido
    });
  }

  // Evento para quando um arquivo é selecionado
  if (imageUploadInput) {
    imageUploadInput.addEventListener('change', (event) => {
      selectedImageFile = event.target.files[0];
      addPhotoButton.innerHTML = '<i class="fas fa-check"></i> Foto Selecionada';
      addPhotoButton.style.backgroundColor = '#d1e7dd'; // Verde claro para feedback
    });
  }

  // Adiciona um único listener de clique no container principal para lidar com as curtidas
  mainContent.addEventListener('click', handleLike);
  mainContent.addEventListener('click', handleComment);
  mainContent.addEventListener('click', handleSubmitComment);

  // Função para buscar e renderizar a timeline principal
  async function fetchAndRenderTimeline() {
    try {
      const res = await fetch(`${API_URL}/posts`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` },
      });
      posts = await res.json();
      renderizarTimeline();
    } catch (error) {
      console.error('Erro ao buscar posts da timeline:', error);
    }
  }

  // --- Inicialização da Aplicação ---
  function init() {
    fetchAndRenderTimeline();
  }

  init();

});