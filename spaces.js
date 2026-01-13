import { API_URL, getAuthHeaders, getUploadHeaders, handleApiError } from './api.js';
import { userInfo, currentUser } from './auth.js';

let socket = null;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let spacePostImageFile = null;

export function initSpaces() {
    const createSpaceButton = document.getElementById('create-space-button');
    if (createSpaceButton) {
        createSpaceButton.addEventListener('click', handleCreateSpace);
    }
    
    const backButton = document.getElementById('back-to-spaces-button');
    if(backButton) {
        backButton.addEventListener('click', showSpacesView);
    }
}

export async function showSpacesView() {
    const spacesPage = document.getElementById('spaces-page');
    const spaceDetailPage = document.getElementById('space-detail-page');
    const spacesList = document.getElementById('spaces-list');

    spacesPage.style.display = 'block';
    spaceDetailPage.style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/spaces`, { headers: getAuthHeaders() });
        handleApiError(res);
        const userSpaces = await res.json();

        spacesList.innerHTML = '';
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
        spacesList.innerHTML = '<p>Erro ao carregar espaços.</p>';
    }
}

async function handleCreateSpace() {
    const spaceNameInput = document.getElementById('space-name-input');
    const name = spaceNameInput.value.trim();
    if (!name) return alert('Dê um nome ao espaço.');

    try {
        await fetch(`${API_URL}/spaces`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });
        spaceNameInput.value = '';
        showSpacesView();
    } catch (error) { alert('Erro ao criar espaço.'); }
}

export async function showSpaceDetailView(spaceId) {
    document.getElementById('spaces-page').style.display = 'none';
    const spaceDetailPage = document.getElementById('space-detail-page');
    spaceDetailPage.style.display = 'block';

    try {
        const res = await fetch(`${API_URL}/spaces/${spaceId}`, { headers: getAuthHeaders() });
        const space = await res.json();

        document.getElementById('space-detail-name').innerText = space.name;
        document.getElementById('space-members-list').innerHTML = space.members.map(m => `<p>${m.name}</p>`).join('');

        // Mural
        const spacePhotoGrid = document.getElementById('space-photo-grid');
        spacePhotoGrid.innerHTML = '';
        space.photoUrls.forEach(url => {
            spacePhotoGrid.innerHTML += `<img src="${url}" alt="Foto">`;
        });

        // Setup Tabs
        setupTabs();
        
        // Init Features
        initSpacePosts(spaceId);
        initNotes(spaceId);
        initAudio(spaceId);
        initChat(spaceId);
        initPhotos(spaceId);

        // Invite
        const inviteContainer = document.getElementById('invite-member-container');
        if (space.creator._id === currentUser._id) {
            inviteContainer.style.display = 'flex';
            const btn = document.getElementById('send-invite-button');
            btn.replaceWith(btn.cloneNode(true)); // Remove listeners antigos
            document.getElementById('send-invite-button').addEventListener('click', () => handleSendInvite(spaceId));
        } else {
            inviteContainer.style.display = 'none';
        }

        // --- Botão de Sair do Espaço ---
        let leaveBtn = document.getElementById('leave-space-button');
        
        // Cria o botão se não existir
        if (!leaveBtn) {
            leaveBtn = document.createElement('button');
            leaveBtn.id = 'leave-space-button';
            leaveBtn.innerText = 'Sair do Espaço';
            // Estilos inline para visualização imediata
            leaveBtn.style.backgroundColor = '#ff4444';
            leaveBtn.style.color = 'white';
            leaveBtn.style.border = 'none';
            leaveBtn.style.padding = '8px 16px';
            leaveBtn.style.borderRadius = '4px';
            leaveBtn.style.cursor = 'pointer';
            leaveBtn.style.marginTop = '10px';
            leaveBtn.style.marginLeft = '10px';
            
            // Insere ao lado do botão de voltar ou abaixo do título
            const backBtn = document.getElementById('back-to-spaces-button');
            backBtn.parentNode.insertBefore(leaveBtn, backBtn.nextSibling);
        }

        // Lógica de exibição e clique
        if (space.creator._id === currentUser._id) {
            leaveBtn.style.display = 'none'; // Criador não pode sair
        } else {
            leaveBtn.style.display = 'inline-block';
            // Clona o botão para remover listeners antigos
            const newLeaveBtn = leaveBtn.cloneNode(true);
            leaveBtn.parentNode.replaceChild(newLeaveBtn, leaveBtn);
            
            newLeaveBtn.onclick = async () => {
                if (confirm(`Tem certeza que deseja sair do espaço "${space.name}"?`)) {
                    try {
                        const res = await fetch(`${API_URL}/spaces/${spaceId}/leave`, {
                            method: 'POST',
                            headers: getAuthHeaders()
                        });
                        if (!res.ok) throw new Error('Erro ao sair do espaço');
                        
                        alert('Você saiu do espaço.');
                        showSpacesView(); // Volta para a lista
                    } catch (error) {
                        console.error(error);
                        alert('Não foi possível sair do espaço.');
                    }
                }
            };
        }

    } catch (error) { console.error(error); }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(c => c.style.display = c.id === `${tab.dataset.tab}-content` ? 'block' : 'none');
        });
    });
    document.querySelector('.tab-button[data-tab="mural"]').click();
}

// --- Sub-features (Simplificadas para caber no módulo) ---

function initChat(spaceId) {
    if (socket) socket.disconnect();
    // Assumindo que io está global via CDN no index.html
    socket = window.io('/', { auth: { token: userInfo.token } });
    socket.emit('joinSpace', spaceId);
    
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML = ''; // Limpa chat anterior

    socket.on('newChatMessage', ({ message, user }) => {
        const div = document.createElement('div');
        div.classList.add('chat-message', user._id === currentUser._id ? 'my-message' : 'other-message');
        div.innerHTML = `<strong>${user.name}</strong><p>${message}</p>`;
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });

    const form = document.getElementById('chat-input-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-message-input');
        if(input.value.trim()) {
            socket.emit('chatMessage', { spaceId, message: input.value.trim(), user: currentUser });
            input.value = '';
        }
    };
}

async function initSpacePosts(spaceId) {
    const feed = document.getElementById('space-timeline-feed');
    feed.innerHTML = '';
    const res = await fetch(`${API_URL}/space-posts/${spaceId}`, { headers: getAuthHeaders() });
    const posts = await res.json();
    
    posts.forEach(post => {
        const div = document.createElement('div');
        div.classList.add('timeline-post');
        div.innerHTML = `
            <div class="post-header"><strong>${post.author.name}</strong></div>
            ${post.imageUrl ? `<img src="${post.imageUrl}">` : ''}
            <p>${post.text}</p>
        `;
        feed.appendChild(div);
    });

    const btn = document.getElementById('create-space-post-button');
    btn.onclick = async () => {
        const text = document.getElementById('space-post-text').value;
        const formData = new FormData();
        formData.append('text', text);
        if(spacePostImageFile) formData.append('photo', spacePostImageFile);
        
        await fetch(`${API_URL}/space-posts/${spaceId}`, {
            method: 'POST',
            headers: getUploadHeaders(),
            body: formData
        });
        document.getElementById('space-post-text').value = '';
        initSpacePosts(spaceId);
    };

    const fileInput = document.getElementById('space-post-image-upload');
    fileInput.onchange = (e) => spacePostImageFile = e.target.files[0];
    document.getElementById('add-space-post-photo-button').onclick = () => fileInput.click();
}

async function initNotes(spaceId) {
    const list = document.getElementById('notes-list');
    const res = await fetch(`${API_URL}/notes/${spaceId}`, { headers: getAuthHeaders() });
    const notes = await res.json();
    list.innerHTML = notes.map(n => `<div class="note-card"><p>${n.text}</p></div>`).join('');

    document.getElementById('create-note-button').onclick = async () => {
        const text = document.getElementById('note-text-input').value;
        await fetch(`${API_URL}/notes/${spaceId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ text })
        });
        document.getElementById('note-text-input').value = '';
        initNotes(spaceId);
    };
}

function initAudio(spaceId) {
    // Lógica simplificada de áudio
    const btn = document.getElementById('record-audio-button');
    btn.onclick = async () => {
        if(isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            btn.textContent = 'Gravar Áudio';
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', blob, 'rec.webm');
                await fetch(`${API_URL}/spaces/${spaceId}/audios`, { method: 'POST', headers: getUploadHeaders(), body: formData });
            };
            mediaRecorder.start();
            isRecording = true;
            btn.textContent = 'Parar';
        }
    };
}

function initPhotos(spaceId) {
    const input = document.getElementById('photo-upload-input');
    input.onchange = async (e) => {
        const formData = new FormData();
        formData.append('photo', e.target.files[0]);
        await fetch(`${API_URL}/spaces/${spaceId}/photos`, { method: 'POST', headers: getUploadHeaders(), body: formData });
        showSpaceDetailView(spaceId);
    };
    document.getElementById('add-space-photo-button').onclick = () => input.click();
}

async function handleSendInvite(spaceId) { /* Lógica de convite similar ao original */ }