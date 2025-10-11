// Options/Settings Script - AI Learning Accelerator

console.log('Settings page loaded');

let currentProvider = 'google';
let savedGeminiModel = '';
let savedOpenRouterTextModel = '';
let savedOpenRouterImageModel = '';
let cachedOpenRouterModels = { text: [], image: [] };

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStats();
  attachEventListeners();
  await autoFetchModels();
});

// Load saved settings
async function loadSettings() {
  try {
    resetConnectionStatuses();
    const data = await chrome.storage.sync.get([
      'provider',
      'apiKey',
      'imagenApiKey',
      'geminiModel',
      'openRouterKey',
      'openRouterTextModel',
      'openRouterImageModel',
      'complexity',
      'vizDensity',
      'language'
    ]);

    currentProvider = data.provider || 'google';
    document.querySelectorAll('input[name="provider"]').forEach(input => {
      input.checked = input.value === currentProvider;
    });
    applyProviderVisibility(currentProvider);

    // Load Google fields
    if (data.apiKey) {
      document.getElementById('gemini-api-key').value = data.apiKey;
    }

    if (data.imagenApiKey) {
      document.getElementById('imagen-api-key').value = data.imagenApiKey;
    }

    savedGeminiModel = data.geminiModel || '';

    // Load OpenRouter fields
    if (data.openRouterKey) {
      document.getElementById('openrouter-api-key').value = data.openRouterKey;
    }
    if (data.openRouterTextModel) {
      document.getElementById('openrouter-text-model').value = data.openRouterTextModel;
    }
    if (data.openRouterImageModel) {
      document.getElementById('openrouter-image-model').value = data.openRouterImageModel;
    }

    savedOpenRouterTextModel = data.openRouterTextModel || '';
    savedOpenRouterImageModel = data.openRouterImageModel || '';

    // Ensure selects reflect saved values even before fetching model lists
    populateOpenRouterSelect(
      document.getElementById('openrouter-text-model'),
      cachedOpenRouterModels.text,
      savedOpenRouterTextModel,
      'Select a text model'
    );
    populateOpenRouterSelect(
      document.getElementById('openrouter-image-model'),
      cachedOpenRouterModels.image,
      savedOpenRouterImageModel,
      'Select an image model (optional)'
    );

    // Load preferences
    if (data.complexity) {
      document.querySelector(`input[name="complexity"][value="${data.complexity}"]`).checked = true;
    }

    if (data.vizDensity) {
      document.getElementById('viz-density').value = data.vizDensity;
    }

    if (data.language) {
      document.getElementById('language-select').value = data.language;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Load statistics
async function loadStats() {
  try {
    const data = await chrome.storage.local.get([
      'materialsProcessed',
      'conceptsLearned',
      'library'
    ]);

    document.getElementById('stat-materials').textContent = data.materialsProcessed || 0;
    document.getElementById('stat-concepts').textContent = data.conceptsLearned || 0;
    document.getElementById('stat-library').textContent = data.library ? data.library.length : 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Attach event listeners
function attachEventListeners() {
  // Toggle visibility buttons
  document.getElementById('toggle-gemini').addEventListener('click', () => {
    togglePasswordVisibility('gemini-api-key');
  });

  document.getElementById('toggle-imagen').addEventListener('click', () => {
    togglePasswordVisibility('imagen-api-key');
  });

  document.getElementById('toggle-openrouter').addEventListener('click', () => {
    togglePasswordVisibility('openrouter-api-key');
  });

  document.querySelectorAll('input[name="provider"]').forEach(input => {
    input.addEventListener('change', async (event) => {
      currentProvider = event.target.value;
      applyProviderVisibility(currentProvider);
      resetConnectionStatuses();
      await autoFetchModels();
    });
  });

  // Model selector change
  document.getElementById('gemini-model').addEventListener('change', (e) => {
    savedGeminiModel = e.target.value;
    updateModelDescription(e.target.value);
  });

  document.getElementById('openrouter-text-model').addEventListener('change', (e) => {
    savedOpenRouterTextModel = e.target.value;
  });

  document.getElementById('openrouter-image-model').addEventListener('change', (e) => {
    savedOpenRouterImageModel = e.target.value;
  });

  // Refresh models button
  document.getElementById('btn-refresh-models').addEventListener('click', async () => {
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    if (!apiKey) {
      showStatus('⚠️ Please enter your API key first', 'error');
      return;
    }
    await fetchGoogleModels(apiKey, true);
  });

  document.getElementById('btn-refresh-openrouter-text').addEventListener('click', async () => {
    const apiKey = document.getElementById('openrouter-api-key').value.trim();
    if (!apiKey) {
      setOpenRouterStatus('Please enter your OpenRouter key first', 'error');
      return;
    }
    await fetchOpenRouterModelLists(apiKey, { refresh: true });
  });

  document.getElementById('btn-refresh-openrouter-image').addEventListener('click', async () => {
    const apiKey = document.getElementById('openrouter-api-key').value.trim();
    if (!apiKey) {
      setOpenRouterStatus('Please enter your OpenRouter key first', 'error');
      return;
    }
    await fetchOpenRouterModelLists(apiKey, { refresh: true });
  });

  // Test connection button
  document.getElementById('btn-test-connection').addEventListener('click', testConnection);
  document.getElementById('btn-test-openrouter').addEventListener('click', testOpenRouterConnection);

  // Save button
  document.getElementById('btn-save').addEventListener('click', saveSettings);

  // Export data
  document.getElementById('btn-export-data').addEventListener('click', exportData);

  // Clear library
  document.getElementById('btn-clear-library').addEventListener('click', clearLibrary);
}

// Fetch available models from Google AI
async function fetchGoogleModels(apiKey, showToast = false) {
  const refreshBtn = document.getElementById('btn-refresh-models');
  const modelSelect = document.getElementById('gemini-model');
  const descElement = document.getElementById('model-description');

  try {
    refreshBtn.disabled = true;
    modelSelect.disabled = true;
    descElement.textContent = 'Fetching available models from Google AI...';

    console.log('Fetching models from Google AI API...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Models fetched:', data);

    // Filter for generativeContent-capable models
    const generativeModels = data.models.filter(model =>
      model.supportedGenerationMethods &&
      model.supportedGenerationMethods.includes('generateContent')
    );

    console.log('Generative models:', generativeModels);

    // Clear and populate dropdown
    modelSelect.innerHTML = '';

    if (generativeModels.length === 0) {
      modelSelect.innerHTML = '<option value="">No models available</option>';
      descElement.textContent = 'No generative models found. Please check your API key.';
      return;
    }

    // Sort models: stable first, then experimental
    generativeModels.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Prioritize stable models
      const aStable = !aName.includes('exp') && !aName.includes('experimental');
      const bStable = !bName.includes('exp') && !bName.includes('experimental');

      if (aStable && !bStable) return -1;
      if (!aStable && bStable) return 1;

      return aName.localeCompare(bName);
    });

    // Add models to dropdown
    generativeModels.forEach(model => {
      const modelName = model.name.replace('models/', '');
      const option = document.createElement('option');
      option.value = modelName;

      // Create friendly display name
      let displayName = modelName;
      if (modelName.includes('gemini-1.5-flash-8b')) {
        displayName = '⚡ Gemini 1.5 Flash-8B (Fastest)';
      } else if (modelName.includes('gemini-1.5-flash') && !modelName.includes('8b')) {
        displayName = '⚡ Gemini 1.5 Flash (Recommended)';
      } else if (modelName.includes('gemini-1.5-pro')) {
        displayName = '🧠 Gemini 1.5 Pro (Most Capable)';
      } else if (modelName.includes('gemini-2.0')) {
        displayName = '🚀 Gemini 2.0 (Latest)';
      } else if (modelName.includes('exp') || modelName.includes('experimental')) {
        displayName = '⚗️ ' + modelName + ' (Experimental)';
      }

      option.textContent = displayName;

      // Select saved model or default to first stable model
      if (savedGeminiModel && modelName === savedGeminiModel) {
        option.selected = true;
      } else if (!savedGeminiModel && modelName.includes('gemini-1.5-flash') && !modelName.includes('8b') && !modelName.includes('exp')) {
        option.selected = true;
      }

      modelSelect.appendChild(option);
    });

    // Update description for selected model
    updateModelDescription(modelSelect.value);

    descElement.textContent = `✓ Loaded ${generativeModels.length} available models from Google AI`;

    // Clear success message after 3 seconds
    setTimeout(() => {
      updateModelDescription(modelSelect.value);
    }, 3000);

  } catch (error) {
    console.error('Error fetching models:', error);
    modelSelect.innerHTML = '<option value="gemini-1.5-flash">⚡ Gemini 1.5 Flash (Fallback)</option>';
    descElement.textContent = `❌ Failed to fetch models: ${error.message}. Using fallback.`;
  } finally {
    refreshBtn.disabled = false;
    modelSelect.disabled = false;
    if (showToast) {
      showStatus('Model list updated.', 'success');
    }
  }
}

function applyProviderVisibility(provider) {
  document.querySelectorAll('[data-provider-section]').forEach(section => {
    const target = section.getAttribute('data-provider-section');
    if (target === provider) {
      section.classList.add('provider-visible');
    } else {
      section.classList.remove('provider-visible');
    }
  });

  document.querySelectorAll('.provider-option').forEach(option => {
    const input = option.querySelector('input[name="provider"]');
    option.classList.toggle('provider-selected', input && input.value === provider);
  });
}

function resetConnectionStatuses() {
  const geminiStatus = document.getElementById('connection-status');
  const openRouterStatus = document.getElementById('openrouter-connection-status');
  if (geminiStatus) {
    geminiStatus.textContent = '';
    geminiStatus.className = 'connection-status';
  }
  if (openRouterStatus) {
    openRouterStatus.textContent = '';
    openRouterStatus.className = 'connection-status';
  }
}

function setOpenRouterStatus(message, type = 'info') {
  const statusElement = document.getElementById('openrouter-connection-status');
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.className = `connection-status ${type}`.trim();
}

async function autoFetchModels() {
  try {
    if (currentProvider === 'google') {
      const apiKey = document.getElementById('gemini-api-key').value.trim();
      if (apiKey) {
        await fetchGoogleModels(apiKey, false);
      }
    } else if (currentProvider === 'openrouter') {
      const apiKey = document.getElementById('openrouter-api-key').value.trim();
      if (apiKey) {
        await fetchOpenRouterModelLists(apiKey, { refresh: false });
      }
    }
  } catch (error) {
    console.warn('Auto model fetch failed', error);
  }
}

async function fetchOpenRouterModelLists(apiKey, { refresh = false } = {}) {
  const textSelect = document.getElementById('openrouter-text-model');
  const imageSelect = document.getElementById('openrouter-image-model');

  if (!refresh && cachedOpenRouterModels.text.length) {
    populateOpenRouterSelect(textSelect, cachedOpenRouterModels.text, savedOpenRouterTextModel, 'Select a text model');
    populateOpenRouterSelect(imageSelect, cachedOpenRouterModels.image, savedOpenRouterImageModel, 'Select an image model (optional)');
    const textDesc = document.getElementById('openrouter-text-description');
    if (textDesc) {
      textDesc.textContent = `Loaded ${cachedOpenRouterModels.text.length} text-capable models from OpenRouter.`;
    }
    const imageDesc = document.getElementById('openrouter-image-description');
    if (imageDesc) {
      imageDesc.textContent = cachedOpenRouterModels.image.length
        ? `Loaded ${cachedOpenRouterModels.image.length} image-capable models from OpenRouter.`
        : imageDesc.textContent;
    }
    return;
  }

  setOpenRouterStatus('Fetching OpenRouter models...', 'testing');
  textSelect.disabled = true;
  imageSelect.disabled = true;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Learn with DeepMind Extension'
      }
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const normalized = normalizeOpenRouterModelCatalog(payload);
    cachedOpenRouterModels = normalized;

    populateOpenRouterSelect(textSelect, normalized.text, savedOpenRouterTextModel, 'Select a text model');
    populateOpenRouterSelect(imageSelect, normalized.image, savedOpenRouterImageModel, 'Select an image model (optional)');

    const textDesc = document.getElementById('openrouter-text-description');
    if (textDesc) {
      textDesc.textContent = normalized.text.length
        ? `Loaded ${normalized.text.length} text-capable models from OpenRouter.`
        : 'No text models returned. Enter a model ID manually if needed.';
    }

    const imageDesc = document.getElementById('openrouter-image-description');
    if (imageDesc) {
      imageDesc.textContent = normalized.image.length
        ? `Loaded ${normalized.image.length} image-capable models from OpenRouter.`
        : 'No image models detected. Enter a diffusion model ID manually if needed.';
    }

    setOpenRouterStatus(`✓ Loaded ${normalized.text.length} text models`, 'success');
  } catch (error) {
    console.error('OpenRouter model fetch failed:', error);
    setOpenRouterStatus(`Failed to fetch models: ${error.message}`, 'error');
    const textDesc = document.getElementById('openrouter-text-description');
    const imageDesc = document.getElementById('openrouter-image-description');
    if (textDesc) {
      textDesc.textContent = 'Could not load models automatically. Enter a text model ID manually.';
    }
    if (imageDesc) {
      imageDesc.textContent = 'Could not load image models automatically. Enter an image model ID manually.';
    }
  } finally {
    textSelect.disabled = false;
    imageSelect.disabled = false;
  }
}

function populateOpenRouterSelect(select, models, savedValue, placeholder) {
  if (!select) return;
  const currentSelection = savedValue || select.value || '';
  select.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = placeholder;
  select.appendChild(defaultOption);

  models.forEach(modelId => {
    const option = document.createElement('option');
    option.value = modelId;
    option.textContent = modelId;
    if (modelId === currentSelection) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  if (currentSelection && !models.includes(currentSelection)) {
    const savedOption = document.createElement('option');
    savedOption.value = currentSelection;
    savedOption.textContent = `${currentSelection} (saved)`;
    savedOption.selected = true;
    select.appendChild(savedOption);
  }
}

function normalizeOpenRouterModelCatalog(payload) {
  const items = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload?.models) ? payload.models : []);
  const textModels = new Set();
  const imageModels = new Set();

  items.forEach(model => {
    const id = model?.id || model?.slug || model?.name;
    if (!id) return;
    const idLower = id.toLowerCase();
    const tags = Array.isArray(model?.tags) ? model.tags.map(tag => (tag || '').toString().toLowerCase()) : [];
    const capabilities = model?.capabilities || {};
    const architecture = model?.architecture || {};
    const modality = Array.isArray(architecture?.modality)
      ? architecture.modality.join(',').toLowerCase()
      : (architecture?.modality || '').toString().toLowerCase();
    const archType = (architecture?.type || '').toString().toLowerCase();

    const supportsImage = Boolean(
      capabilities.image ||
      capabilities.vision ||
      tags.includes('image') ||
      tags.includes('vision') ||
      modality.includes('image') ||
      archType.includes('image') ||
      idLower.includes('image') ||
      idLower.includes('diffusion') ||
      idLower.includes('sd')
    );

    const supportsText = Boolean(
      capabilities.completion ||
      capabilities.text ||
      capabilities.chat ||
      tags.includes('text') ||
      tags.includes('chat') ||
      tags.includes('llm') ||
      !supportsImage
    );

    if (supportsText) {
      textModels.add(id);
    }
    if (supportsImage) {
      imageModels.add(id);
    }
  });

  if (!imageModels.size) {
    textModels.forEach(id => {
      const lower = id.toLowerCase();
      if (lower.includes('image') || lower.includes('diffusion') || lower.includes('sd')) {
        imageModels.add(id);
      }
    });
  }

  return {
    text: Array.from(textModels).sort(),
    image: Array.from(imageModels).sort()
  };
}

// Update model description
function updateModelDescription(modelName) {
  const descElement = document.getElementById('model-description');

  if (!modelName) {
    descElement.textContent = 'Select a model to see its description.';
    return;
  }

  // Generate description based on model name
  let description = '';

  if (modelName.includes('gemini-1.5-flash-8b')) {
    description = '🚀 Fastest and most cost-efficient. Great for quick summaries and simple tasks. Ultra-fast responses.';
  } else if (modelName.includes('gemini-1.5-flash') && !modelName.includes('8b')) {
    description = '⚡ Fast and efficient for most learning tasks. Best balance of speed and quality. Recommended for daily use.';
  } else if (modelName.includes('gemini-1.5-pro')) {
    description = '🧠 Most capable model with superior reasoning. Best for complex topics and detailed analysis. Highest quality.';
  } else if (modelName.includes('gemini-2.0')) {
    description = '🚀 Latest Gemini model with enhanced capabilities. Cutting-edge features and improved performance.';
  } else if (modelName.includes('exp') || modelName.includes('experimental')) {
    description = '⚗️ Experimental model with newest features. May have unexpected behavior. For testing and early access.';
  } else {
    description = `Model: ${modelName}. Available for content generation.`;
  }

  descElement.textContent = description;
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Save settings
async function saveSettings() {
  console.log('Save button clicked!');

  try {
    // Show immediate feedback
    showStatus('Saving settings...', 'success');

    const provider = document.querySelector('input[name="provider"]:checked')?.value || 'google';
    const geminiApiKey = document.getElementById('gemini-api-key').value.trim();
    const imagenApiKey = document.getElementById('imagen-api-key').value.trim();
    const openRouterKey = document.getElementById('openrouter-api-key').value.trim();
    const geminiModel = document.getElementById('gemini-model').value;
    const openRouterTextModel = document.getElementById('openrouter-text-model').value.trim();
    const openRouterImageModel = document.getElementById('openrouter-image-model').value.trim();

    console.log('Saving provider settings...', { provider, geminiModel, openRouterTextModel, openRouterImageModel });

    if (provider === 'google' && !geminiApiKey) {
      showStatus('⚠️ Please enter your Gemini API key', 'error');
      return;
    }

    if (provider === 'openrouter' && !openRouterKey) {
      showStatus('⚠️ Please enter your OpenRouter API key', 'error');
      return;
    }

    const previousKeys = await chrome.storage.sync.get(['apiKey', 'openRouterKey']);

    const complexity = document.querySelector('input[name="complexity"]:checked').value;
    const vizDensity = document.getElementById('viz-density').value;
    const language = document.getElementById('language-select').value;

    const payload = {
      provider,
      apiKey: geminiApiKey,
      imagenApiKey,
      geminiModel,
      openRouterKey,
      openRouterTextModel,
      openRouterImageModel,
      complexity,
      vizDensity,
      language
    };

    await chrome.storage.sync.set({
      ...payload
    });

    console.log('Settings saved successfully!');
    showStatus('✅ Settings saved successfully!', 'success');

    savedGeminiModel = geminiModel;
    savedOpenRouterTextModel = openRouterTextModel;
    savedOpenRouterImageModel = openRouterImageModel;

    if (provider === 'google' && geminiApiKey !== previousKeys.apiKey) {
      console.log('Gemini key changed, refreshing models');
      await fetchGoogleModels(geminiApiKey, true);
    }

    if (provider === 'openrouter' && openRouterKey !== previousKeys.openRouterKey) {
      console.log('OpenRouter key changed, refreshing catalogs');
      await fetchOpenRouterModelLists(openRouterKey, { refresh: true });
    }

    setTimeout(() => {
      if (provider === 'google') {
        testApiKey(geminiApiKey);
      } else {
        testOpenRouterConnection();
      }
    }, 800);
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('❌ Error saving settings: ' + error.message, 'error');
  }
}

// Test Connection (standalone button)
async function testConnection() {
  console.log('Testing connection...');

  if (currentProvider !== 'google') {
    showStatus('Switch provider to Google AI to test this connection.', 'info');
    return;
  }

  const apiKey = document.getElementById('gemini-api-key').value.trim();
  const selectedModel = document.getElementById('gemini-model').value;
  const statusElement = document.getElementById('connection-status');
  const testButton = document.getElementById('btn-test-connection');

  if (!apiKey) {
    statusElement.textContent = 'Please enter your API key first';
    statusElement.className = 'connection-status error';
    return;
  }

  // Disable button and show testing state
  testButton.disabled = true;
  statusElement.textContent = `Testing connection with ${selectedModel}...`;
  statusElement.className = 'connection-status testing';

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello'
          }]
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Connection successful!', data);
      statusElement.textContent = `✓ Connection Successful! ${selectedModel} is working perfectly.`;
      statusElement.className = 'connection-status success';
    } else {
      const errorData = await response.text();
      console.error('Connection failed:', response.status, errorData);

      let errorMessage = 'Connection Failed: ';
      if (response.status === 400) {
        errorMessage += 'Invalid API key format';
      } else if (response.status === 403) {
        errorMessage += 'API key is invalid or doesn\'t have permission';
      } else if (response.status === 429) {
        errorMessage += 'Too many requests. Wait a moment and try again.';
      } else {
        errorMessage += `Error ${response.status}`;
      }

      statusElement.textContent = errorMessage;
      statusElement.className = 'connection-status error';
    }
  } catch (error) {
    console.error('Connection test error:', error);
    statusElement.textContent = 'Connection Failed: Network error. Check your internet connection.';
    statusElement.className = 'connection-status error';
  } finally {
    testButton.disabled = false;
  }
}

async function testOpenRouterConnection() {
  console.log('Testing OpenRouter connection...');

  if (currentProvider !== 'openrouter') {
    setOpenRouterStatus('Switch provider to OpenRouter to test this connection.', 'info');
    return;
  }

  const apiKey = document.getElementById('openrouter-api-key').value.trim();
  let model = document.getElementById('openrouter-text-model').value.trim();
  const testButton = document.getElementById('btn-test-openrouter');

  if (!apiKey) {
    setOpenRouterStatus('Please enter your OpenRouter API key first.', 'error');
    return;
  }

  if (!model) {
    model = 'anthropic/claude-3.5-sonnet';
  }

  testButton.disabled = true;
  setOpenRouterStatus(`Testing connection with ${model}...`, 'testing');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'Learn with DeepMind Extension'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a diagnostic assistant for the Learn with DeepMind Chrome extension.' },
          { role: 'user', content: 'Respond with READY to confirm connectivity.' }
        ],
        max_tokens: 10,
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
    }

    const payload = await response.json();
    const message = payload?.choices?.[0]?.message?.content;
    const normalized = Array.isArray(message) ? message.map(part => part.text || part).join(' ').trim() : (message || '').trim();

    if (!normalized.toUpperCase().includes('READY')) {
      setOpenRouterStatus('Connected, but unexpected reply from model.', 'warning');
      return;
    }

    setOpenRouterStatus(`✓ Connection Successful! ${model} is ready.`, 'success');
  } catch (error) {
    console.error('OpenRouter test failed:', error);
    setOpenRouterStatus(`Connection Failed: ${error.message}`, 'error');
  } finally {
    testButton.disabled = false;
  }
}

// Test API key (called after save)
async function testApiKey(apiKey) {
  if (currentProvider !== 'google') {
    return;
  }
  try {
    // Get selected model
    const selectedModel = document.getElementById('gemini-model').value || 'gemini-1.5-flash';

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Test'
          }]
        }]
      })
    });

    if (response.ok) {
      showStatus('✅ Settings saved & API key verified!', 'success');
    } else {
      showStatus('⚠️ Settings saved, but API key may be invalid. Use Test Connection button.', 'error');
    }
  } catch (error) {
    console.error('API key test error:', error);
  }
}

// Show status message
function showStatus(message, type) {
  console.log('Status:', message, type);
  const statusElement = document.getElementById('save-status');

  if (!statusElement) {
    console.error('Status element not found!');
    alert(message); // Fallback
    return;
  }

  statusElement.textContent = message;
  statusElement.className = `save-status ${type}`;
  statusElement.style.display = 'block';

  // Clear after 5 seconds
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.className = 'save-status';
  }, 5000);
}

// Export data
async function exportData() {
  try {
    const data = await chrome.storage.local.get([
      'library',
      'materialsProcessed',
      'conceptsLearned'
    ]);

    const exportData = {
      library: data.library || [],
      stats: {
        materialsProcessed: data.materialsProcessed || 0,
        conceptsLearned: data.conceptsLearned || 0
      },
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-learning-accelerator-export-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    showStatus('Library exported successfully! ✓', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Error exporting data', 'error');
  }
}

// Clear library
async function clearLibrary() {
  const confirmed = confirm(
    'Are you sure you want to clear your entire learning library?\n\n' +
    'This will delete all processed materials, summaries, and saved content.\n\n' +
    'This action cannot be undone!'
  );

  if (!confirmed) return;

  try {
    // Reset library and stats
    await chrome.storage.local.set({
      library: [],
      materialsProcessed: 0,
      conceptsLearned: 0,
      currentContent: null,
      currentMetadata: null
    });

    // Reload stats
    await loadStats();

    showStatus('Library cleared successfully', 'success');
  } catch (error) {
    console.error('Clear library error:', error);
    showStatus('Error clearing library', 'error');
  }
}
