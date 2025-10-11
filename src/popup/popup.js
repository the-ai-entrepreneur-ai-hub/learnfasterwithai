// Popup Script - AI Learning Accelerator

console.log('Popup loaded');

// Load stats on popup open
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  attachEventListeners();
});

// Load statistics from storage
async function loadStats() {
  try {
    const data = await chrome.storage.local.get(['materialsProcessed', 'conceptsLearned']);

    const materialsCount = data.materialsProcessed || 0;
    const conceptsCount = data.conceptsLearned || 0;

    document.getElementById('materials-count').textContent = materialsCount;
    document.getElementById('concepts-count').textContent = conceptsCount;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Attach event listeners to action cards
function attachEventListeners() {
  // Analyze current page
  document.getElementById('analyze-page').addEventListener('click', async () => {
    console.log('Analyze page clicked');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await gatherContentForTab(tab);

    if (result.error) {
      showNotification(result.message, 'error');
      return;
    }

    const payload = result.response;
    const metadata = sanitizeMetadata(payload.metadata, tab);

    try {
      await chrome.runtime.sendMessage({
        type: 'EXTRACT_CONTENT',
        data: {
          content: payload.text,
          metadata,
          contentType: metadata.type || 'webpage',
          url: metadata.url
        }
      });
    } catch (error) {
      console.error('Extraction dispatch failed:', error);
      showNotification('Unable to process this page right now.', 'error');
      return;
    }

    chrome.sidePanel.open({ windowId: tab.windowId });
    window.close();
  });

  // Upload document
  document.getElementById('upload-doc').addEventListener('click', async () => {
    console.log('Upload document clicked');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.doc,.docx';

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      await handleFileUpload(file, tab.windowId);
    });

    input.click();
  });

  // Open library
  document.getElementById('open-library').addEventListener('click', async () => {
    console.log('Library clicked');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Set library mode and open side panel
    await chrome.storage.local.set({ viewMode: 'library' });
    chrome.sidePanel.open({ windowId: tab.windowId });
    window.close();
  });

  // Open settings
  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
}

async function gatherContentForTab(tab) {
  const messageAttempt = await trySendMessage(tab.id);

  if (messageAttempt.ok) {
    return { response: messageAttempt.payload };
  }

  if (messageAttempt.reason === 'RESTRICTED') {
    return {
      error: 'restricted',
      message: 'This type of page blocks inline analysis. Try a different site.'
    };
  }

  if (messageAttempt.reason === 'INJECT_AND_RETRY') {
    const injected = await ensureContentScript(tab.id);
    if (injected) {
      const retry = await trySendMessage(tab.id);
      if (retry.ok) {
        return { response: retry.payload };
      }
    }
  }

  const inline = await extractContentInline(tab.id);
  if (inline) {
    return { response: inline };
  }

  return {
    error: 'no_content',
    message: messageAttempt.message || 'Could not extract content from this page.'
  };
}

function sanitizeMetadata(rawMetadata, tab) {
  const metadata = rawMetadata && typeof rawMetadata === 'object' ? rawMetadata : {};
  const fallbackUrl = metadata.url || tab?.url || '';
  return {
    title: metadata.title || tab?.title || 'Untitled Page',
    url: fallbackUrl,
    type: metadata.type || 'webpage',
    description: metadata.description || '',
    timestamp: metadata.timestamp || new Date().toISOString()
  };
}

async function trySendMessage(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'GET_CONTENT' }, (response) => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        const message = lastError.message || '';
        console.warn('Content script message error:', message);

        if (message.includes('Cannot access contents of url') || message.includes('The extensions gallery cannot be scripted')) {
          resolve({ ok: false, reason: 'RESTRICTED' });
          return;
        }

        if (message.includes('Receiving end does not exist')) {
          resolve({
            ok: false,
            reason: 'INJECT_AND_RETRY',
            message: 'Learning assistant not yet active on this page.'
          });
          return;
        }

        resolve({ ok: false, message });
        return;
      }

      resolve({ ok: true, payload: response });
    });
  });
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/content-script.js']
    });
    return true;
  } catch (error) {
    console.error('Content script injection failed:', error);
    return false;
  }
}

async function extractContentInline(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript'];
          const clone = document.cloneNode(true);

          unwantedSelectors.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
          });

          const mainContent =
            clone.querySelector('main') ||
            clone.querySelector('article') ||
            clone.querySelector('[role="main"]') ||
            clone.querySelector('.content') ||
            clone.querySelector('#content') ||
            clone.body;

          if (!mainContent) {
            return null;
          }

          const text = extractStructuredText(mainContent);
          const metadata = {
            title: document.title,
            url: window.location.href,
            description: document.querySelector('meta[name="description"]')?.content || '',
            wordCount: text.split(/\s+/).length,
            timestamp: new Date().toISOString()
          };

          return { text, metadata };
        } catch (error) {
          console.error('Inline extraction failed', error);
          return null;
        }

        function extractStructuredText(root) {
          let text = '';
          const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const paragraphs = root.querySelectorAll('p');
          const lists = root.querySelectorAll('ul, ol');

          headings.forEach(heading => {
            const level = heading.tagName[1];
            text += `\n${'#'.repeat(level)} ${heading.textContent.trim()}\n`;
          });

          paragraphs.forEach(p => {
            const pText = p.textContent.trim();
            if (pText.length > 20) {
              text += `\n${pText}\n`;
            }
          });

          lists.forEach(list => {
            list.querySelectorAll('li').forEach(item => {
              text += `\n- ${item.textContent.trim()}`;
            });
            text += '\n';
          });

          if (text.trim().length < 100) {
            text = root.textContent.trim();
          }

          return text.replace(/\n{3,}/g, '\n\n').trim();
        }
      }
    });

    return result?.result || null;
  } catch (error) {
    console.error('Inline extraction via scripting API failed:', error);
    return null;
  }
}

// Handle file upload
async function handleFileUpload(file, windowId) {
  try {
    showNotification('Processing document...', 'info');

    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target.result;

      // For text files, directly use content
      if (file.type === 'text/plain') {
        await chrome.storage.local.set({
          currentContent: content,
          currentMetadata: {
            title: file.name,
            type: 'document',
            size: file.size,
            uploadedAt: new Date().toISOString()
          },
          lastProcessed: Date.now()
        });

        // Increment materials count
        const { materialsProcessed = 0 } = await chrome.storage.local.get('materialsProcessed');
        await chrome.storage.local.set({ materialsProcessed: materialsProcessed + 1 });

        chrome.sidePanel.open({ windowId });
        window.close();
      } else {
        // For PDFs and other formats, will need PDF.js (to be implemented)
        showNotification('PDF processing coming soon! For now, please use text files.', 'info');
      }
    };

    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  } catch (error) {
    console.error('File upload error:', error);
    showNotification('Error processing document', 'error');
  }
}

// Show notification (simple version)
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#8b4545' : '#6b8b45'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
