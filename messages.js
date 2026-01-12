import { API_URL, getAuthHeaders } from './api.js';
import { currentUser, userInfo } from './auth.js';
import { EmojiButton } from 'https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.4/dist/index.js';

let socket = null;
let currentChatUserId = null;
let typingTimeout = null;
let onlineUsersSet = new Set();
let currentListData = []; // Armazena os dados da lista atual (conversas ou contatos) para filtro
let isViewingContacts = false; // Flag para saber qual lista está sendo exibida

export function initMessages(socketInstance) {
    socket = socketInstance;
    const messagesModal = document.getElementById('messages-modal');
    const closeBtn = document.getElementById('close-messages-modal');
    const sendBtn = document.getElementById('msg-send-btn');
    const input = document.getElementById('msg-input');
    const newMsgBtn = document.getElementById('new-msg-btn');
    const searchInput = document.getElementById('msg-search-input');
    const imageBtn = document.getElementById('msg-image-btn');
    const imageInput = document.getElementById('msg-image-input');
    const previewContainer = document.getElementById('msg-preview-container');
    const previewImg = document.getElementById('msg-preview-img');
    const previewClose = document.getElementById('msg-preview-close');
    
    // --- Configuração do Emoji Picker ---
    const picker = new EmojiButton({
        position: 'top-start',
        theme: 'light',
        autoHide: false
    });

    // Cria e insere o botão de emoji dinamicamente
    if (input && !document.getElementById('emoji-btn')) {
        const emojiBtn = document.createElement('button');
        emojiBtn.id = 'emoji-btn';
        emojiBtn.innerHTML = '😊';
        emojiBtn.type = 'button'; // Previne submit do form
        input.parentNode.insertBefore(emojiBtn, input); // Insere antes do input

        emojiBtn.addEventListener('click', () => picker.togglePicker(emojiBtn));
        picker.on('emoji', selection => {
            input.value += selection.emoji;
            input.focus();
        });
    }

    // Solicitar permissão para notificações
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            messagesModal.style.display = 'none';
        });
    }

    // Botão Nova Mensagem (Carregar Contatos)
    if (newMsgBtn) {
        newMsgBtn.addEventListener('click', () => {
            loadContacts();
        });
    }

    // Busca em tempo real
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterAndRenderList(query);
        });
    }

    // Upload de Imagem
    if (imageBtn && imageInput) {
        // Permitir arquivos além de imagens
        imageInput.setAttribute('accept', 'image/*, .pdf, .doc, .docx, .txt, .zip');

        imageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            imageInput.click();
        });
        
        imageInput.addEventListener('change', () => {
            if (imageInput.files.length > 0) {
                const file = imageInput.files[0];
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    if (file.type.startsWith('image/')) {
                        previewImg.src = e.target.result;
                    } else {
                        // Ícone genérico para arquivos
                        previewImg.src = 'https://cdn-icons-png.flaticon.com/512/2965/2965335.png'; 
                    }
                    previewContainer.style.display = 'flex';
                };
                reader.readAsDataURL(file);
                imageBtn.style.color = '#10B981';
            }
        });
    }

    if (previewClose) {
        previewClose.addEventListener('click', () => {
            imageInput.value = '';
            previewContainer.style.display = 'none';
            imageBtn.style.color = '#3B82F6';
        });
    }

    // Enviar mensagem
    if (sendBtn && input) {
        const form = sendBtn.closest('form') || input.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => e.preventDefault());
        }

        const sendMessageHandler = async (e) => {
            e.preventDefault();
            console.log('Tentando enviar mensagem...');
            const text = input.value.trim();
            const file = imageInput ? imageInput.files[0] : null;

            if (!currentChatUserId) {
                alert('Erro: Nenhuma conversa selecionada.');
                return;
            }

            if (!text && !file) {
                alert('Escreva uma mensagem ou selecione uma foto.');
                return;
            }

            try {
                let body;
                let headers = getAuthHeaders();

                if (file) {
                    body = new FormData();
                    body.append('body', text); // Pode ser vazio se for só imagem
                    // Decide se envia como 'photo' ou 'file' baseado no tipo
                    if (file.type.startsWith('image/')) {
                        body.append('photo', file);
                    } else {
                        body.append('file', file);
                    }
                    delete headers['Content-Type']; // Deixa o navegador definir o boundary
                } else {
                    body = JSON.stringify({ body: text });
                }

                const res = await fetch(`${API_URL}/messages/${currentChatUserId}`, {
                    method: 'POST',
                    headers: headers,
                    body: body
                });

                if (res.ok) {
                    const msgData = await res.json();
                    appendMessage(msgData, true);
                    input.value = '';
                    if (imageInput) {
                        imageInput.value = '';
                        imageBtn.style.color = '#3B82F6'; // Reset cor
                        previewContainer.style.display = 'none';
                    }
                    socket.emit('stop_typing', { recipientId: currentChatUserId, senderId: currentUser._id });
                    // Atualiza a lista de conversas para mostrar a última mensagem
                    loadConversations(); 
                } else {
                    const err = await res.json();
                    console.error('Erro no envio:', err);
                    alert('Erro ao enviar: ' + (err.message || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                alert('Erro de conexão ao enviar mensagem.');
            }
        };

        sendBtn.addEventListener('click', sendMessageHandler);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessageHandler(e);
        });

        // Evento de Digitando
        input.addEventListener('input', () => {
            socket.emit('typing', { recipientId: currentChatUserId, senderId: currentUser._id });
            
            if (typingTimeout) clearTimeout(typingTimeout);
            
            typingTimeout = setTimeout(() => {
                socket.emit('stop_typing', { recipientId: currentChatUserId, senderId: currentUser._id });
            }, 2000);
        });
    }

    // Escutar novas mensagens via Socket
    if (socket) {
        socket.on('new_message', (msg) => {
            console.log('Nova mensagem recebida via socket:', msg);
            // Se estiver com o chat aberto com essa pessoa, adiciona a mensagem
            if (currentChatUserId && (msg.sender._id === currentChatUserId || msg.sender === currentChatUserId)) {
                appendMessage(msg, false);
                scrollToBottom();
                
                // Marca como lido imediatamente se o chat estiver aberto
                socket.emit('mark_as_read', { senderId: msg.sender._id || msg.sender, recipientId: currentUser._id });
            }
            
            // Notificação Push se a aba estiver oculta
            if (document.hidden && Notification.permission === 'granted') {
                new Notification(`Nova mensagem de ${msg.sender.name}`, {
                    body: msg.body || 'Enviou uma imagem',
                    icon: msg.sender.avatar
                });
            }
            // Atualiza a lista lateral para mostrar prévia e bolinha de não lido (futuro)
            loadConversations();
        });

        // Lista inicial de usuários online
        socket.on('online_users_list', (users) => {
            onlineUsersSet = new Set(users);
            updateOnlineStatusUI();
        });

        // Mudança de status de um usuário
        socket.on('user_status_change', ({ userId, status, lastSeen }) => {
            if (status === 'online') onlineUsersSet.add(userId);
            else onlineUsersSet.delete(userId);
            updateOnlineStatusUI();
            
            // Se estiver com o chat aberto com esse usuário, atualiza o texto do cabeçalho
            if (currentChatUserId === userId) {
                updateChatHeaderStatus(userId, status === 'online', lastSeen);
            }
        });

        // Indicador de digitando
        socket.on('display_typing', ({ senderId }) => {
            if (currentChatUserId === senderId) {
                document.getElementById('typing-indicator').style.display = 'block';
                scrollToBottom();
            }
        });

        socket.on('hide_typing', ({ senderId }) => {
            if (currentChatUserId === senderId) {
                document.getElementById('typing-indicator').style.display = 'none';
            }
        });

        // Atualização de Recibo de Leitura
        socket.on('messages_read', ({ byUserId }) => {
            if (currentChatUserId === byUserId) {
                const checks = document.querySelectorAll('.msg-check i');
                checks.forEach(icon => {
                    icon.className = 'fas fa-check-double';
                    icon.style.color = '#3B82F6'; // Azul
                });
            }
        });
    }
}

export async function openMessagesModal() {
    const modal = document.getElementById('messages-modal');
    const searchInput = document.getElementById('msg-search-input');
    modal.style.display = 'flex';
    if(searchInput) searchInput.value = ''; // Limpa busca ao abrir
    
    // Carrega conversas por padrão
    await loadConversations();
}

async function loadConversations() {
    const listContainer = document.getElementById('conversations-list-container');
    try {
        const res = await fetch(`${API_URL}/messages`, { headers: getAuthHeaders() });
        const conversations = await res.json();
        currentListData = conversations; // Salva para filtro
        isViewingContacts = false;

        listContainer.innerHTML = '';
        
        if (conversations.length === 0) {
            listContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">Nenhuma conversa iniciada.</p>';
            return;
        }

        renderList(conversations);
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
    }
}

async function loadContacts() {
    const listContainer = document.getElementById('conversations-list-container');
    listContainer.innerHTML = '<p style="padding: 20px; text-align: center;">Carregando contatos...</p>';

    try {
        const res = await fetch(`${API_URL}/users/${currentUser._id}/connections`, { headers: getAuthHeaders() });
        const contacts = await res.json();
        currentListData = contacts; // Salva para filtro
        isViewingContacts = true;

        listContainer.innerHTML = '';
        
        if (contacts.length === 0) {
            listContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">Você ainda não tem conexões.</p>';
            return;
        }

        renderList(contacts);
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        listContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Erro ao carregar contatos.</p>';
    }
}

function filterAndRenderList(query) {
    if (!currentListData) return;
    
    const filtered = currentListData.filter(item => {
        // Se for conversa, o objeto tem 'participant', se for contato, é o próprio objeto
        const user = isViewingContacts ? item : item.participant;
        return user.name.toLowerCase().includes(query);
    });
    
    renderList(filtered);
}

function renderList(data) {
    const listContainer = document.getElementById('conversations-list-container');
    listContainer.innerHTML = '';

    if (data.length === 0) {
        listContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">Nenhum resultado.</p>';
        return;
    }

    data.forEach(item => {
        const user = isViewingContacts ? item : item.participant;
        const isOnline = onlineUsersSet.has(user._id);

        const div = document.createElement('div');
        div.className = 'conversation-item';
        if (currentChatUserId === user._id) div.classList.add('active');
        div.dataset.userId = user._id; // Para atualização de status

        div.innerHTML = `
            <div class="avatar-wrapper">
                <img src="${user.avatar}" class="avatar">
                <span class="online-status-dot ${isOnline ? 'online' : ''}"></span>
            </div>
            <div class="convo-info">
                <strong>${user.name}</strong>
                <small>${isViewingContacts ? 'Iniciar conversa' : 'Clique para conversar'}</small>
            </div>
        `;

        div.addEventListener('click', () => {
            document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            loadChat(user);
        });

        listContainer.appendChild(div);
    });
}

async function loadChat(participant) {
    currentChatUserId = participant._id;
    const chatArea = document.getElementById('msg-chat-area');
    const headerName = document.getElementById('msg-header-name');
    const headerAvatar = document.getElementById('msg-header-avatar');
    const messagesFeed = document.getElementById('msg-feed');
    const inputArea = document.querySelector('.msg-input-area');
    const typingIndicator = document.getElementById('typing-indicator');

    // UI Update
    // Envolve o nome em uma div para estrutura correta se ainda não estiver
    if (!headerName.parentElement.classList.contains('chat-header-info')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-header-info';
        headerName.parentNode.insertBefore(wrapper, headerName);
        wrapper.appendChild(headerName);
    }
    
    headerName.innerText = participant.name;
    headerAvatar.src = participant.avatar;
    headerAvatar.style.display = 'block'; // Torna o avatar visível
    messagesFeed.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando...</p>';
    
    // Habilita área de input
    inputArea.style.display = 'flex';
    typingIndicator.style.display = 'none'; // Reseta indicador

    // Atualiza status inicial
    updateChatHeaderStatus(participant._id, onlineUsersSet.has(participant._id), participant.lastSeen);

    try {
        const res = await fetch(`${API_URL}/messages/${participant._id}`, { headers: getAuthHeaders() });
        const messages = await res.json();

        messagesFeed.innerHTML = '';
        messages.forEach(msg => {
            const isMe = msg.sender === currentUser._id || msg.sender._id === currentUser._id;
            appendMessage(msg, isMe);
        });
        scrollToBottom();

    } catch (error) {
        console.error('Erro ao carregar chat:', error);
    }
}

function appendMessage(msg, isMe) {
    const feed = document.getElementById('msg-feed');
    const div = document.createElement('div');
    div.className = `msg-bubble ${isMe ? 'me' : 'other'}`;
    
    let content = '';
    if (msg.imageUrl) {
        content += `<img src="${msg.imageUrl}" class="msg-image">`;
    }
    if (msg.fileUrl) {
        content += `
            <div class="msg-file-attachment">
                <i class="fas fa-file-alt"></i>
                <a href="${msg.fileUrl}" target="_blank" download="${msg.fileName || 'arquivo'}">
                    ${msg.fileName || 'Baixar Arquivo'}
                </a>
            </div>`;
    }
    if (msg.body) content += `<span>${msg.body}</span>`;
    
    // Adiciona hora e check de leitura para mensagens enviadas por mim
    if (isMe) {
        const checkColor = msg.read ? '#3B82F6' : '#aaa';
        const checkIcon = msg.read ? 'fas fa-check-double' : 'fas fa-check';
        content += `<span class="msg-check" style="margin-left: 8px; font-size: 0.7em;"><i class="${checkIcon}" style="color: ${checkColor}"></i></span>`;
    }

    div.innerHTML = content;
    feed.appendChild(div);
}

function scrollToBottom() {
    const feed = document.getElementById('msg-feed');
    feed.scrollTop = feed.scrollHeight;
}

function updateOnlineStatusUI() {
    const items = document.querySelectorAll('.conversation-item');
    items.forEach(item => {
        const userId = item.dataset.userId;
        const dot = item.querySelector('.online-status-dot');
        if (onlineUsersSet.has(userId)) dot.classList.add('online');
        else dot.classList.remove('online');
    });
}

function updateChatHeaderStatus(userId, isOnline, lastSeen) {
    const headerName = document.getElementById('msg-header-name');
    const wrapper = headerName.parentElement; // .chat-header-info
    
    let statusEl = document.getElementById('msg-header-status');
    if (!statusEl) {
        statusEl = document.createElement('small');
        statusEl.id = 'msg-header-status';
        statusEl.style.color = '#657786';
        statusEl.style.fontSize = '0.8em';
        wrapper.appendChild(statusEl);
    }

    if (isOnline) {
        statusEl.innerText = 'Online';
        statusEl.style.color = '#10B981';
    } else if (lastSeen) {
        statusEl.innerText = `Visto por último: ${formatLastSeen(lastSeen)}`;
        statusEl.style.color = '#657786';
    } else {
        statusEl.innerText = 'Offline';
        statusEl.style.color = '#657786';
    }
}

function formatLastSeen(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Hoje às ${time}`;
    return `${date.toLocaleDateString()} às ${time}`;
}