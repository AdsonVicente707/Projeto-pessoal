// Componentes Reutilizáveis para a Rede Social Familiar

// Toast Notification System
class ToastNotification {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast.innerHTML = `
      <div style="
        background: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
        border-left: 4px solid ${colors[type]};
      ">
        <span style="
          font-size: 20px;
          color: ${colors[type]};
          font-weight: bold;
        ">${icons[type]}</span>
        <span style="color: #2d3748; font-size: 14px;">${message}</span>
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Skeleton Loader Component
function createSkeletonLoader(type = 'post') {
  const skeleton = document.createElement('div');
  skeleton.className = 'skeleton-loader';
  
  if (type === 'post') {
    skeleton.innerHTML = `
      <div class="skeleton-post">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-text-group">
            <div class="skeleton-text" style="width: 150px;"></div>
            <div class="skeleton-text" style="width: 100px;"></div>
          </div>
        </div>
        <div class="skeleton-image"></div>
        <div class="skeleton-text" style="width: 100%; margin: 10px 0;"></div>
        <div class="skeleton-text" style="width: 80%;"></div>
      </div>
    `;
  }
  
  return skeleton;
}

// Image Carousel Component
class ImageCarousel {
  constructor(images, startIndex = 0) {
    this.images = images;
    this.currentIndex = startIndex;
    this.modal = this.createModal();
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'carousel-modal';
    modal.innerHTML = `
      <div class="carousel-overlay"></div>
      <div class="carousel-content">
        <button class="carousel-close">&times;</button>
        <button class="carousel-prev">‹</button>
        <img class="carousel-image" src="${this.images[this.currentIndex]}" alt="Image">
        <button class="carousel-next">›</button>
        <div class="carousel-counter">${this.currentIndex + 1} / ${this.images.length}</div>
      </div>
    `;

    modal.querySelector('.carousel-close').onclick = () => this.close();
    modal.querySelector('.carousel-prev').onclick = () => this.prev();
    modal.querySelector('.carousel-next').onclick = () => this.next();
    modal.querySelector('.carousel-overlay').onclick = () => this.close();

    return modal;
  }

  show() {
    document.body.appendChild(this.modal);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.remove();
    document.body.style.overflow = '';
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }

  updateImage() {
    const img = this.modal.querySelector('.carousel-image');
    const counter = this.modal.querySelector('.carousel-counter');
    img.src = this.images[this.currentIndex];
    counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }
}

// Loading Spinner
function showLoadingSpinner(target) {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = `
    <div class="spinner-circle"></div>
  `;
  target.appendChild(spinner);
  return spinner;
}

// Export components
window.Toast = new ToastNotification();
window.createSkeletonLoader = createSkeletonLoader;
window.ImageCarousel = ImageCarousel;
window.showLoadingSpinner = showLoadingSpinner;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .skeleton-loader {
    padding: 20px;
    background: var(--bg-surface);
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .skeleton-header {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
  }

  .skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  .skeleton-text-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-text {
    height: 12px;
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  .skeleton-image {
    width: 100%;
    height: 300px;
    border-radius: 8px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
    margin-bottom: 10px;
  }

  .carousel-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .carousel-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
  }

  .carousel-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .carousel-image {
    max-width: 100%;
    max-height: 80vh;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }

  .carousel-close, .carousel-prev, .carousel-next {
    position: absolute;
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    font-size: 40px;
    cursor: pointer;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    backdrop-filter: blur(10px);
  }

  .carousel-close:hover, .carousel-prev:hover, .carousel-next:hover {
    background: rgba(255,255,255,0.2);
  }

  .carousel-close {
    top: 20px;
    right: 20px;
  }

  .carousel-prev {
    left: -70px;
  }

  .carousel-next {
    right: -70px;
  }

  .carousel-counter {
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 14px;
    background: rgba(0,0,0,0.5);
    padding: 8px 16px;
    border-radius: 20px;
  }

  .loading-spinner {
    display: flex;
    justify-content: center;
    padding: 40px;
  }

  .spinner-circle {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);
