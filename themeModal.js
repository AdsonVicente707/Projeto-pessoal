// Enhanced Theme Modal Manager - FIXED LAYOUT VERSION
export function createEnhancedThemeModal() {
  const modalHTML = `
    <div id="admin-theme-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; align-items: center; justify-content: center; overflow-y: auto; padding: 20px;">
      <div style="background: var(--bg-surface); padding: 40px; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 28px; color: var(--text-main);">🎨 Criar Tema Sazonal</h2>
          <button type="button" id="admin-cancel-theme-btn" style="background: none; border: none; font-size: 32px; cursor: pointer; color: var(--text-secondary); padding: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s;">×</button>
        </div>
        
        <form id="admin-theme-form">
          <!-- Basic Info Section -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; color: white; font-size: 18px;">📋 Informações Básicas</h3>
            <div style="display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">Nome do Tema *</label>
                <input type="text" id="admin-theme-name" required placeholder="Ex: Natal 2026" style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.95); color: #333; font-size: 14px; box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">Slug (ID único) *</label>
                <input type="text" id="admin-theme-slug" required placeholder="Ex: christmas-2026" style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.95); color: #333; font-size: 14px; box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">Ícone</label>
                <input type="text" id="admin-theme-icon" placeholder="🎄" maxlength="2" style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.95); color: #333; font-size: 24px; text-align: center; box-sizing: border-box;">
              </div>
            </div>
          </div>

          <!-- Date Scheduling Section -->
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; color: white; font-size: 18px;">📅 Agendamento Automático</h3>
            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px;">
                <input type="checkbox" id="admin-theme-auto-activate" style="width: 20px; height: 20px; cursor: pointer;">
                <span style="font-weight: 600; color: white; font-size: 15px;">✅ Ativar automaticamente nas datas programadas</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">📆 Data de Início</label>
                <input type="date" id="admin-theme-start-date" style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.95); color: #333; font-size: 14px; cursor: pointer; box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">📆 Data de Término</label>
                <input type="date" id="admin-theme-end-date" style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.95); color: #333; font-size: 14px; cursor: pointer; box-sizing: border-box;">
              </div>
            </div>
          </div>

          <!-- Colors Section -->
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; color: white; font-size: 18px;">🎨 Paleta de Cores</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">Cor Primária</label>
                <input type="color" id="admin-theme-primary" value="#C41E3A" style="width: 100%; height: 60px; border: 3px solid rgba(255,255,255,0.5); border-radius: 10px; cursor: pointer; background: white; padding: 5px; box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">Cor Secundária</label>
                <input type="color" id="admin-theme-secondary" value="#165B33" style="width: 100%; height: 60px; border: 3px solid rgba(255,255,255,0.5); border-radius: 10px; cursor: pointer; background: white; padding: 5px; box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: white;">Cor de Destaque</label>
                <input type="color" id="admin-theme-accent" value="#F59E0B" style="width: 100%; height: 60px; border: 3px solid rgba(255,255,255,0.5); border-radius: 10px; cursor: pointer; background: white; padding: 5px; box-sizing: border-box;">
              </div>
            </div>
          </div>

          <!-- Background Section -->
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">🖼️ Background Personalizado</h3>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">Tipo de Background</label>
              <select id="admin-theme-bg-type" style="width: 100%; padding: 14px; border: 2px solid #ddd; border-radius: 8px; background: white; color: #333; font-size: 15px; cursor: pointer; box-sizing: border-box;">
                <option value="color">🎨 Cor Sólida</option>
                <option value="gradient">🌈 Gradiente</option>
                <option value="image">🖼️ Imagem (Upload)</option>
              </select>
            </div>
            
            <div id="bg-color-input" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Cor de Fundo</label>
              <input type="color" id="admin-theme-bg-color" value="#F8FAFC" style="width: 100%; height: 60px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; background: white; padding: 5px; box-sizing: border-box;">
            </div>
            
            <div id="bg-gradient-input" style="display: none; margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Gradiente CSS</label>
              <input type="text" id="admin-theme-bg-gradient" placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; background: white; color: #333; font-size: 14px; box-sizing: border-box;">
              <small style="color: #666; display: block; margin-top: 5px;">💡 Dica: Use <a href="https://cssgradient.io/" target="_blank" style="color: #667eea;">cssgradient.io</a> para criar gradientes</small>
            </div>
            
            <div id="bg-image-input" style="display: none; margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">📸 Upload de Imagem de Background</label>
              <div style="border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; background: white;">
                <input type="file" id="admin-theme-bg-image-file" accept="image/*" style="display: none;">
                <button type="button" id="upload-bg-btn" style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 10px;">
                  📁 Escolher Imagem
                </button>
                <div id="file-name-display" style="color: #666; font-size: 14px; margin-top: 10px;">Nenhum arquivo selecionado</div>
                <div id="image-preview" style="margin-top: 15px; max-width: 100%; max-height: 200px; overflow: hidden; border-radius: 8px;"></div>
              </div>
              <small style="color: #666; display: block; margin-top: 5px;">📸 Formatos: JPG, PNG, WebP | Tamanho máx: 5MB</small>
            </div>
            
            <div style="margin-top: 20px;">
              <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">Opacidade: <span id="opacity-value" style="color: #667eea;">100%</span></label>
              <input type="range" id="admin-theme-bg-opacity" min="0" max="100" value="100" style="width: 100%; height: 8px; border-radius: 4px; cursor: pointer;">
            </div>
          </div>

          <!-- Fonts Section -->
          <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">🔤 Fontes Personalizadas</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Fonte Primária</label>
                <select id="admin-theme-font-primary" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; background: white; color: #333; font-size: 14px; cursor: pointer; box-sizing: border-box;">
                  <option value="Nunito">Nunito (Atual)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Inter">Inter</option>
                  <option value="Raleway">Raleway</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Fonte Secundária</label>
                <select id="admin-theme-font-secondary" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; background: white; color: #333; font-size: 14px; cursor: pointer; box-sizing: border-box;">
                  <option value="Nunito">Nunito (Atual)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Inter">Inter</option>
                  <option value="Raleway">Raleway</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Effects Section -->
          <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">✨ Efeitos Visuais</h3>
            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: rgba(255,255,255,0.5); padding: 12px; border-radius: 8px;">
                <input type="checkbox" id="admin-theme-shadows" checked style="width: 20px; height: 20px; cursor: pointer;">
                <span style="font-weight: 600; color: #333; font-size: 15px;">Sombras nos elementos</span>
              </label>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">Blur de Fundo: <span id="blur-value" style="color: #ff9a9e;">0px</span></label>
              <input type="range" id="admin-theme-blur" min="0" max="20" value="0" style="width: 100%; height: 8px; border-radius: 4px; cursor: pointer;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">Brilho: <span id="brightness-value" style="color: #ff9a9e;">100%</span></label>
              <input type="range" id="admin-theme-brightness" min="50" max="150" value="100" style="width: 100%; height: 8px; border-radius: 4px; cursor: pointer;">
            </div>
          </div>

          <!-- Particles Section -->
          <div style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">❄️ Partículas Animadas</h3>
            <select id="admin-theme-particles" style="width: 100%; padding: 14px; border: 2px solid #ddd; border-radius: 8px; background: white; color: #333; font-size: 15px; cursor: pointer; box-sizing: border-box;">
              <option value="none">🚫 Nenhuma</option>
              <option value="snow">❄️ Neve (Natal/Inverno)</option>
              <option value="confetti">🎉 Confete (Celebração)</option>
              <option value="hearts">❤️ Corações (Dia dos Namorados)</option>
              <option value="flowers">🌸 Flores (Primavera)</option>
              <option value="bats">🦇 Morcegos (Halloween)</option>
            </select>
          </div>

          <!-- Action Buttons -->
          <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 15px; margin-top: 30px;">
            <button type="button" id="admin-preview-theme-btn" style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 15px; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              👁️ Preview
            </button>
            <button type="submit" style="padding: 16px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 16px; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);">
              ✅ Criar Tema Completo
            </button>
            <button type="button" id="admin-cancel-theme-btn-footer" style="padding: 16px; background: #6c757d; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 15px; transition: transform 0.2s;">
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
    `;

  // Remove old modal if exists
  const oldModal = document.getElementById('admin-theme-modal');
  if (oldModal) {
    oldModal.remove();
  }

  // Insert new modal
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Setup dynamic form controls
  setupModalControls();
}

function setupModalControls() {
  // Background type switcher
  const bgTypeSelect = document.getElementById('admin-theme-bg-type');
  const bgColorInput = document.getElementById('bg-color-input');
  const bgGradientInput = document.getElementById('bg-gradient-input');
  const bgImageInput = document.getElementById('bg-image-input');

  if (bgTypeSelect) {
    bgTypeSelect.addEventListener('change', (e) => {
      bgColorInput.style.display = 'none';
      bgGradientInput.style.display = 'none';
      bgImageInput.style.display = 'none';

      if (e.target.value === 'color') {
        bgColorInput.style.display = 'block';
      } else if (e.target.value === 'gradient') {
        bgGradientInput.style.display = 'block';
      } else if (e.target.value === 'image') {
        bgImageInput.style.display = 'block';
      }
    });
  }

  // Image upload button
  const uploadBtn = document.getElementById('upload-bg-btn');
  const fileInput = document.getElementById('admin-theme-bg-image-file');
  const fileNameDisplay = document.getElementById('file-name-display');
  const imagePreview = document.getElementById('image-preview');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileNameDisplay.textContent = `✅ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        fileNameDisplay.style.color = '#11998e';
        fileNameDisplay.style.fontWeight = '600';

        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Opacity slider
  const opacitySlider = document.getElementById('admin-theme-bg-opacity');
  const opacityValue = document.getElementById('opacity-value');
  if (opacitySlider && opacityValue) {
    opacitySlider.addEventListener('input', (e) => {
      opacityValue.textContent = `${e.target.value}%`;
    });
  }

  // Blur slider
  const blurSlider = document.getElementById('admin-theme-blur');
  const blurValue = document.getElementById('blur-value');
  if (blurSlider && blurValue) {
    blurSlider.addEventListener('input', (e) => {
      blurValue.textContent = `${e.target.value}px`;
    });
  }

  // Brightness slider
  const brightnessSlider = document.getElementById('admin-theme-brightness');
  const brightnessValue = document.getElementById('brightness-value');
  if (brightnessSlider && brightnessValue) {
    brightnessSlider.addEventListener('input', (e) => {
      brightnessValue.textContent = `${e.target.value}%`;
    });
  }
}

export async function getThemeFormData() {
  const bgType = document.getElementById('admin-theme-bg-type').value;
  let bgValue = '';

  if (bgType === 'color') {
    bgValue = document.getElementById('admin-theme-bg-color').value;
  } else if (bgType === 'gradient') {
    bgValue = document.getElementById('admin-theme-bg-gradient').value;
  } else if (bgType === 'image') {
    const fileInput = document.getElementById('admin-theme-bg-image-file');
    if (fileInput.files && fileInput.files[0]) {
      // Convert image to base64
      bgValue = await fileToBase64(fileInput.files[0]);
    }
  }

  return {
    name: document.getElementById('admin-theme-name').value,
    slug: document.getElementById('admin-theme-slug').value,
    icon: document.getElementById('admin-theme-icon').value || '🎨',

    // Date scheduling
    autoActivate: document.getElementById('admin-theme-auto-activate').checked,
    startDate: document.getElementById('admin-theme-start-date').value || null,
    endDate: document.getElementById('admin-theme-end-date').value || null,

    // Colors
    colors: {
      primary: document.getElementById('admin-theme-primary').value,
      secondary: document.getElementById('admin-theme-secondary').value,
      accent: document.getElementById('admin-theme-accent').value
    },

    // Background
    background: {
      type: bgType,
      value: bgValue,
      opacity: parseInt(document.getElementById('admin-theme-bg-opacity').value) / 100
    },

    // Fonts
    fonts: {
      primary: document.getElementById('admin-theme-font-primary').value,
      secondary: document.getElementById('admin-theme-font-secondary').value
    },

    // Effects
    effects: {
      shadows: document.getElementById('admin-theme-shadows').checked,
      blur: parseInt(document.getElementById('admin-theme-blur').value),
      brightness: parseInt(document.getElementById('admin-theme-brightness').value)
    },

    // Decorations
    decorations: {
      particles: document.getElementById('admin-theme-particles').value !== 'none',
      particleType: document.getElementById('admin-theme-particles').value
    }
  };
}

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
