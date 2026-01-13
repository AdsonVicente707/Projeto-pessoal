import { API_URL, getAuthHeaders, getUploadHeaders, handleApiError } from './api.js';
import { userInfo, currentUser } from './auth.js';
import { EmojiButton } from 'https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.4/dist/index.js';

let socket = null;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let spacePostImageFile = null;

export function initSpaces(socketInstance) {
    socket = socketInstance; // Usa a mesma conexão socket do resto do site
    
    initCreateSpaceModal(); // Inicializa o modal de criação
    
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
        
        // Adiciona o Card de "Criar Novo" como primeiro item
        const createCard = document.createElement('div');
        createCard.className = 'space-card create-new-card';
        createCard.innerHTML = `<i class="fas fa-plus"></i><h3>Criar Novo</h3>`;
        createCard.onclick = openCreateSpaceModal;
        spacesList.appendChild(createCard);

        if (userSpaces.length > 0) {
            userSpaces.forEach(space => {
                const spaceCard = document.createElement('div');
                spaceCard.classList.add('space-card');
                
                // Define o estilo da capa (Imagem, Cor ou Padrão)
                let coverStyle = 'background-color: #3B82F6;'; // Cor padrão (Azul)
                if (space.background) {
                    if (space.background.startsWith('#')) {
                        coverStyle = `background-color: ${space.background};`;
                    } else {
                        coverStyle = `background-image: url('${space.background}');`;
                    }
                }

                spaceCard.innerHTML = `
                    <div class="space-card-cover" style="${coverStyle}">
                        <h3>${space.name}</h3>
                    </div>
                `;
                spaceCard.addEventListener('click', () => showSpaceDetailView(space._id));
                spacesList.appendChild(spaceCard);
            });
        }
    } catch (error) {
        console.error(error);
        spacesList.innerHTML = '<p>Erro ao carregar espaços.</p>';
    }
}

function initCreateSpaceModal() {
    const modal = document.getElementById('create-space-modal');
    const cancelBtn = document.getElementById('cancel-create-space');
    const confirmBtn = document.getElementById('confirm-create-space');
    const nameInput = document.getElementById('new-space-name');
    const colorInput = document.getElementById('new-space-color');

    if(cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';

    if(confirmBtn) confirmBtn.onclick = async () => {
        const name = nameInput.value.trim();
        const color = colorInput.value;
        
        if (!name) return alert('Dê um nome ao espaço.');

        try {
            confirmBtn.innerText = 'Criando...';
            await fetch(`${API_URL}/spaces`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, color }) // Envia a cor também (precisa ajustar backend se quiser salvar já na criação)
            });
            modal.style.display = 'none';
            showSpacesView();
        } catch (error) { alert('Erro ao criar espaço.'); }
        finally { confirmBtn.innerText = 'Criar Espaço'; }
    };
}

function openCreateSpaceModal() {
    const modal = document.getElementById('create-space-modal');
    document.getElementById('new-space-name').value = '';
    modal.style.display = 'flex';
}

export async function showSpaceDetailView(spaceId) {
    document.getElementById('spaces-page').style.display = 'none';
    const spaceDetailPage = document.getElementById('space-detail-page');
    spaceDetailPage.style.display = 'block';

    try {
        const res = await fetch(`${API_URL}/spaces/${spaceId}`, { headers: getAuthHeaders() });
        const space = await res.json();

        // --- Personalização do Espaço (Banner/Fundo) ---
        const bannerEl = document.getElementById('space-banner');
        if (space.background) {
            if (space.background.startsWith('#')) {
                bannerEl.style.backgroundColor = space.background;
                bannerEl.style.backgroundImage = 'none';
            } else {
                bannerEl.style.backgroundImage = `url('${space.background}')`;
            }
        } else {
            bannerEl.style.backgroundImage = 'none';
            bannerEl.style.backgroundColor = '#3B82F6'; // Cor padrão bonita
        }

        document.getElementById('space-detail-name').innerText = space.name;
        document.getElementById('space-members-list').innerHTML = space.members.map(m => `<p>${m.name}</p>`).join('');

        // Mural
        // Correção: Criar elementos de imagem via DOM para facilitar anexar eventos depois
        const spacePhotoGrid = document.getElementById('space-photo-grid');
        spacePhotoGrid.innerHTML = '';
        space.photoUrls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = "Foto do Espaço";
            // Já anexa o evento de lightbox aqui para garantir que funcione
            img.onclick = () => { 
                const lightbox = document.getElementById('lightbox-modal');
                const lightboxImg = document.getElementById('lightbox-img');
                lightboxImg.src = url; 
                lightbox.style.display = 'flex'; 
            };
            spacePhotoGrid.appendChild(img);
        });

        // Setup Tabs
        setupTabs();
        
        // Init Features
        initSpacePosts(spaceId);
        initNotes(spaceId);
        initAudio(spaceId, space.audioUrls || []);
        initChat(spaceId);
        initPhotos(spaceId);

        // Invite
        const inviteContainer = document.getElementById('invite-member-container');
        const settingsBtn = document.getElementById('space-settings-btn');
        
        // Usa comparação solta ou toString para garantir compatibilidade de IDs
        if (space.creator._id.toString() === currentUser._id.toString()) {
            inviteContainer.style.display = 'flex';
            settingsBtn.style.display = 'flex'; // Mostra botão de config
            const btn = document.getElementById('send-invite-button');
            btn.replaceWith(btn.cloneNode(true)); // Remove listeners antigos
            document.getElementById('send-invite-button').addEventListener('click', () => handleSendInvite(spaceId));
            
            // Inicializa lógica de configurações
            initSpaceSettings(space);
        } else {
            inviteContainer.style.display = 'none';
            settingsBtn.style.display = 'none';
        }

        // --- Botão de Sair do Espaço ---
        let leaveBtn = document.getElementById('leave-space-button');
        let deleteBtn = document.getElementById('delete-space-button');
        
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
        
        // Cria o botão de excluir se não existir
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'delete-space-button';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Excluir Espaço';
            deleteBtn.style.backgroundColor = '#EF4444';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.padding = '8px 16px';
            deleteBtn.style.borderRadius = '4px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.marginTop = '10px';
            deleteBtn.style.marginLeft = '10px';
            
            const backBtn = document.getElementById('back-to-spaces-button');
            backBtn.parentNode.insertBefore(deleteBtn, backBtn.nextSibling);
        }

        // Lógica de exibição e clique
        if (space.creator._id.toString() === currentUser._id.toString()) {
            leaveBtn.style.display = 'none'; // Criador não pode sair
            deleteBtn.style.display = 'inline-block';
            
            // Clona para remover listeners antigos
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            newDeleteBtn.onclick = () => initDeleteSpaceFlow(space._id);
        } else {
            deleteBtn.style.display = 'none';
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

function initSpaceSettings(space) {
    const modal = document.getElementById('space-settings-modal');
    const btn = document.getElementById('space-settings-btn');
    const cancelBtn = document.getElementById('cancel-space-settings');
    const saveBtn = document.getElementById('save-space-settings');
    const nameInput = document.getElementById('edit-space-name');
    const colorInput = document.getElementById('edit-space-color');
    const imageInput = document.getElementById('edit-space-image');
    
    // Variável para rastrear se o usuário mexeu na cor
    let colorChanged = false;
    colorInput.oninput = () => colorChanged = true;

    // Abre Modal
    btn.onclick = () => {
        colorChanged = false; // Reseta o estado
        nameInput.value = space.name;
        imageInput.value = ''; // Limpa seleção de arquivo anterior
        if (space.background && space.background.startsWith('#')) {
            colorInput.value = space.background;
        } else {
            colorInput.value = '#3B82F6'; // Reseta para cor padrão se for imagem
        }
        modal.style.display = 'flex';
    };

    // Fecha Modal
    cancelBtn.onclick = () => modal.style.display = 'none';

    // Salva Alterações
    saveBtn.onclick = async () => {
        const formData = new FormData();
        formData.append('name', nameInput.value);
        
        if (imageInput.files.length > 0) {
            formData.append('background', imageInput.files[0]);
        } else if (colorChanged) {
            // Só envia a cor se o usuário tiver alterado ou se não houver imagem definida
            formData.append('color', colorInput.value);
        }

        try {
            saveBtn.textContent = 'Salvando...';
            const res = await fetch(`${API_URL}/spaces/${space._id}`, {
                method: 'PUT',
                headers: getUploadHeaders(),
                body: formData
            });
            if (!res.ok) throw new Error('Erro ao atualizar espaço');
            
            modal.style.display = 'none';
            showSpaceDetailView(space._id); // Recarrega a view
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar configurações.');
        } finally {
            saveBtn.textContent = 'Salvar Alterações';
        }
    };
}

function initDeleteSpaceFlow(spaceId) {
    const modal = document.getElementById('delete-space-modal');
    const confirmCheckbox = document.getElementById('confirm-delete-checkbox');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');

    // Reseta estado inicial
    modal.style.display = 'flex';
    confirmCheckbox.checked = false;
    confirmBtn.disabled = true;

    // Habilita botão apenas se checkbox estiver marcado
    confirmCheckbox.onchange = () => {
        confirmBtn.disabled = !confirmCheckbox.checked;
    };

    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };

    confirmBtn.onclick = async () => {
        try {
            confirmBtn.innerText = 'Apagando...';
            const res = await fetch(`${API_URL}/spaces/${spaceId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!res.ok) throw new Error('Erro ao excluir');

            modal.style.display = 'none';
            alert('Espaço e memórias apagados com sucesso.');
            showSpacesView();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir espaço.');
        } finally {
            confirmBtn.innerText = 'Apagar Espaço';
        }
    };
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

function createSpaceMessageElement(msg, isMe) {
    const div = document.createElement('div');
    div.classList.add('chat-message', isMe ? 'my-message' : 'other-message');
    
    let content = `<strong>${msg.sender.name}</strong>`;
    
    if (msg.imageUrl) {
        content += `<img src="${msg.imageUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 5px;">`;
    }
    if (msg.fileUrl) {
        content += `<div style="margin-top: 5px;"><a href="${msg.fileUrl}" target="_blank" style="color: inherit; text-decoration: underline;">📎 ${msg.fileName || 'Arquivo'}</a></div>`;
    }
    if (msg.message) {
        content += `<p style="margin: 5px 0 0 0;">${msg.message}</p>`;
    }
    
    div.innerHTML = content;
    return div;
}

// --- Sub-features (Simplificadas para caber no módulo) ---

async function initChat(spaceId) {
    if (!socket) return;

    // Remove listeners antigos para evitar mensagens duplicadas
    socket.off('newChatMessage');
    
    // Entra na sala específica deste espaço
    socket.emit('joinSpace', spaceId);
    
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML = ''; // Limpa chat anterior

    // Setup Emoji Picker
    const input = document.getElementById('space-chat-message-input');
    if (input && !document.getElementById('space-emoji-btn')) {
        const emojiBtn = document.createElement('button');
        emojiBtn.id = 'space-emoji-btn';
        emojiBtn.innerHTML = '<i class="far fa-smile"></i>';
        emojiBtn.className = 'space-chat-actions-btn'; // Usa a classe CSS
        
        input.parentNode.insertBefore(emojiBtn, input);
        
        const picker = new EmojiButton({ position: 'auto', theme: 'dark', autoHide: true });
        emojiBtn.addEventListener('click', () => picker.togglePicker(emojiBtn));
        picker.on('emoji', selection => input.value += selection.emoji);
    }

    // Carrega histórico de mensagens
    try {
        const res = await fetch(`${API_URL}/spaces/${spaceId}/messages`, { headers: getAuthHeaders() });
        const messages = await res.json();
        messages.forEach(msg => {
            const isMe = msg.sender._id === currentUser._id;
            chatWindow.appendChild(createSpaceMessageElement(msg, isMe));
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (e) { console.error('Erro ao carregar chat:', e); }

    socket.on('newChatMessage', ({ message, user, fullMessage }) => {
        const isMe = user._id === currentUser._id;
        // Use fullMessage if available (contains file info), otherwise fallback
        const msgData = fullMessage || { message, sender: user };
        chatWindow.appendChild(createSpaceMessageElement(msgData, isMe));
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });

    const sendBtn = document.getElementById('space-chat-send-btn');
    const imageInput = document.getElementById('space-chat-image-input');
    const imageBtn = document.getElementById('space-chat-image-btn');

    imageBtn.onclick = () => imageInput.click();
    imageInput.onchange = () => {
        if(imageInput.files.length > 0) imageBtn.style.color = '#10B981';
    };

    sendBtn.onclick = async () => {
        const text = input.value.trim();
        const file = imageInput.files[0];

        if (!text && !file) return;

        const formData = new FormData();
        if (text) formData.append('message', text);
        if (file) {
            if (file.type.startsWith('image/')) formData.append('photo', file);
            else formData.append('file', file);
        }

        await fetch(`${API_URL}/spaces/${spaceId}/messages`, {
            method: 'POST',
            headers: getUploadHeaders(),
            body: formData
        });

        input.value = '';
        imageInput.value = '';
        imageBtn.style.color = '#3B82F6';
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
            <div class="post-header">
                <img src="${post.author.avatar}" class="avatar">
                <div class="author-info"><strong>${post.author.name}</strong></div>
            </div>
            ${post.imageUrl ? `<img src="${post.imageUrl}">` : ''}
            <div class="post-content"><p>${post.text}</p></div>
            <div class="post-actions">
                <div class="action-button like-button ${post.likes.includes(currentUser._id) ? 'liked' : ''}" data-id="${post._id}">
                    <i class="${post.likes.includes(currentUser._id) ? 'fas' : 'far'} fa-heart"></i> <span>${post.likes.length}</span>
                </div>
                <div class="action-button comment-button" data-id="${post._id}"><i class="far fa-comment"></i></div>
            </div>
            <div class="comments-list">
                ${post.comments.map(c => `
                    <div class="comment-item">
                        <img src="${c.author.avatar}" class="avatar" style="width:24px;height:24px;">
                        <p><strong>${c.author.name}</strong> ${c.text}</p>
                    </div>
                `).join('')}
            </div>
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

    // Event delegation for likes and comments
    feed.onclick = async (e) => {
        const likeBtn = e.target.closest('.like-button');
        const commentBtn = e.target.closest('.comment-button');

        if (likeBtn) {
            await fetch(`${API_URL}/space-posts/${likeBtn.dataset.id}/like`, { method: 'PUT', headers: getAuthHeaders() });
            initSpacePosts(spaceId);
        }
        if (commentBtn) {
            const text = prompt('Escreva seu comentário:');
            if (text) {
                await fetch(`${API_URL}/space-posts/${commentBtn.dataset.id}/comments`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ text })
                });
                initSpacePosts(spaceId);
            }
        }
    };
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

function initAudio(spaceId, existingAudios = []) {
    const list = document.getElementById('audio-list');
    list.innerHTML = '';
    existingAudios.forEach(url => {
        const div = document.createElement('div');
        div.className = 'audio-item';
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = url;
        div.appendChild(audio);
        list.appendChild(div);
    });

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
                showSpaceDetailView(spaceId); // Recarrega para mostrar o novo áudio
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
        if (e.target.files.length === 0) return;
        const formData = new FormData();
        formData.append('photo', e.target.files[0]);
        await fetch(`${API_URL}/spaces/${spaceId}/photos`, { method: 'POST', headers: getUploadHeaders(), body: formData });
        showSpaceDetailView(spaceId);
    };
    document.getElementById('add-space-photo-button').onclick = () => input.click();

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const close = document.getElementById('lightbox-close');
    
    // Nota: Os eventos de clique nas imagens já foram adicionados no loop de criação em showSpaceDetailView
    // Isso evita problemas de timing onde o querySelectorAll rodava antes das imagens existirem
    
    if(close) close.onclick = () => lightbox.style.display = 'none';
    if(lightbox) lightbox.onclick = (e) => { if(e.target === lightbox) lightbox.style.display = 'none'; };
}

async function handleSendInvite(spaceId) {
    const emailInput = document.getElementById('invite-email-input');
    const email = emailInput.value.trim();
    
    if (!email) return alert('Por favor, digite um email.');

    try {
        const res = await fetch(`${API_URL}/spaces/${spaceId}/invite`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Erro ao enviar convite');
        alert('Convite enviado com sucesso!');
        emailInput.value = '';
    } catch (error) {
        console.error(error);
        alert('Erro ao enviar convite. Verifique se o email está correto.');
    }
}