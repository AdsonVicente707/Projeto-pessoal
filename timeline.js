import { API_URL, getUploadHeaders, handleApiError, getAuthHeaders } from './api.js';
import { currentUser, userInfo } from './auth.js';
import { showProfileView } from './profile.js';

export let posts = [];

export function initTimeline() {
    const postButton = document.getElementById('post-button');
    const addPhotoButton = document.getElementById('add-photo-button');
    const imageUploadInput = document.getElementById('image-upload');
    let selectedImageFile = null;

    if (postButton) {
        postButton.addEventListener('click', () => createNewPost(selectedImageFile, () => {
            selectedImageFile = null;
        }));
    }

    if (addPhotoButton) {
        addPhotoButton.addEventListener('click', () => imageUploadInput.click());
    }

    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', (event) => {
            selectedImageFile = event.target.files[0];
            addPhotoButton.innerHTML = '<i class="fas fa-check"></i> Foto Selecionada';
            addPhotoButton.style.backgroundColor = '#d1e7dd';
        });
    }

    // Delegação de eventos para Timeline (Curtir, Comentar)
    const timelineFeed = document.getElementById('timeline-feed');
    timelineFeed.addEventListener('click', handleTimelineClicks);

    fetchAndRenderTimeline();
}

export async function fetchAndRenderTimeline() {
    try {
        const res = await fetch(`${API_URL}/posts`, {
            headers: { 'Authorization': `Bearer ${userInfo.token}` },
        });
        handleApiError(res);
        posts = await res.json();
        renderizarTimeline();
    } catch (error) {
        console.error('Erro ao buscar posts:', error);
    }
}

function renderizarTimeline() {
    const timelineFeed = document.getElementById('timeline-feed');
    timelineFeed.innerHTML = '';
    posts.forEach(post => {
        const postElement = createPostElement(post);
        timelineFeed.appendChild(postElement);
    });
    addClickEventsToPosts();
}

export function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('timeline-post');
    postElement.dataset.postId = post._id;

    const postImageHTML = post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image">` : '';
    const likedClass = post.likes.includes(currentUser._id) ? 'liked' : '';
    const likeIcon = post.likedByMe ? 'fas' : 'far';
    const likeText = post.likedByMe ? 'Curtido' : 'Curtir';

    postElement.innerHTML = `
      <div class="post-header" data-author-id="${post.author._id}">
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

    if (post.comments && post.comments.length > 0) {
        const commentsList = document.createElement('div');
        commentsList.classList.add('comments-list');
        post.comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');
            commentElement.innerHTML = `<p><strong>${comment.author.name}</strong> ${comment.text}</p>`;
            commentsList.appendChild(commentElement);
        });
        postElement.appendChild(commentsList);
    }
    return postElement;
}

async function createNewPost(selectedImageFile, resetCallback) {
    const postTextArea = document.getElementById('post-text');
    const postText = postTextArea.value.trim();

    if (postText === '' && !selectedImageFile) {
        alert('Por favor, escreva algo ou adicione uma foto.');
        return;
    }

    const formData = new FormData();
    formData.append('text', postText);
    if (selectedImageFile) formData.append('photo', selectedImageFile);

    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: getUploadHeaders(),
            body: formData,
        });
        if (!res.ok) throw new Error('Falha ao criar post');

        postTextArea.value = '';
        document.getElementById('image-upload').value = '';
        const addBtn = document.getElementById('add-photo-button');
        addBtn.innerHTML = '<i class="fas fa-camera"></i> Adicionar Foto';
        addBtn.style.backgroundColor = '#e6ecf0';
        if(resetCallback) resetCallback();

        fetchAndRenderTimeline();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao criar post.');
    }
}

function addClickEventsToPosts() {
    document.querySelectorAll('.post-header').forEach(header => {
        header.addEventListener('click', function() {
            const authorName = this.querySelector('.author-info strong').innerText;
            const authorAvatar = this.querySelector('.avatar').src;
            const authorId = this.dataset.authorId;
            showProfileView({ name: authorName, avatar: authorAvatar, _id: authorId });
        });
    });
}

async function handleTimelineClicks(event) {
    // Like Logic
    const likeButton = event.target.closest('.like-button');
    if (likeButton) {
        const postElement = likeButton.closest('.timeline-post');
        const postId = postElement.dataset.postId;
        try {
            await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });
            fetchAndRenderTimeline();
        } catch (e) { console.error(e); }
    }
}

export function showTimelineView() {
    const mainContent = document.querySelector('.main-content');
    const profilePage = document.getElementById('profile-page');
    const explorePage = document.getElementById('explore-page');
    const spacesPage = document.getElementById('spaces-page');
    const spaceDetailPage = document.getElementById('space-detail-page');
    const invitationsPage = document.getElementById('invitations-page');
    const timelineFeed = document.getElementById('timeline-feed');
    const createPostSection = document.querySelector('.create-post');

    mainContent.classList.remove('profile-view');
    profilePage.style.display = 'none';
    explorePage.style.display = 'none';
    spacesPage.style.display = 'none';
    spaceDetailPage.style.display = 'none';
    invitationsPage.style.display = 'none';
    
    timelineFeed.style.display = 'block';
    if(createPostSection) createPostSection.style.display = 'block';
}