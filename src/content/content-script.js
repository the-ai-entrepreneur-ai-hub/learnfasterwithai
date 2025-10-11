// Content Script - AI Learning Accelerator
// Extracts content from web pages and PDFs, injects UI elements

console.log('AI Learning Accelerator - Content Script Loaded');

// Main content extractor
class ContentExtractor {
  constructor() {
    this.content = '';
    this.metadata = {};
  }

  // Extract readable content from current page
  extractWebContent() {
    // Remove scripts, styles, and unwanted elements
    const clone = document.cloneNode(true);
    const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript'];

    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Try to find main content area
    const mainContent =
      clone.querySelector('main') ||
      clone.querySelector('article') ||
      clone.querySelector('[role="main"]') ||
      clone.querySelector('.content') ||
      clone.querySelector('#content') ||
      clone.body;

    if (!mainContent) {
      return { text: '', error: 'Could not find main content' };
    }

    // Extract text with basic formatting
    const text = this.getTextWithStructure(mainContent);

    // Extract metadata
    const title = document.title;
    const url = window.location.href;
    const description = document.querySelector('meta[name="description"]')?.content || '';

    return {
      text,
      metadata: {
        title,
        url,
        description,
        wordCount: text.split(/\s+/).length,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Extract text while preserving structure
  getTextWithStructure(element) {
    let text = '';

    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const paragraphs = element.querySelectorAll('p');
    const lists = element.querySelectorAll('ul, ol');

    // Extract headings with markers
    headings.forEach(heading => {
      const level = heading.tagName[1];
      text += `\n${'#'.repeat(level)} ${heading.textContent.trim()}\n`;
    });

    // Extract paragraphs
    paragraphs.forEach(p => {
      const pText = p.textContent.trim();
      if (pText.length > 20) { // Filter out short/empty paragraphs
        text += `\n${pText}\n`;
      }
    });

    // Extract lists
    lists.forEach(list => {
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        text += `\n- ${item.textContent.trim()}`;
      });
      text += '\n';
    });

    // Fallback: if nothing extracted, get all text
    if (text.trim().length < 100) {
      text = element.textContent;
    }

    // Clean up excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    return text;
  }

  // Check if current page is a PDF
  isPDF() {
    return (
      window.location.href.toLowerCase().endsWith('.pdf') ||
      document.contentType === 'application/pdf' ||
      document.querySelector('embed[type="application/pdf"]') !== null
    );
  }

  // Detect if page is a video learning platform
  isVideoLearningPage() {
    const url = window.location.href;
    const videoPatterns = [
      'youtube.com/watch',
      'udemy.com/course',
      'coursera.org/learn',
      'edx.org/course',
      'pluralsight.com/courses',
      'linkedin.com/learning'
    ];

    return videoPatterns.some(pattern => url.includes(pattern));
  }

  // Extract video transcript (YouTube example)
  async extractVideoTranscript() {
    // Check for YouTube transcript
    if (window.location.hostname.includes('youtube.com')) {
      const transcriptButton = document.querySelector('button[aria-label*="transcript" i]');
      if (transcriptButton) {
        transcriptButton.click();
        await this.sleep(1000);

        const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer');
        if (transcriptPanel) {
          const segments = transcriptPanel.querySelectorAll('yt-formatted-string.segment-text');
          const transcript = Array.from(segments).map(s => s.textContent.trim()).join(' ');
          return transcript;
        }
      }
    }

    return null;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Real-Time Learning Assistant - Enhanced FAB
class RealTimeLearningAssistant {
  constructor() {
    this.button = null;
    this.tooltip = null;
    this.isActive = false;
    this.contentMonitor = null;
    this.userProfile = null;
    this.learningState = null;
    this.contextualSuggestions = [];
    this.isLiveMode = false;
    this.visibilityWatcher = null;
    this.dragInitialized = false;
    this.justDragged = false;
    this.domReadyPending = false;
    this.positionData = null;
    this.handleResizeBound = null;
    this.scrollListenerBound = null;
    this.observedTarget = null;
  }

  create() {
    if (!document.body) {
      if (this.domReadyPending) return;
      this.domReadyPending = true;
      document.addEventListener('DOMContentLoaded', () => {
        this.domReadyPending = false;
        this.create();
      }, { once: true });
      return;
    }

    if (!this.button) {
      this.button = document.createElement('div');
      this.button.id = 'ai-learning-fab';
      this.button.className = 'ai-learning-fab-intelligence';
      this.button.innerHTML = `
        <div class="fab-main">
          <div class="fab-icon-container">
            <svg class="fab-icon-normal" width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#2c1810" stroke="#8b7355" stroke-width="2"/>
              <path d="M16 8 L16 24 M8 16 L24 16" stroke="#d4a574" stroke-width="2" stroke-linecap="round"/>
              <text x="16" y="20" font-family="serif" font-size="10" fill="#d4a574" text-anchor="middle">AI</text>
            </svg>
            <svg class="fab-icon-active" width="32" height="32" viewBox="0 0 32 32" fill="none" style="display:none;">
              <circle cx="16" cy="16" r="14" fill="#d4a574" stroke="#2c1810" stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="#2c1810">
                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="16" cy="16" r="10" fill="none" stroke="#d4a574" stroke-width="1" opacity="0.6">
                <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <div class="fab-status-indicator"></div>
        </div>
        <div class="fab-menu" style="display:none;">
          <button class="fab-menu-item" data-action="analyze">
            <span class="item-icon">🔍</span>
            <span class="item-text">Analyze Content</span>
          </button>
          <button class="fab-menu-item" data-action="realtime">
            <span class="item-icon">⚡</span>
            <span class="item-text">Real-Time Assistant</span>
          </button>
          <button class="fab-menu-item" data-action="clarify">
            <span class="item-icon">💡</span>
            <span class="item-text">Quick Question</span>
          </button>
          <button class="fab-menu-item" data-action="summarize">
            <span class="item-icon">📋</span>
            <span class="item-text">Instant Summary</span>
          </button>
        </div>
      `;

      this.attachEventListeners();
    }

    if (!document.body.contains(this.button)) {
      document.body.appendChild(this.button);
    }

    this.button.style.position = 'fixed';
    this.button.style.zIndex = '2147483647';
    this.isVisible = true;

    if (!this.dragInitialized) {
      this.setupDrag();
    }

    this.startLiveMonitoring();

    this.loadUserProfile();
    this.restorePosition();
    this.startVisibilityWatchdog();
  }

  attachEventListeners() {
    // Main button click - toggle menu
    const fabMain = this.button.querySelector('.fab-main');
    fabMain.addEventListener('click', (e) => {
      if (this.justDragged) {
        this.justDragged = false;
        return;
      }
      e.stopPropagation();
      this.toggleMenu();
    });

    // Menu item clicks
    const menuItems = this.button.querySelectorAll('.fab-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.getAttribute('data-action');
        this.handleAction(action);
        this.hideMenu();
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.button) return;
      if (!this.button.contains(e.target)) {
        this.hideMenu();
      }
    });

    // Hover effects and tooltip
    fabMain.addEventListener('mouseenter', () => this.showTooltip());
    fabMain.addEventListener('mouseleave', () => this.hideTooltip());
    fabMain.addEventListener('mousedown', () => this.button.classList.add('fab-active'));
    fabMain.addEventListener('mouseup', () => this.button.classList.remove('fab-active'));
  }

  setupDrag() {
    if (this.dragInitialized || !this.button) return;

    const fabMain = this.button.querySelector('.fab-main');
    if (!fabMain) return;

    let isDragging = false;
    let hasMoved = false;
    let startPointer = { x: 0, y: 0 };
    let offsetFromPointer = { x: 0, y: 0 };

    const onPointerMove = (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - startPointer.x;
      const deltaY = event.clientY - startPointer.y;

      if (!hasMoved && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
        hasMoved = true;
        this.hideMenu();
        this.hideTooltip();
        fabMain.classList.add('is-dragging');
      }

      if (hasMoved) {
        const freeX = event.clientX - offsetFromPointer.x;
        const freeY = event.clientY - offsetFromPointer.y;
        this.setFreePosition(freeX, freeY);
      }
    };

    const releasePointerListeners = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      fabMain.classList.remove('is-dragging');
    };

    const onPointerUp = (event) => {
      if (!isDragging) return;
      isDragging = false;

      if (fabMain.hasPointerCapture?.(event.pointerId)) {
        try {
          fabMain.releasePointerCapture(event.pointerId);
        } catch (error) {
          // Ignore release errors
        }
      }

      releasePointerListeners();

      this.button.style.transition = '';

      if (!hasMoved) {
        return;
      }

      event.preventDefault();
      const rect = this.button.getBoundingClientRect();
      const snapped = this.snapToViewport({ x: rect.left, y: rect.top });
      this.setPosition(snapped, true);

      this.justDragged = true;
      setTimeout(() => {
        this.justDragged = false;
      }, 250);
    };

    fabMain.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType !== 'touch') return;

      isDragging = true;
      hasMoved = false;
      startPointer = { x: event.clientX, y: event.clientY };

      const rect = this.button.getBoundingClientRect();
      offsetFromPointer = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      this.button.style.transition = 'none';
      fabMain.setPointerCapture?.(event.pointerId);

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    });

    this.dragInitialized = true;
  }

  setFreePosition(x, y) {
    if (!this.button) return;

    const width = this.button.offsetWidth || 64;
    const height = this.button.offsetHeight || 64;
    const minGap = 8;

    const maxX = window.innerWidth - width - minGap;
    const maxY = window.innerHeight - height - minGap;

    const clampedX = Math.min(Math.max(x, minGap), Math.max(minGap, maxX));
    const clampedY = Math.min(Math.max(y, minGap), Math.max(minGap, maxY));

    this.button.style.left = `${clampedX}px`;
    this.button.style.top = `${clampedY}px`;
    this.button.style.right = 'auto';
    this.button.style.bottom = 'auto';
  }

  snapToViewport(position) {
    const width = this.button?.offsetWidth || 64;
    const height = this.button?.offsetHeight || 64;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minGap = 16;

    const centerX = position.x + (width / 2);
    const centerY = position.y + (height / 2);

    const horizontal = centerX > viewportWidth / 2 ? 'right' : 'left';
    const vertical = centerY > viewportHeight / 2 ? 'bottom' : 'top';

    const offsetX = horizontal === 'right'
      ? Math.max(minGap, viewportWidth - (position.x + width))
      : Math.max(minGap, position.x);

    const offsetY = vertical === 'bottom'
      ? Math.max(minGap, viewportHeight - (position.y + height))
      : Math.max(minGap, position.y);

    return { horizontal, vertical, offsetX, offsetY };
  }

  setPosition(position, persist = false) {
    if (!this.button) return;

    const sanitized = this.constrainToViewport({
      horizontal: position.horizontal || 'right',
      vertical: position.vertical || 'bottom',
      offsetX: position.offsetX ?? 24,
      offsetY: position.offsetY ?? 24
    });

    this.button.style.left = 'auto';
    this.button.style.right = 'auto';
    this.button.style.top = 'auto';
    this.button.style.bottom = 'auto';

    this.button.style[sanitized.horizontal] = `${sanitized.offsetX}px`;
    this.button.style[sanitized.vertical] = `${sanitized.offsetY}px`;

    this.positionData = { ...sanitized };

    if (persist) {
      const maybePromise = chrome.storage.local.set({ fabPosition: sanitized });
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(console.error);
      }
    }
  }

  async restorePosition() {
    if (!this.button) return;

    try {
      const { fabPosition } = await chrome.storage.local.get('fabPosition');
      if (fabPosition) {
        this.setPosition(fabPosition, false);
        return;
      }
    } catch (error) {
      console.warn('AI Learning Assistant: unable to restore FAB position', error);
    }

    this.setPosition({ horizontal: 'right', vertical: 'bottom', offsetX: 24, offsetY: 24 }, false);
  }

  startVisibilityWatchdog() {
    if (this.visibilityWatcher) return;

    this.visibilityWatcher = setInterval(() => {
      if (!this.button) return;
      if (!document.body) return;

      if (!document.body.contains(this.button)) {
        document.body.appendChild(this.button);
        this.setPosition(this.positionData || { horizontal: 'right', vertical: 'bottom', offsetX: 24, offsetY: 24 }, false);
        this.startLiveMonitoring();
      }

      const style = window.getComputedStyle(this.button);
      if (style.display === 'none' || style.visibility === 'hidden') {
        this.button.style.display = 'block';
        this.button.style.visibility = 'visible';
        this.button.style.opacity = '1';
      }
    }, 3000);

    if (!this.handleResizeBound) {
      this.handleResizeBound = this.handleResize.bind(this);
      window.addEventListener('resize', this.handleResizeBound);
    }
  }

  handleResize() {
    if (!this.positionData) return;
    this.setPosition(this.positionData, true);
  }

  constrainToViewport(position) {
    if (!this.button) return position;

    const minGap = 12;
    const width = this.button.offsetWidth || 64;
    const height = this.button.offsetHeight || 64;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxHorizontal = Math.max(minGap, viewportWidth - width - minGap);
    const maxVertical = Math.max(minGap, viewportHeight - height - minGap);

    const sanitized = {
      horizontal: position.horizontal === 'left' ? 'left' : 'right',
      vertical: position.vertical === 'top' ? 'top' : 'bottom',
      offsetX: position.offsetX,
      offsetY: position.offsetY
    };

    sanitized.offsetX = Math.min(Math.max(position.offsetX, minGap), maxHorizontal);
    sanitized.offsetY = Math.min(Math.max(position.offsetY, minGap), maxVertical);

    return sanitized;
  }

  toggleMenu() {
    const menu = this.button.querySelector('.fab-menu');
    const isActive = menu.style.display !== 'none';
    
    if (isActive) {
      this.hideMenu();
    } else {
      this.showMenu();
    }
  }

  showMenu() {
    const menu = this.button.querySelector('.fab-menu');
    const normalIcon = this.button.querySelector('.fab-icon-normal');
    const activeIcon = this.button.querySelector('.fab-icon-active');
    const indicator = this.button.querySelector('.fab-status-indicator');

    // Show menu with animation
    menu.style.display = 'flex';
    setTimeout(() => menu.classList.add('menu-visible'), 10);

    // Update icons
    normalIcon.style.display = 'none';
    activeIcon.style.display = 'block';

    // Update status indicator
    indicator.className = 'fab-status-indicator fab-status-active';

    this.isActive = true;
  }

  hideMenu() {
    const menu = this.button.querySelector('.fab-menu');
    const normalIcon = this.button.querySelector('.fab-icon-normal');
    const activeIcon = this.button.querySelector('.fab-icon-active');
    const indicator = this.button.querySelector('.fab-status-indicator');

    menu.classList.remove('menu-visible');
    setTimeout(() => menu.style.display = 'none', 300);

    normalIcon.style.display = 'block';
    activeIcon.style.display = 'none';

    indicator.className = 'fab-status-indicator';

    this.isActive = false;
  }

  async handleAction(action) {
    console.log(`FAB action: ${action}`);

    switch (action) {
      case 'analyze':
        await this.performAnalysis();
        break;
      case 'realtime':
        await this.toggleRealTimeMode();
        break;
      case 'clarify':
        await this.quickClarify();
        break;
      case 'summarize':
        await this.quickSummary();
        break;
    }
  }

  async performAnalysis() {
    const extractor = new ContentExtractorWithSections();
    let content;

    if (extractor.isPDF()) {
      content = { text: 'PDF detected. Loading...', metadata: { type: 'pdf', url: window.location.href } };
    } else if (extractor.isVideoLearningPage()) {
      const transcript = await extractor.extractVideoTranscript();
      content = { text: transcript || 'Video page detected. Loading transcript...', metadata: { type: 'video', url: window.location.href } };
    } else {
      content = extractor.extractWebContent();
    }

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'EXTRACT_CONTENT',
      data: {
        content: content.text,
        metadata: content.metadata,
        contentType: content.metadata.type || 'webpage',
        url: window.location.href
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Content extraction message error:', chrome.runtime.lastError.message);
        this.showNotification('⚠️ Could not process this page. Please refresh and try again.');
        return;
      }

      if (response?.success) {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' }, () => {
          if (chrome.runtime.lastError) {
            console.warn('Sidepanel open failed:', chrome.runtime.lastError.message);
          }
        });
      } else {
        const message = response?.error || 'Analysis failed. Please try again.';
        this.showNotification(`⚠️ ${message}`);
      }
    });
  }

  async toggleRealTimeMode() {
    this.isLiveMode = !this.isLiveMode;
    
    if (this.isLiveMode) {
      this.showNotification('🧠 Real-Time Assistant activated! I\'ll provide learning insights as you browse.');
      this.startLiveLearning();
    } else {
      this.showNotification('Real-Time Assistant paused');
      this.stopLiveLearning();
    }
  }

  async quickClarify() {
    // Create custom question modal instead of prompt
    const modal = this.createQuestionModal();
    
    if (!modal) return;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('question-modal-visible'), 10);

    // Handle modal submission
    const submitBtn = modal.querySelector('.question-submit-btn');
    const input = modal.querySelector('.question-input');
    
    const handleSubmission = async () => {
      const question = input.value.trim();
      if (!question) return;

      modal.classList.remove('question-modal-visible');
      this.showNotification('🤔 Processing your question...');
      
      // Send to sidepanel with question context
      chrome.runtime.sendMessage({
        type: 'QUICK_CLARIFY',
        data: {
          question,
          url: window.location.href
        }
      });
    };

    submitBtn.addEventListener('click', handleSubmission);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleSubmission();
      }
    });

    // Handle cancel button
    const cancelBtn = modal.querySelector('.question-cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      modal.classList.remove('question-modal-visible');
      setTimeout(() => modal.remove(), 300);
    });
  }

  createQuestionModal() {
    const modal = document.createElement('div');
    modal.className = 'ai-learning-question-modal';
    modal.innerHTML = `
      <div class="question-modal-content">
        <div class="question-modal-header">
          <h3>💬 Quick Question</h3>
          <button class="question-cancel-btn">×</button>
        </div>
        <div class="question-modal-body">
          <div class="question-description">
            Get instant clarification while browsing. I'll analyze the current page context to provide the most accurate answer.
          </div>
          <textarea 
            class="question-input" 
            placeholder="What would you like clarified? (e.g., 'Explain this concept' or 'What does this mean?')"
            rows="3"
          ></textarea>
          <div class="question-suggestions">
            <p>Or try these examples:</p>
            <div class="example-questions">
              <button class="example-question" onclick="this.closest('.question-modal').querySelector('.question-input').value = 'Explain the main concept here'; this.closest('.question-modal').querySelector('.question-submit-btn').click()">🧠 Explain main concept</button>
              <button class="example-question" onclick="this.closest('.question-modal').querySelector('.question-input').value = 'What does this term mean in this context?'; this.closest('.question-modal').querySelector('.question-submit-btn').click()">🔍 What does this mean?</button>
              <button class="example-question" onclick="this.closest('.question-modal').querySelector('.question-input').value = 'How does this connect to other topics?'; this.closest('.question-modal').querySelector('.question-submit-btn').click()">🔗 How does this connect?</button>
            </div>
          </div>
        </div>
        <div class="question-modal-footer">
          <button class="question-cancel-btn">Cancel</button>
          <button class="question-submit-btn">
            <span class="btn-icon">💡</span>
            Ask Question
          </button>
        </div>
      </div>
    `;

    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .ai-learning-question-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(8px);
        font-family: 'Georgia', serif;
      }
      
      .question-modal-content {
        background: linear-gradient(135deg, #f5f0e8 0%, #e8dfcc 100%);
        border: 2px solid #8b7355;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
      }
      
      .question-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #8b7355;
      }
      
      .question-modal-header h3 {
        font-size: 20px;
        font-weight: 600;
        color: #2c1810;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .question-cancel-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #8b7355;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
      }
      
      .question-cancel-btn:hover {
        background: #8b7355;
        color: #f5f0e8;
      }
      
      .question-modal-body {
        margin-bottom: 24px;
      }
      
      .question-description {
        color: #4a3228;
        margin-bottom: 16px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .question-input {
        width: 100%;
        min-height: 80px;
        padding: 16px;
        border: 2px solid #8b7355;
        border-radius: 8px;
        font-family: 'Georgia', serif;
        font-size: 14px;
        background: #f5f0e8;
        color: #2c1810;
        resize: vertical;
        transition: all 0.2s ease;
      }
      
      .question-input:focus {
        outline: none;
        border-color: #d4a574;
        box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.3);
      }
      
      .question-suggestions {
        margin-bottom: 16px;
      }
      
      .suggestions-title {
        font-size: 13px;
        color: #8b7355;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .example-questions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .example-question {
        background: rgba(212, 165, 116, 0.1);
        border: 1px solid rgba(212, 165, 116, 0.2);
        border-radius: 6px;
        padding: 8px 12px;
        font-family: 'Georgia', serif;
        font-size: 12px;
        color: #2c1810;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .example-question:hover {
        background: rgba(212, 165, 116, 0.2);
        transform: translateY(-2px);
      }
      
      .question-modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .question-cancel-btn {
        background: transparent;
        color: #8b7355;
        border: 2px solid #8b7355;
        border-radius: 6px;
        padding: 10px 20px;
        font-family: 'Georgia', serif;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .question-cancel-btn:hover {
        background: #8b7355;
        color: #f5f0e8;
      }
      
      .question-submit-btn {
        background: #d4a574;
        color: #2c1810;
        border: none;
        border-radius: 6px;
        padding: 12px 20px;
        font-family: 'Georgia', serif;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .question-submit-btn:hover {
        background: #b8860b;
        transform: translateY(-2px);
      }
      
      .question-modal.modal-visible {
        opacity: 1;
      }
    `;

    document.head.appendChild(style);

    return modal;
  }

  async quickSummary() {
    const extractor = new ContentExtractorWithSections();
    const content = extractor.extractWebContent();
    
    this.showNotification('📋 Generating quick summary...');
    
    chrome.runtime.sendMessage({
      type: 'EXTRACT_CONTENT',
      data: {
        content: content.text,
        metadata: content.metadata,
        contentType: 'quick_summary',
        url: window.location.href,
        autoProcess: 'summarize'
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Quick summary error:', chrome.runtime.lastError.message);
        this.showNotification('⚠️ Quick summary failed. Please try again.');
        return;
      }

      if (response?.autoProcess?.success) {
        this.showNotification('✅ Summary ready in the side panel.');
        chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' }, () => {
          if (chrome.runtime.lastError) {
            console.warn('Sidepanel open failed:', chrome.runtime.lastError.message);
          }
        });
      } else if (response?.autoProcess?.error) {
        this.showNotification(`⚠️ Quick summary failed: ${response.autoProcess.error}`);
      }
    });
  }

  async startLiveMonitoring() {
    if (!document.body) return;

    if ('MutationObserver' in window) {
      if (!this.contentMonitor) {
        this.contentMonitor = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              this.onContentChange();
            }
          });
        });
      }

      if (this.observedTarget !== document.body) {
        this.contentMonitor.disconnect();
        this.contentMonitor.observe(document.body, {
          childList: true,
          subtree: true
        });
        this.observedTarget = document.body;
      }
    }

    if (!this.scrollListenerBound) {
      this.scrollListenerBound = () => this.onScrollChange();
      window.addEventListener('scroll', this.scrollListenerBound, { passive: true });
    }
  }

  onContentChange() {
    if (this.isLiveMode) {
      // Debounce content analysis
      clearTimeout(this.contentChangeTimeout);
      this.contentChangeTimeout = setTimeout(() => {
        this.analyzeContentContext();
      }, 2000);
    }
  }

  onScrollChange() {
    if (this.isLiveMode) {
      // Update contextual understanding based on reading position
    }
  }

  async analyzeContentContext() {
    const extractor = new ContentExtractorWithSections();
    const currentSection = extractor.getCurrentSection();
    
    if (currentSection && currentSection.length > 200) {
      // Send for contextual analysis without user action
      chrome.runtime.sendMessage({
        type: 'CONTEXT_ANALYSIS',
        data: {
          content: currentSection,
          url: window.location.href,
          scrollPosition: window.pageYOffset,
          userProfile: this.userProfile
        }
      });
    }
  }

  async startLiveLearning() {
    // Enable proactive learning assistance
    this.updateStatusIndicator('live');
  }

  stopLiveLearning() {
    // Pause live learning
    this.updateStatusIndicator('paused');
  }

  async loadUserProfile() {
    // Load user expertise and preferences
    const data = await chrome.storage.sync.get(['userProfile', 'learningPreferences']);
    this.userProfile = data.userProfile || { expertise: 'intermediate', topics: [] };
  }

  updateStatusIndicator(status) {
    const indicator = this.button.querySelector('.fab-status-indicator');
    indicator.className = `fab-status-indicator fab-status-${status}`;
  }

  showTooltip() {
    if (this.tooltip) this.hideTooltip();

    // Create contextual tooltip based on current state
    let tooltipText = '🧠 Learning Assistant';
    
    if (this.isLiveMode) {
      tooltipText = '⚡ Real-Time Active';
    } else if (this.contextualSuggestions.length > 0) {
      tooltipText = `💡 ${this.contextualSuggestions.length} insights available`;
    }

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'ai-learning-tooltip';
    this.tooltip.textContent = tooltipText;

    this.button.appendChild(this.tooltip);
    setTimeout(() => this.tooltip.classList.add('tooltip-visible'), 10);
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('tooltip-visible');
      setTimeout(() => {
        if (this.tooltip) {
          this.tooltip.remove();
          this.tooltip = null;
        }
      }, 200);
    }
  }

  showNotification(message) {
    // Create in-page notification for better UX
    const notification = document.createElement('div');
    notification.className = 'ai-learning-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('notification-visible'), 10);
    
    setTimeout(() => {
      notification.classList.remove('notification-visible');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  remove() {
    if (this.contentMonitor) {
      this.contentMonitor.disconnect();
      this.contentMonitor = null;
    }
    if (this.visibilityWatcher) {
      clearInterval(this.visibilityWatcher);
      this.visibilityWatcher = null;
    }
    if (this.handleResizeBound) {
      window.removeEventListener('resize', this.handleResizeBound);
      this.handleResizeBound = null;
    }
    if (this.tooltip) {
      this.hideTooltip();
    }
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
    if (this.contentChangeTimeout) {
      clearTimeout(this.contentChangeTimeout);
      this.contentChangeTimeout = null;
    }
    this.dragInitialized = false;
    this.isVisible = false;
    this.isActive = false;
    if (this.scrollListenerBound) {
      window.removeEventListener('scroll', this.scrollListenerBound);
      this.scrollListenerBound = null;
    }
    this.observedTarget = null;
  }
}

// Enhanced Content Extractor with section analysis
class ContentExtractorWithSections extends ContentExtractor {
  getCurrentSection() {
    // Extract content from current viewport/scroll position
    const viewportHeight = window.innerHeight;
    const centerY = window.pageYOffset + (viewportHeight / 2);
    
    // Find the most relevant section based on scroll position
    const sections = document.querySelectorAll('h1, h2, h3, section, article, p');
    let closestSection = null;
    let minDistance = Infinity;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionY = window.pageYOffset + rect.top;
      const distance = Math.abs(centerY - sectionY);
      
      if (distance < minDistance && rect.height > 100) {
        minDistance = distance;
        closestSection = section;
      }
    });

    if (closestSection) {
      // Extract content around this section
      const container = closestSection.parentElement;
      return this.getTextWithStructure(container).slice(0, 2000);
    }

    return '';
  }
}

// Initialize the enhanced learning assistant with proper icon loading
const learningAssistant = new RealTimeLearningAssistant();
learningAssistant.create();

// Page change detection for cache clearing
let lastPageUrl = window.location.href;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CONTENT') {
    const extractor = new ContentExtractorWithSections();
    const content = extractor.extractWebContent();
    sendResponse(content);
  }

  if (request.type === 'UPDATE_SUGGESTIONS') {
    // Update contextual suggestions from background analysis
    learningAssistant.contextualSuggestions = request.suggestions || [];
  }

  if (request.type === 'HIGHLIGHT_CONCEPTS') {
    // Highlight important concepts in the page
    learningAssistant.highlightConcepts(request.concepts);
  }

  if (request.type === 'SHOW_CONTEXTUAL_HELP') {
    // Show contextual learning tip
    learningAssistant.showTooltip(request.message);
  }
});

// Detect page changes and clear stale cache
setInterval(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastPageUrl) {
    console.log('🔄 Page changed, clearing stale content cache');
    lastPageUrl = currentUrl;
    
    // Clear any stale content from previous page
    chrome.storage.local.remove(['currentContent', 'currentMetadata']);
  }
}, 1000); // Check every second for page changes

// Also detect page unload to clear cache
window.addEventListener('beforeunload', () => {
  console.log('🔄 Page unloading, clearing content cache');
  chrome.storage.local.remove(['currentContent', 'currentMetadata']);
});

// Export for use in other scripts
window.AILearningAccelerator = {
  extractContent: () => {
    const extractor = new ContentExtractorWithSections();
    return extractor.extractWebContent();
  }
};
