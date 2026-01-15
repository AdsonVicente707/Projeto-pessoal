// Stories Module - Frontend Integration
import { API_URL, getAuthHeaders, getUploadHeaders } from './api.js';
import { currentUser } from './auth.js';

let currentStoryIndex = 0;
let currentUserStories = [];
let allStoriesData = [];

// Initialize Stories
export async function initStories() {
    await loadStories();
    setupStoryUpload();
}

// Load all active stories
async function loadStories() {
    try {
        const response = await fetch(`${API_URL}/stories`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            allStoriesData = await response.json();
            renderStories();
        }
    } catch (error) {
        console.error('Erro ao carregar stories:', error);
    }
}

// Render stories in the UI
function renderStories() {
    const storiesScroll = document.getElementById('stories-scroll');
    if (!storiesScroll) return;

    storiesScroll.innerHTML = '';

    // Add "Create Story" button
    const addStoryBtn = document.createElement('div');
    addStoryBtn.className = 'story-item add-story';
    addStoryBtn.innerHTML = `
    <div class="story-avatar-wrapper">
      <div class="story-avatar-ring">
        <img src="${currentUser.avatar || '/uploads/default-avatar.png'}" 
             alt="Seu Story" class="story-avatar">
      </div>
      <div class="add-story-icon">+</div>
    </div>
    <div class="story-username">Criar Story</div>
  `;
    addStoryBtn.onclick = () => document.getElementById('story-upload-input').click();
    storiesScroll.appendChild(addStoryBtn);

    // Render user stories
    allStoriesData.forEach((userStory, index) => {
        const storyItem = document.createElement('div');
        storyItem.className = 'story-item';

        const hasViewed = userStory.stories.every(story =>
            story.views.some(view => view.user === currentUser._id)
        );

        storyItem.innerHTML = `
      <div class="story-avatar-wrapper">
        <div class="story-avatar-ring ${hasViewed ? 'viewed' : ''}">
          <img src="${userStory.user.avatar || '/uploads/default-avatar.png'}" 
               alt="${userStory.user.name}" class="story-avatar">
        </div>
      </div>
      <div class="story-username">${userStory.user.name}</div>
    `;

        storyItem.onclick = () => openStoryViewer(index);
        storiesScroll.appendChild(storyItem);
    });
}

// Setup story upload
function setupStoryUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'story-upload-input';
    input.accept = 'image/*,video/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('media', file);

        const caption = prompt('Adicione uma legenda (opcional):');
        if (caption) formData.append('caption', caption);

        try {
            const response = await fetch(`${API_URL}/stories`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });

            if (response.ok) {
                window.Toast.show('Story criado com sucesso!', 'success');
                await loadStories();
            } else {
                window.Toast.show('Erro ao criar story', 'error');
            }
        } catch (error) {
            console.error('Erro ao fazer upload do story:', error);
            window.Toast.show('Erro ao criar story', 'error');
        }

        input.value = '';
    };
}

// Open story viewer
function openStoryViewer(userIndex) {
    currentStoryIndex = 0;
    currentUserStories = allStoriesData[userIndex].stories;

    const viewer = document.createElement('div');
    viewer.className = 'story-viewer';
    viewer.id = 'story-viewer';

    viewer.innerHTML = `
    <div class="story-viewer-content">
      <div class="story-viewer-header">
        <div class="story-viewer-progress">
          <div class="story-viewer-progress-bar" id="story-progress-bar"></div>
        </div>
        <div class="story-viewer-user">
          <img src="${currentUserStories[0].user.avatar || '/uploads/default-avatar.png'}" 
               class="story-viewer-avatar">
          <div class="story-viewer-info">
            <div class="story-viewer-name">${currentUserStories[0].user.name}</div>
            <div class="story-viewer-time" id="story-time">Agora</div>
          </div>
        </div>
        <button class="story-viewer-close" onclick="this.closest('.story-viewer').remove()">&times;</button>
      </div>
      <img id="story-media" class="story-viewer-media" src="">
      <div class="story-viewer-caption" id="story-caption"></div>
    </div>
  `;

    document.body.appendChild(viewer);
    showStory(0);

    // Auto-advance stories
    let progressInterval;
    const startProgress = () => {
        const progressBar = document.getElementById('story-progress-bar');
        let progress = 0;
        progressInterval = setInterval(() => {
            progress += 1;
            progressBar.style.width = progress + '%';
            if (progress >= 100) {
                clearInterval(progressInterval);
                nextStory();
            }
        }, 50); // 5 seconds total
    };

    startProgress();

    // Click to navigate
    viewer.onclick = (e) => {
        if (e.target.classList.contains('story-viewer-close')) return;
        if (e.clientX < window.innerWidth / 2) {
            previousStory();
        } else {
            clearInterval(progressInterval);
            nextStory();
        }
    };
}

// Show specific story
async function showStory(index) {
    if (index < 0 || index >= currentUserStories.length) {
        document.getElementById('story-viewer')?.remove();
        return;
    }

    const story = currentUserStories[index];
    const media = document.getElementById('story-media');
    const caption = document.getElementById('story-caption');
    const timeEl = document.getElementById('story-time');

    media.src = story.media;
    caption.textContent = story.caption || '';

    const timeAgo = getTimeAgo(new Date(story.createdAt));
    timeEl.textContent = timeAgo;

    // Mark as viewed
    await fetch(`${API_URL}/stories/${story._id}/view`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
}

function nextStory() {
    currentStoryIndex++;
    showStory(currentStoryIndex);
}

function previousStory() {
    if (currentStoryIndex > 0) {
        currentStoryIndex--;
        showStory(currentStoryIndex);
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
}

// Export functions
window.initStories = initStories;
