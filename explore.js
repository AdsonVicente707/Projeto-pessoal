// Enhanced Explore Module - Instagram Style
import { API_URL, getAuthHeaders } from './api.js';
import { currentUser } from './auth.js';

let currentTab = 'all';
let currentFilter = 'all';
let allPosts = [];
let suggestedUsers = [];

export async function initExplore() {
    setupExploreListeners();
    await loadSuggestedUsers();
    await loadExplorePosts();
}

export function showExploreView() {
    document.getElementById('explore-page').style.display = 'block';
    loadSuggestedUsers();
    loadExplorePosts();
}

function setupExploreListeners() {
    // Search input
    const searchInput = document.getElementById('explore-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch(e.target.value);
            }, 300);
        });
    }

    // Tabs
    document.querySelectorAll('.explore-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.explore-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            filterContent();
        });
    });

    // Filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            filterContent();
        });
    });

    // See all suggestions
    const seeAllBtn = document.getElementById('see-all-suggestions');
    if (seeAllBtn) {
        seeAllBtn.addEventListener('click', () => {
            // Switch to people tab
            document.querySelector('[data-tab="people"]').click();
        });
    }
}

async function loadSuggestedUsers() {
    try {
        const response = await fetch(`${API_URL}/connections/suggestions`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            suggestedUsers = await response.json();
            renderSuggestedUsers();
        }
    } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
        // Fallback: load all users
        loadAllUsers();
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const users = await response.json();
            suggestedUsers = users
                .filter(u => u._id !== currentUser._id)
                .slice(0, 10);
            renderSuggestedUsers();
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function renderSuggestedUsers() {
    const container = document.getElementById('suggested-users-scroll');
    if (!container) return;

    container.innerHTML = '';

    suggestedUsers.forEach(user => {
        const card = document.createElement('div');
        card.className = 'suggested-user-card';

        const isFollowing = user.isFollowing || false;
        const mutualCount = user.mutualConnections || 0;

        card.innerHTML = `
      <img src="${user.avatar || '/uploads/default-avatar.png'}" 
           alt="${user.name}" 
           class="suggested-user-avatar">
      <div class="suggested-user-name">${user.name}</div>
      <div class="suggested-user-mutual">
        ${mutualCount > 0 ? `${mutualCount} conexões em comum` : 'Novo no app'}
      </div>
      <button class="follow-btn ${isFollowing ? 'following' : ''}" 
              data-user-id="${user._id}">
        ${isFollowing ? 'Seguindo' : 'Seguir'}
      </button>
    `;

        const followBtn = card.querySelector('.follow-btn');
        followBtn.addEventListener('click', () => handleFollow(user._id, followBtn));

        container.appendChild(card);
    });
}

async function handleFollow(userId, button) {
    try {
        const isFollowing = button.classList.contains('following');
        const endpoint = isFollowing
            ? `${API_URL}/connections/${userId}/unfollow`
            : `${API_URL}/connections/request/${userId}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            button.classList.toggle('following');
            button.textContent = button.classList.contains('following') ? 'Seguindo' : 'Seguir';
            window.Toast?.show(
                isFollowing ? 'Deixou de seguir' : 'Pedido enviado!',
                'success'
            );
        }
    } catch (error) {
        console.error('Erro ao seguir/deixar de seguir:', error);
        window.Toast?.show('Erro ao processar ação', 'error');
    }
}

async function loadExplorePosts() {
    const grid = document.getElementById('explore-grid');
    const loading = document.getElementById('explore-loading');

    if (loading) loading.style.display = 'flex';
    if (grid) grid.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/posts/explore`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            allPosts = await response.json();
            renderExplorePosts(allPosts);
        } else {
            // Fallback: load all posts
            const fallbackResponse = await fetch(`${API_URL}/posts`, {
                headers: getAuthHeaders()
            });
            if (fallbackResponse.ok) {
                allPosts = await fallbackResponse.json();
                renderExplorePosts(allPosts);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderExplorePosts(posts) {
    const grid = document.getElementById('explore-grid');
    const empty = document.getElementById('explore-empty');

    if (!grid) return;

    grid.innerHTML = '';

    if (posts.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    posts.forEach(post => {
        if (!post.imageUrl) return; // Only show posts with images

        const item = document.createElement('div');
        item.className = 'explore-grid-item';

        item.innerHTML = `
      <img src="${post.imageUrl}" alt="Post" loading="lazy">
      <div class="explore-grid-overlay">
        <div class="explore-stat">
          <i class="fas fa-heart"></i>
          <span>${post.likes?.length || 0}</span>
        </div>
        <div class="explore-stat">
          <i class="fas fa-comment"></i>
          <span>${post.comments?.length || 0}</span>
        </div>
      </div>
    `;

        item.addEventListener('click', () => openPostModal(post));
        grid.appendChild(item);
    });
}

function filterContent() {
    let filtered = [...allPosts];

    // Filter by tab
    if (currentTab === 'people') {
        // Show only suggested users, hide grid
        document.getElementById('explore-grid').style.display = 'none';
        document.getElementById('suggested-users-section').style.display = 'block';
        return;
    } else {
        document.getElementById('explore-grid').style.display = 'grid';
        document.getElementById('suggested-users-section').style.display = 'block';
    }

    // Filter by filter chip
    if (currentFilter === 'family') {
        filtered = filtered.filter(p => p.author?.isFamily);
    } else if (currentFilter === 'recent') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentFilter === 'popular') {
        filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    renderExplorePosts(filtered);
}

async function handleSearch(query) {
    if (!query.trim()) {
        renderExplorePosts(allPosts);
        return;
    }

    const loading = document.getElementById('explore-loading');
    if (loading) loading.style.display = 'flex';

    try {
        // Search users
        const usersResponse = await fetch(`${API_URL}/connections/search?name=${query}`, {
            headers: getAuthHeaders()
        });

        if (usersResponse.ok) {
            const users = await usersResponse.json();
            suggestedUsers = users;
            renderSuggestedUsers();
        }

        // Filter posts by content
        const filtered = allPosts.filter(post =>
            post.content?.toLowerCase().includes(query.toLowerCase()) ||
            post.author?.name?.toLowerCase().includes(query.toLowerCase())
        );

        renderExplorePosts(filtered);
    } catch (error) {
        console.error('Erro na busca:', error);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function openPostModal(post) {
    // TODO: Implement post modal view
    console.log('Open post:', post);
    window.Toast?.show('Visualização de post em desenvolvimento', 'info');
}

// Export functions
window.initExplore = initExplore;
window.showExploreView = showExploreView;
