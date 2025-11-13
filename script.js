document.addEventListener('DOMContentLoaded', function() {
  // Elementos da UI
  const menuItems = document.querySelectorAll('.sidebar nav li');
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
  const notificationDot = document.querySelector('.notification-dot');

  // --- Estado da Aplicação (Banco de Dados Local) ---
  let posts = [];
  let notifications = [];
  let selectedImageFile = null; // Variável para guardar a imagem selecionada
  const currentUser = { name: 'Você', avatar: 'https://i.pravatar.cc/40?img=0' };

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
        notifications = [];
        saveNotificationsToStorage();
        // Aqui você poderia mostrar uma página de notificações no futuro
        // Por enquanto, apenas voltamos para a timeline se não estiver nela
        showTimelineView();
      }
      // Se o item for 'Explorar', mostra a página de explorar
      if (this.innerText.includes('Explorar')) {
        showExploreView();
      }
      this.classList.add('active');
    });
  });

  // --- Funções de Banco de Dados (localStorage) ---

  function savePostsToStorage() {
    localStorage.setItem('socialPosts', JSON.stringify(posts));
  }

  function saveNotificationsToStorage() {
    localStorage.setItem('socialNotifications', JSON.stringify(notifications));
  }

  function updateNotificationDot() {
    notificationDot.classList.toggle('hidden', notifications.length === 0);
  }

  function iniciarBancoDeDados() {
    const postsFromStorage = localStorage.getItem('socialPosts');
    if (postsFromStorage) {
      posts = JSON.parse(postsFromStorage);
    } else {
      // Se não houver nada no localStorage, cria os posts iniciais
      posts = [
        {
          id: 1,
          author: { name: 'Ana Silva', avatar: 'https://i.pravatar.cc/40?img=1' },
          timestamp: '2 horas atrás',
          text: 'Adorei o dia no parque hoje! Um ótimo lugar para relaxar e ler um livro.',
          imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
          likes: 17,
          likedByMe: false,
          comments: [
            {
              author: { name: 'Carlos Souza', avatar: 'https://i.pravatar.cc/40?img=2' },
              text: 'Que foto linda!'
            }
          ]
        },
        {
          id: 2,
          author: { name: 'Carlos Souza', avatar: 'https://i.pravatar.cc/40?img=2' },
          timestamp: '5 horas atrás',
          text: 'Experimentando novas receitas na cozinha. O resultado ficou incrível! 👨‍🍳 #culinaria',
          imageUrl: null,
          likes: 42,
          likedByMe: true, // Exemplo de post já curtido
          comments: []
        }
      ];
      savePostsToStorage();
    }

    const notificationsFromStorage = localStorage.getItem('socialNotifications');
    if (notificationsFromStorage) {
      notifications = JSON.parse(notificationsFromStorage);
    }
    updateNotificationDot();
  }

  // --- Funções de Renderização ---

  // Função auxiliar para criar um elemento de post (evita duplicação de código)
  function criarElementoPost(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('timeline-post');
    postElement.dataset.postId = post.id;

    const postImageHTML = post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image">` : '';
    const likedClass = post.likedByMe ? 'liked' : '';
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
          <span class="like-count">${post.likes}</span>
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
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment-item');
        commentElement.innerHTML = `
          <img src="${comment.author.avatar}" alt="Avatar" class="avatar">
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
    posts.slice().reverse().forEach(post => {
      const postElement = criarElementoPost(post);
      timelineFeed.appendChild(postElement);
    });

    addClickEventsToPosts(); // Re-adiciona os eventos de clique após renderizar
  }

  // Função para criar um novo post
  function createNewPost() {
    const postText = postTextArea.value.trim();

    // Validação: não posta se não houver nem texto nem imagem
    if (postText === '' && !selectedImageFile) {
      alert('Por favor, escreva algo ou adicione uma foto para postar.');
      return;
    }

    const processPostCreation = (imageUrl) => {
      const newPost = {
        // Cria um ID único baseado no tempo atual
        id: Date.now(),
        author: currentUser,
        timestamp: 'agora mesmo',
        text: postText,
        imageUrl: imageUrl,
        likes: 0,
        likedByMe: false,
        comments: []
      };

      // Adiciona o novo post ao início do array de posts
      posts.push(newPost);
      // Salva o estado atualizado no localStorage
      savePostsToStorage();
      // Re-renderiza a timeline para mostrar o novo post
      renderizarTimeline();

      // Limpa os campos do formulário após a postagem
      postTextArea.value = '';
      selectedImageFile = null;
      imageUploadInput.value = '';
      addPhotoButton.innerHTML = '<i class="fas fa-camera"></i> Adicionar Foto';
      addPhotoButton.style.backgroundColor = '#e6ecf0';
    };

    // Se uma imagem foi selecionada, converte para Base64 antes de criar o post
    if (selectedImageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processPostCreation(e.target.result); // e.target.result contém a imagem em Base64
      };
      reader.readAsDataURL(selectedImageFile);
    } else {
      // Se não houver imagem, cria o post com imageUrl como null
      processPostCreation(null);
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

  // Função para lidar com o clique no botão de curtir (usando delegação de evento)
  function handleLike(event) {
    const likeButton = event.target.closest('.like-button');
    if (!likeButton) return;
    
    const postElement = likeButton.closest('.timeline-post');
    const postId = parseInt(postElement.dataset.postId);

    // Encontra o post no nosso array de dados
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Atualiza o estado do post
    if (post.likedByMe) {
      // Descurtir
      post.likes--;
      post.likedByMe = false;
    } else {
      // Curtir
      post.likes++;
      post.likedByMe = true;
      // Mostra notificação se o post não for do usuário logado
      if (post.author.name !== currentUser.name) {
        notifications.push({ type: 'like', from: currentUser.name, post: post.id });
        saveNotificationsToStorage();
      }
    }

    // Salva as alterações no localStorage e re-renderiza a UI
    savePostsToStorage();
    renderizarTimeline();
  }
  updateNotificationDot();

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
  function handleSubmitComment(event) {
    const submitButton = event.target.closest('.submit-comment-button');
    if (!submitButton) return;

    const postElement = submitButton.closest('.timeline-post');
    const postId = parseInt(postElement.dataset.postId);
    const textArea = postElement.querySelector('.comment-section textarea');
    const commentText = textArea.value.trim();

    if (commentText === '') return;

    const post = posts.find(p => p.id === postId);
    if (post) {
      post.comments.push({
        author: currentUser,
        text: commentText
      });
      savePostsToStorage();
      renderizarTimeline(); // Re-renderiza para mostrar o novo comentário e fechar a caixa
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

  // --- Inicialização da Aplicação ---
  function init() {
    iniciarBancoDeDados();
    renderizarTimeline();
  }

  init();

});