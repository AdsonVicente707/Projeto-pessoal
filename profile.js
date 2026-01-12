import { createPostElement, posts } from './timeline.js';
import { API_URL, getUploadHeaders, getAuthHeaders } from './api.js';
import { currentUser } from './auth.js';
import { showSpaceDetailView } from './spaces.js';

export function initProfile() {
    const avatarInput = document.getElementById('profile-avatar-input');
    const editOverlay = document.getElementById('profile-avatar-edit-overlay');

    // Elementos do Modal de Recorte
    const cropModal = document.getElementById('crop-modal');
    const cropImage = document.getElementById('crop-image');
    const cropSaveBtn = document.getElementById('crop-save-btn');
    const cropCancelBtn = document.getElementById('crop-cancel-btn');
    let cropper = null;

    // Elementos do Modal de Posição
    const positionModal = document.getElementById('position-modal');
    const posPreview = document.getElementById('position-preview-image');
    const posXInput = document.getElementById('pos-x');
    const posYInput = document.getElementById('pos-y');
    const posSaveBtn = document.getElementById('pos-save-btn');
    const posCancelBtn = document.getElementById('pos-cancel-btn');

    // Elementos do Modal de Seguindo
    const connectionsModal = document.getElementById('connections-modal');
    const closeConnectionsModal = document.getElementById('close-connections-modal');

    if (editOverlay) {
        editOverlay.addEventListener('click', () => avatarInput.click());
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                cropImage.src = e.target.result;
                cropModal.style.display = 'flex';

                if (cropper) {
                    cropper.destroy();
                }
                // Inicializa o Cropper
                cropper = new Cropper(cropImage, {
                    aspectRatio: 1, // Força quadrado (1:1)
                    viewMode: 1,
                    autoCropArea: 1,
                });
            };
            reader.readAsDataURL(file);
        });
    }

    if (cropCancelBtn) {
        cropCancelBtn.addEventListener('click', () => {
            cropModal.style.display = 'none';
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            avatarInput.value = '';
        });
    }

    if (cropSaveBtn) {
        cropSaveBtn.addEventListener('click', () => {
            if (!cropper) return;

            // Obtém o canvas recortado e converte para Blob
            cropper.getCroppedCanvas({
                width: 300,
                height: 300,
            }).toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('photo', blob, 'avatar.png');

                try {
                    cropSaveBtn.textContent = 'Salvando...';
                    cropSaveBtn.disabled = true;

                    const res = await fetch(`${API_URL}/users/profile/picture`, {
                        method: 'PUT',
                        headers: getUploadHeaders(),
                        body: formData
                    });

                    if (!res.ok) throw new Error('Falha ao atualizar avatar');

                    const data = await res.json();
                    
                    // Atualiza a imagem na tela
                    // Correção: O backend retorna o objeto usuário, então o campo é 'avatar'
                    document.getElementById('profile-avatar').src = data.avatar;
                    
                    // Atualiza o localStorage e o objeto currentUser para persistir a mudança
                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                    if (userInfo) {
                        userInfo.avatar = data.avatar; 
                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                    }
                    if (currentUser) currentUser.avatar = data.avatar;
                    
                    // Fecha o modal de recorte e abre o de posição
                    cropModal.style.display = 'none';
                    if (cropper) {
                        cropper.destroy();
                        cropper = null;
                    }
                    avatarInput.value = '';

                    // Abre o modal de posição automaticamente
                    posPreview.src = data.avatar;
                    posXInput.value = currentUser.avatarPosX || 50;
                    posYInput.value = currentUser.avatarPosY || 50;
                    posPreview.style.objectPosition = `${posXInput.value}% ${posYInput.value}%`;
                    positionModal.style.display = 'flex';

                } catch (error) {
                    console.error(error);
                    alert('Erro ao atualizar foto de perfil.');
                } finally {
                    cropSaveBtn.textContent = 'Salvar Corte';
                    cropSaveBtn.disabled = false;
                }
            }, 'image/png');
        });
    }

    // Lógica de Ajuste de Posição (Botão manual removido)

    const updatePreviewPos = () => {
        posPreview.style.objectPosition = `${posXInput.value}% ${posYInput.value}%`;
    };

    if (posXInput) posXInput.addEventListener('input', updatePreviewPos);
    if (posYInput) posYInput.addEventListener('input', updatePreviewPos);

    if (posCancelBtn) {
        posCancelBtn.addEventListener('click', () => {
            positionModal.style.display = 'none';
        });
    }

    if (posSaveBtn) {
        posSaveBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(`${API_URL}/users/profile/position`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        x: parseInt(posXInput.value),
                        y: parseInt(posYInput.value)
                    })
                });
                if (!res.ok) throw new Error('Erro ao salvar posição');
                const data = await res.json();

                // Atualiza localmente
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                userInfo.avatarPosX = data.avatarPosX;
                userInfo.avatarPosY = data.avatarPosY;
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                if (currentUser) { currentUser.avatarPosX = data.avatarPosX; currentUser.avatarPosY = data.avatarPosY; }

                // Atualiza visualização
                document.getElementById('profile-avatar').style.objectPosition = `${data.avatarPosX}% ${data.avatarPosY}%`;
                positionModal.style.display = 'none';
            } catch (e) {
                console.error(e);
                alert('Erro ao salvar posição.');
            }
        });
    }

    // Lógica para fechar o modal de Seguindo
    if (closeConnectionsModal) {
        closeConnectionsModal.addEventListener('click', () => {
            connectionsModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === connectionsModal) {
            connectionsModal.style.display = 'none';
        }
    });
}

export async function showProfileView(author) {
    const mainContent = document.querySelector('.main-content');
    const profilePage = document.getElementById('profile-page');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profilePostsTitle = document.getElementById('profile-posts-title');
    const profilePostsFeed = document.getElementById('profile-posts-feed');
    const familyMemoriesFeed = document.getElementById('family-memories-feed');
    const familyTab = document.getElementById('family-memories-tab');
    const connectionsCount = document.getElementById('profile-connections-count');
    const followingCount = document.getElementById('profile-following-count');
    const profileCreatedSpaces = document.getElementById('profile-created-spaces');

    // UI Updates
    if (author.avatar && author.avatar.includes('pravatar.cc')) {
        profileAvatar.src = author.avatar.replace('40', '80');
    } else {
        profileAvatar.src = author.avatar;
    }
    
    // Aplica a posição salva
    profileAvatar.style.objectPosition = `${author.avatarPosX || 50}% ${author.avatarPosY || 50}%`;

    profileName.innerText = author.name;
    if (profileBio) {
        profileBio.innerText = author.bio || ''; // Exibe a bio se existir
    }
    profilePostsTitle.innerText = `Posts de ${author.name}`;
    profilePostsFeed.innerHTML = '';
    familyMemoriesFeed.innerHTML = '';
    familyMemoriesFeed.style.display = 'none';
    if (profileCreatedSpaces) profileCreatedSpaces.innerHTML = '';
    document.querySelector('.profile-tab-btn[data-target="profile-posts-feed"]').click(); // Reseta aba

    mainContent.classList.add('profile-view');
    profilePage.style.display = 'block';
    
    // Verifica se é o perfil do usuário logado para mostrar o botão de editar
    const editOverlay = document.getElementById('profile-avatar-edit-overlay');
    if (currentUser && author._id === currentUser._id) {
        if(editOverlay) editOverlay.style.display = 'block';
        profileAvatar.style.cursor = 'pointer';
        profileAvatar.onclick = () => document.getElementById('profile-avatar-input').click();
    } else {
        if(editOverlay) editOverlay.style.display = 'none';
        profileAvatar.style.cursor = 'default';
        profileAvatar.onclick = null;
    }

    // --- Lógica de Abas do Perfil ---
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            profilePostsFeed.style.display = btn.dataset.target === 'profile-posts-feed' ? 'block' : 'none';
            familyMemoriesFeed.style.display = btn.dataset.target === 'family-memories-feed' ? 'block' : 'none';
            if (btn.dataset.target === 'profile-posts-feed') profilePostsTitle.style.display = 'block';
            else profilePostsTitle.style.display = 'none';
        };
    });

    // --- Buscar Estatísticas e Status de Família ---
    try {
        const res = await fetch(`${API_URL}/users/${author._id}/profile-info`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            connectionsCount.innerText = data.connectionsCount || 0;
            followingCount.innerText = data.followingCount || 0;

            // --- Lógica do Modal de Seguindo ---
            followingCount.style.cursor = 'pointer';
            followingCount.onclick = async () => {
                const connectionsModal = document.getElementById('connections-modal');
                const connectionsList = document.getElementById('connections-list');
                
                connectionsList.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando...</p>';
                connectionsModal.style.display = 'flex';

                try {
                    const res = await fetch(`${API_URL}/users/${author._id}/connections`, {
                        headers: getAuthHeaders()
                    });
                    
                    if (!res.ok) throw new Error('Erro ao buscar conexões');
                    
                    const connections = await res.json();
                    connectionsList.innerHTML = '';

                    if (connections.length === 0) {
                        connectionsList.innerHTML = '<p style="text-align:center; color: #666; padding: 20px;">Nenhuma conexão encontrada.</p>';
                    } else {
                        connections.forEach(user => {
                            const item = document.createElement('div');
                            item.style.display = 'flex';
                            item.style.alignItems = 'center';
                            item.style.padding = '10px';
                            item.style.borderBottom = '1px solid #f0f0f0';
                            item.style.gap = '10px';

                            const avatar = document.createElement('img');
                            avatar.src = user.avatar;
                            avatar.style.width = '40px';
                            avatar.style.height = '40px';
                            avatar.style.borderRadius = '50%';
                            avatar.style.objectFit = 'cover';
                            avatar.style.objectPosition = `${user.avatarPosX || 50}% ${user.avatarPosY || 50}%`;

                            const info = document.createElement('div');
                            info.style.flexGrow = '1';
                            const name = document.createElement('strong');
                            name.innerText = user.name;
                            name.style.display = 'block';
                            info.appendChild(name);

                            const btn = document.createElement('button');
                            btn.innerText = 'Ver Perfil';
                            btn.style.padding = '6px 12px';
                            btn.style.border = '1px solid #dbdbdb';
                            btn.style.borderRadius = '4px';
                            btn.style.background = 'white';
                            btn.style.cursor = 'pointer';
                            btn.onclick = () => {
                                connectionsModal.style.display = 'none';
                                showProfileView(user);
                            };

                            item.appendChild(avatar);
                            item.appendChild(info);
                            item.appendChild(btn);
                            connectionsList.appendChild(item);
                        });
                    }
                } catch (error) {
                    console.error(error);
                    connectionsList.innerHTML = '<p style="text-align:center; color: red; padding: 20px;">Erro ao carregar lista.</p>';
                }
            };

            // --- Lógica do Botão de Seguir ---
            const existingBtn = document.getElementById('profile-follow-btn');
            if (existingBtn) existingBtn.remove();

            if (currentUser && author._id !== currentUser._id) {
                const btn = document.createElement('button');
                btn.id = 'profile-follow-btn';
                // Estilos para uma interface agradável
                btn.style.marginTop = '15px';
                btn.style.padding = '8px 24px';
                btn.style.borderRadius = '20px';
                btn.style.border = 'none';
                btn.style.cursor = 'pointer';
                btn.style.fontWeight = '600';
                btn.style.fontSize = '0.9rem';
                btn.style.transition = 'all 0.2s ease';
                btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

                const setButtonState = (status) => {
                    switch(status) {
                        case 'none':
                            btn.textContent = 'Seguir';
                            btn.style.backgroundColor = '#333'; // Destaque
                            btn.style.color = 'white';
                            btn.disabled = false;
                            btn.onclick = async () => {
                                try {
                                    btn.textContent = 'Enviando...';
                                    btn.disabled = true;
                                    await fetch(`${API_URL}/connections/request/${author._id}`, {
                                        method: 'POST',
                                        headers: getAuthHeaders()
                                    });
                                    setButtonState('pending_sent');
                                } catch (e) {
                                    console.error(e);
                                    setButtonState('none');
                                }
                            };
                            break;
                        case 'pending_sent':
                            btn.textContent = 'Solicitado';
                            btn.style.backgroundColor = '#e0e0e0';
                            btn.style.color = '#666';
                            btn.style.cursor = 'default';
                            btn.disabled = true;
                            break;
                        case 'pending_received':
                            btn.textContent = 'Responder ao Pedido';
                            btn.style.backgroundColor = '#4CAF50'; // Verde para ação positiva
                            btn.style.color = 'white';
                            btn.onclick = () => {
                                // Redireciona para a aba de convites
                                const invitesTab = Array.from(document.querySelectorAll('.sidebar nav li')).find(li => li.innerText.includes('Convites'));
                                if(invitesTab) invitesTab.click();
                            };
                            break;
                        case 'connected':
                            btn.textContent = 'Seguindo';
                            btn.style.backgroundColor = 'transparent';
                            btn.style.border = '1px solid #333';
                            btn.style.color = '#333';
                            btn.style.cursor = 'pointer';
                            
                            // Efeito de Hover para "Deixar de Seguir"
                            btn.onmouseover = () => {
                                btn.textContent = 'Deixar de Seguir';
                                btn.style.borderColor = '#ff4444';
                                btn.style.color = '#ff4444';
                                btn.style.backgroundColor = '#fff0f0';
                            };
                            btn.onmouseout = () => {
                                btn.textContent = 'Seguindo';
                                btn.style.borderColor = '#333';
                                btn.style.color = '#333';
                                btn.style.backgroundColor = 'transparent';
                            };

                            btn.onclick = async () => {
                                if (confirm('Tem certeza que deseja deixar de seguir este usuário?')) {
                                    try {
                                        await fetch(`${API_URL}/connections/${author._id}`, {
                                            method: 'DELETE',
                                            headers: getAuthHeaders()
                                        });
                                        setButtonState('none');
                                        // Atualiza contadores visualmente (opcional)
                                        const countEl = document.getElementById('profile-connections-count');
                                        if(countEl) countEl.innerText = Math.max(0, parseInt(countEl.innerText) - 1);
                                    } catch (e) {
                                        console.error(e);
                                        alert('Erro ao desfazer conexão.');
                                    }
                                }
                            };
                            break;
                    }
                };

                setButtonState(data.connectionStatus);
                
                // Adiciona o botão ao cabeçalho do perfil
                const header = document.querySelector('.profile-header-section');
                header.appendChild(btn);
            }

            // Verifica se é família ou o próprio usuário para mostrar a aba
            if (data.isFamily || (currentUser && author._id === currentUser._id)) {
                familyTab.style.display = 'inline-block';
                if (data.isFamily) {
                    profileName.innerHTML = `${author.name} <i class="fas fa-users" title="Familiar" style="color: #4CAF50; font-size: 0.8em;"></i>`;
                }
                fetchFamilyMemories(author._id);
            } else {
                familyTab.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Erro ao buscar info do perfil", error);
    }

    // --- Buscar Espaços Criados pelo Usuário ---
    if (profileCreatedSpaces) {
        try {
            profileCreatedSpaces.innerHTML = '<p>Carregando espaços...</p>';
            const res = await fetch(`${API_URL}/spaces/user/${author._id}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const spaces = await res.json();
                if (spaces.length > 0) {
                    profileCreatedSpaces.innerHTML = ''; // Limpa o carregando
                    const title = document.createElement('h3');
                    title.innerText = 'Espaços';
                    title.style.marginTop = '20px';
                    profileCreatedSpaces.appendChild(title);

                    const list = document.createElement('div');
                    list.className = 'spaces-list';
                    spaces.forEach(space => {
                        const card = document.createElement('div');
                        card.className = 'space-card';
                        card.innerHTML = `<h3>${space.name}</h3>`;
                        card.addEventListener('click', () => showSpaceDetailView(space._id));
                        list.appendChild(card);
                    });
                    profileCreatedSpaces.appendChild(list);
                } else {
                    profileCreatedSpaces.innerHTML = '<p style="margin: 20px 0; color: #666;">Este usuário não participa de nenhum espaço.</p>';
                }
            } else {
                profileCreatedSpaces.innerHTML = '<p style="color: red;">Erro ao carregar espaços.</p>';
            }
        } catch (error) {
            console.error('Erro ao buscar espaços do perfil:', error);
            profileCreatedSpaces.innerHTML = '<p style="color: red;">Erro de conexão.</p>';
        }
    }

    // --- Renderizar Posts Públicos ---
    // Tenta usar posts em cache primeiro, se não houver, busca do servidor (melhoria de robustez)
    let authorPosts = posts.filter(post => post.author.name === author.name);
    
    profilePostsFeed.innerHTML = '';
    if (authorPosts.length > 0) {
        authorPosts.slice().reverse().forEach(post => {
            const postElement = createPostElement(post);
            postElement.querySelector('.post-header').style.pointerEvents = 'none';
            profilePostsFeed.appendChild(postElement);
        });
    } else {
        profilePostsFeed.innerHTML = '<p>Nenhum post público ainda.</p>';
    }
}

async function fetchFamilyMemories(userId) {
    const feed = document.getElementById('family-memories-feed');
    try {
        const res = await fetch(`${API_URL}/users/${userId}/private-memories`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const memories = await res.json();
            feed.innerHTML = '';
            if (memories.length === 0) feed.innerHTML = '<p>Nenhuma memória de família encontrada.</p>';
            
            memories.forEach(post => {
                const postElement = createPostElement(post);
                postElement.classList.add('family-post'); // Estilo visual opcional
                feed.appendChild(postElement);
            });
        }
    } catch (e) { console.error(e); }
}