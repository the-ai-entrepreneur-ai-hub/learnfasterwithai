// Sidepanel Script - AI Learning Accelerator

console.log('AI Learning Accelerator Sidepanel loaded');

// Enhanced State Management for Real-Time Learning
const state = {
  currentContent: null,
  currentMetadata: null,
  currentTab: 'process',
  processedResults: {},
  parsedResults: {},
  visualizationType: 'mindmap',
  quizData: null,
  libraryItems: [],
  // NEW: Real-Time Learning State
  userProfile: { expertise: 'intermediate', topics: [], learningGoals: [] },
  contextualSuggestions: [],
  realTimeLearningEnabled: false,
  quickClarifications: [],
  learningSession: {
    startTime: null,
    insightsGenerated: 0,
    questionsAsked: 0,
    conceptsLearned: 0
  }
};

function sanitizeGeminiBlock(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .replace(/```/g, '')
    .trim();
}

function parseGeminiJson(raw) {
  if (!raw) return null;
  if (typeof raw !== 'string') return raw;

  const cleaned = sanitizeGeminiBlock(raw);
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;

  if (firstBrace === -1 && firstBracket === -1) {
    return null;
  }

  if (firstBrace === -1) {
    start = firstBracket;
  } else if (firstBracket === -1) {
    start = firstBrace;
  } else {
    start = Math.min(firstBrace, firstBracket);
  }

  const opening = cleaned[start];
  const closing = opening === '[' ? ']' : '}';
  const end = cleaned.lastIndexOf(closing);

  if (start === -1 || end === -1) {
    return null;
  }

  const segment = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(segment);
  } catch (error) {
    console.warn('Unable to parse Gemini JSON payload', error);
    return null;
  }
}

function normalizeStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map(entry => {
        if (typeof entry === 'string') return entry.trim();
        if (entry && typeof entry === 'object') {
          return (entry.title || entry.name || entry.label || '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map(entry => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeSubconcepts(subconcepts) {
  if (!subconcepts) return [];

  if (typeof subconcepts === 'string') {
    return subconcepts
      .split(/[,;\n]/)
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(title => ({ title, insight: '' }));
  }

  if (!Array.isArray(subconcepts)) return [];

  return subconcepts
    .map(sub => {
      if (typeof sub === 'string') {
        return { title: sub.trim(), insight: '' };
      }
      if (sub && typeof sub === 'object') {
        const title = (sub.title || sub.name || sub.heading || '').trim();
        const insight = (sub.insight || sub.summary || sub.description || '').trim();
        if (!title && !insight) return null;
        return { title, insight };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeConceptStructure(raw, fallbackTopic) {
  if (!raw) return null;

  const parsed = parseGeminiJson(raw);
  const base = parsed && typeof parsed === 'object' ? parsed : raw;

  if (!base || typeof base !== 'object') {
    return null;
  }

  const mainTopic =
    base.main_topic ||
    base.topic ||
    fallbackTopic ||
    (state.currentMetadata?.title || 'Main Topic');

  const mainTopicSummary = base.main_topic_summary || base.summary || '';

  const keyConceptsSource =
    (Array.isArray(base.keyConcepts) && base.keyConcepts) ||
    (Array.isArray(base.key_concepts) && base.key_concepts) ||
    (Array.isArray(base.concepts) && base.concepts) ||
    [];

  const keyConcepts = keyConceptsSource
    .map(concept => normalizeConceptItem(concept))
    .filter(Boolean);

  if (!keyConcepts.length) {
    return null;
  }

  return {
    mainTopic,
    mainTopicSummary,
    keyConcepts,
    key_concepts: keyConcepts // legacy compatibility for existing renderers
  };
}

function normalizeConceptItem(concept) {
  if (!concept || typeof concept !== 'object') {
    if (typeof concept === 'string' && concept.trim()) {
      return {
        name: concept.trim(),
        summary: '',
        subconcepts: [],
        connections: [],
        memoryHook: '',
        actionStep: ''
      };
    }
    return null;
  }

  const name = (concept.name || concept.concept || concept.title || '').trim();
  if (!name) return null;

  const summary = (concept.summary || concept.description || concept.explanation || concept.overview || '').trim();
  const memoryHook = (concept.memory_hook || concept.memoryHook || concept.mnemonic || '').trim();
  const actionStep = (concept.action_step || concept.actionStep || concept.application || '').trim();

  const subconcepts = normalizeSubconcepts(concept.subconcepts || concept.subtopics || concept.children || concept.details);
  const connections = normalizeStringArray(concept.connections || concept.related || concept.links || concept.associations);

  return {
    name,
    summary,
    subconcepts,
    connections,
    memoryHook,
    actionStep
  };
}
// Enhanced Initialization with Real-Time Features
document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
  await loadUserProfile();
  initializeTabNavigation();
  initializeActionButtons();
  initializeRealTimeFeatures();
  initializeVisualControls();
  initializeLibraryFilters();
  await loadLibraryItems();
  checkForQuickClarifications();
});

// Load current content from storage
async function loadContent() {
  try {
    const data = await chrome.storage.local.get(['currentContent', 'currentMetadata', 'viewMode', 'lastAutoProcess', 'currentPageUrl']);

    state.parsedResults = {};

    // Always extract fresh content from current page (don't use cache)
    console.log('🔄 Sidepanel opened - extracting fresh content from current page...');
    await attemptFallbackExtraction();
    
    // Clear any stale cached content
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab?.url;
    
    // If we have old cached content from a different page, clear it
    if (data.currentPageUrl && data.currentPageUrl !== currentUrl) {
      console.log('🗑️ Clearing stale content from previous page:', data.currentPageUrl);
      await chrome.storage.local.remove(['currentContent', 'currentMetadata']);
    }
    
    // Store current page URL for tracking
    if (currentUrl) {
      await chrome.storage.local.set({ currentPageUrl: currentUrl });
    }

    if (data.lastAutoProcess) {
      const { success, result, task, error } = data.lastAutoProcess;

      if (success && result) {
        const effectiveTask = task || 'summarize';
        state.processedResults[effectiveTask] = result;
        switchTab('process');
        displayProcessedResult(result, effectiveTask);
        notificationManager.showNotification('✅ Latest AI result ready to review.', 'success', 4000);
      } else if (error) {
        notificationManager.showNotification(`⚠️ ${error}`, 'error', 6000);
      }

      await chrome.storage.local.remove('lastAutoProcess');
    }

    // Check if opening in library mode
    if (data.viewMode === 'library') {
      switchTab('library');
      await chrome.storage.local.remove('viewMode');
    }
  } catch (error) {
    console.error('Error loading content:', error);
  }
}

// Fallback content extraction when sidepanel opens - ALWAYS extracts fresh content
async function attemptFallbackExtraction() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      console.log('Cannot extract from restricted page');
      updateContentInfo(); // Update with empty state
      return;
    }

    console.log('🔄 Extracting fresh content from current page:', tab.url);

    // Clear any existing content first
    state.currentContent = null;
    state.currentMetadata = null;
    
    // Try direct message to content script first
    let extractedContent = null;
    
    try {
      extractedContent = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CONTENT' });
      console.log('✅ Content extracted via message:', extractedContent?.text?.length || 0);
    } catch (messageError) {
      console.log('Content script message failed, trying injection...');
      
      // Try injecting content script and extracting
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/content-script.js']
        });
        
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 500));
        
        extractedContent = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CONTENT' });
        console.log('✅ Content extracted after injection:', extractedContent?.text?.length || 0);
      } catch (injectionError) {
        console.log('Injection failed, trying inline extraction...');
        
        // Final fallback: inline extraction
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
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
                return { text: '', metadata: { title: document.title, url: window.location.href } };
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
              return { text: '', metadata: { title: document.title, url: window.location.href } };
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

        extractedContent = result?.result || null;
        console.log('Content extracted inline:', extractedContent?.text?.length || 0);
      }
    }

    // Store extracted content for processing
    if (extractedContent && extractedContent.text && extractedContent.text.trim().length > 100) {
      state.currentContent = extractedContent.text;
      state.currentMetadata = extractedContent.metadata || { title: tab.title, url: tab.url };
      
      // Store for future use
      await chrome.storage.local.set({
        currentContent: state.currentContent,
        currentMetadata: state.currentMetadata,
        lastProcessed: Date.now()
      });

      // Update UI
      updateContentInfo();
      
      console.log('✅ Fallback extraction successful:', {
        contentLength: state.currentContent.length,
        title: state.currentMetadata.title
      });
      
      // Show success notification
      notificationManager.showNotification(
        '✅ Content extracted automatically! You can now process it.',
        'success',
        3000
      );
    } else {
      console.log('❌ Fallback extraction failed: insufficient content');
      updateContentInfo(); // Update with empty state
    }
  } catch (error) {
    console.error('Fallback extraction error:', error);
    updateContentInfo(); // Update with empty state
  }
}

// Update content information display
function updateContentInfo() {
  const sourceUrl = document.getElementById('source-url');
  const wordCount = document.getElementById('word-count');
  const readingTime = document.getElementById('reading-time');

  if (state.currentMetadata) {
    sourceUrl.textContent = state.currentMetadata.title || state.currentMetadata.url || 'Unknown';

    if (state.currentContent) {
      const words = state.currentContent.split(/\s+/).length;
      const minutes = Math.ceil(words / 200); // Average reading speed

      wordCount.textContent = words.toLocaleString();
      readingTime.textContent = `${minutes} min`;
    }
  }
}

// Tab Navigation
function initializeTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });

  state.currentTab = tabName;
}

// Action Buttons
function initializeActionButtons() {
  console.log('Initializing action buttons...');
  
  // Check if DOM is ready
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    console.log('DOM not ready, waiting...');
    setTimeout(initializeActionButtons, 100);
    return;
  }
  
  // Enhanced button attachment with validation
  const attachButtonListener = (buttonId, handler, description) => {
    const button = document.getElementById(buttonId);
    if (!button) {
      console.error(`❌ Button not found: ${buttonId}`);
      return false;
    }
    
    // Remove existing listener if any
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add new listener
    newButton.addEventListener('click', handler);
    console.log(`✅ Attached listener to: ${description} (${buttonId})`);
    return true;
  };
  
  // Validate all required buttons exist
  const requiredButtons = [
    'btn-summarize',
    'btn-extract-concepts', 
    'btn-simplify',
    'btn-find-patterns',
    'btn-aggregate',
    'btn-generate-visual',
    'btn-export-visual',
    'btn-regenerate',
    'btn-generate-quiz',
    'btn-refresh-content'
  ];
  
  const missingButtons = requiredButtons.filter(id => !document.getElementById(id));
  if (missingButtons.length > 0) {
    console.error('❌ Missing buttons:', missingButtons);
    return;
  }
  
  // Summarize
  attachButtonListener('btn-summarize', async () => {
    console.log('=== SUMMARIZE BUTTON CLICKED ===');
    console.log('Current state:', {
      hasContent: !!state.currentContent,
      contentLength: state.currentContent?.length || 0,
      metadata: state.currentMetadata
    });
    await processContent('summarize', 'Generating comprehensive summary...');
  }, 'Summarize');

  // Extract concepts
  attachButtonListener('btn-extract-concepts', async () => {
    console.log('=== EXTRACT CONCEPTS BUTTON CLICKED ===');
    await processContent('concepts', 'Extracting key concepts...');
  }, 'Extract Concepts');

  // Simplify
  attachButtonListener('btn-simplify', async () => {
    console.log('=== SIMPLIFY BUTTON CLICKED ===');
    await processContent('simplify', 'Simplifying language...');
  }, 'Simplify Language');

  // Find patterns
  attachButtonListener('btn-find-patterns', async () => {
    console.log('=== FIND PATTERNS BUTTON CLICKED ===');
    await processContent('patterns', 'Identifying learning patterns...');
  }, 'Find Patterns');

  // Aggregate sources
  attachButtonListener('btn-aggregate', async () => {
    console.log('=== AGGREGATE BUTTON CLICKED ===');
    await aggregateSources();
  }, 'Aggregate Sources');

  // Generate visual
  attachButtonListener('btn-generate-visual', async () => {
    console.log('=== GENERATE VISUAL BUTTON CLICKED ===');
    await generateVisualization();
  }, 'Generate Visual');

  // Export visual
  attachButtonListener('btn-export-visual', () => {
    console.log('=== EXPORT VISUAL BUTTON CLICKED ===');
    exportVisualization();
  }, 'Export Visual');

  // Regenerate
  attachButtonListener('btn-regenerate', async () => {
    console.log('=== REGENERATE BUTTON CLICKED ===');
    await generateVisualization();
  }, 'Regenerate');

  // Generate quiz
  attachButtonListener('btn-generate-quiz', async () => {
    console.log('=== GENERATE QUIZ BUTTON CLICKED ===');
    await generateQuiz();
  }, 'Generate Quiz');
  
  // Refresh content
  attachButtonListener('btn-refresh-content', async () => {
    console.log('=== REFRESH CONTENT CLICKED ===');
    await refreshContent();
  }, 'Refresh Content');
  
  console.log('✅ All action buttons initialized successfully');
}

// Refresh content from current page
async function refreshContent() {
  try {
    console.log('🔄 Refreshing content from current page...');
    
    // Clear cached content and results
    state.currentContent = null;
    state.currentMetadata = null;
    state.processedResults = {};
    state.parsedResults = {};
    
    // Clear storage
    await chrome.storage.local.remove(['currentContent', 'currentMetadata']);
    
    showLoading('Refreshing content from current page...', false);
    
    // Extract fresh content
    await attemptFallbackExtraction();
    
    hideLoading();
    
    if (state.currentContent && state.currentContent.trim().length > 50) {
      showNotification('✅ Content refreshed successfully from current page!', 'success', 3000);
      console.log('✅ Refresh complete. New content length:', state.currentContent.length);
    } else {
      showNotification('⚠️ Could not extract content from current page. Try navigating to a different page.', 'warning', 5000);
    }
  } catch (error) {
    hideLoading();
    console.error('Content refresh failed:', error);
    showNotification('❌ Failed to refresh content. Please try refreshing the page.', 'error', 5000);
  }
}

// Process content with Gemini (enhanced with retry)
async function processContent(task, loadingMessage, retryCount = 0) {
  console.log('processContent called:', {
    task,
    hasContent: !!state.currentContent,
    contentLength: state.currentContent?.length || 0,
    metadata: state.currentMetadata
  });

  if (!state.currentContent || state.currentContent.trim().length < 50) {
    console.log('❌ No content available for processing');
    
    // Enhanced error message with specific guidance
    let errorMessage = 'No content loaded. Please extract content first:';
    errorMessage += '\n\n1. Go to any webpage with articles or learning content';
    errorMessage += '\n2. Click the floating AI button (bottom-right corner)';
    errorMessage += '\n3. The sidepanel will open automatically with extracted content';
    errorMessage += '\n4. Then click any processing button';
    
    const actions = [];
    
    // Add try fallback extraction action
    actions.push({
      text: 'Try Auto-Extract',
      handler: async () => {
        showLoading('Attempting to extract content...', false);
        await attemptFallbackExtraction();
        hideLoading();
        
        // Try processing again if extraction succeeded
        if (state.currentContent && state.currentContent.trim().length > 50) {
          console.log('✅ Content extracted, retrying processing...');
          await processContent(task, loadingMessage, retryCount);
        }
      }
    });
    
    actions.push({
      text: 'Open Settings',
      handler: () => chrome.runtime.openOptionsPage()
    });
    
    notificationManager.showNotification(
      errorMessage,
      'error',
      12000, // Longer display time
      actions
    );
    return;
  }

  showLoading(loadingMessage, true);

  try {
    console.log(`Processing content - Task: ${task}, Attempt: ${retryCount + 1}`);

    const response = await chrome.runtime.sendMessage({
      type: 'PROCESS_WITH_GEMINI',
      data: {
        content: state.currentContent,
        task: task
      }
    });

    console.log('Processing response received:', {
      hasError: !!response.error,
      hasResult: !!response.result,
      resultLength: response.result?.length || 0
    });

    hideLoading();

    if (response.error) {
      throw new Error(response.error);
    }

    const rawResult = response.result;
    let renderedResult = rawResult;
    if (task === 'concepts') {
      const structured = normalizeConceptStructure(rawResult, state.currentMetadata?.title);
      if (structured) {
        state.parsedResults.concepts = structured;
        renderedResult = structured;
      }
    }

    // Store result (pretty-print structured data when available)
    state.processedResults[task] = task === 'concepts' && state.parsedResults.concepts
      ? JSON.stringify(state.parsedResults.concepts, null, 2)
      : rawResult;

    // Display result
    displayProcessedResult(renderedResult, task);

    // Save to library
    const libraryContent = state.processedResults[task];

    await saveToLibrary({
      type: task,
      title: state.currentMetadata.title || 'Untitled',
      content: libraryContent,
      source: state.currentMetadata.url,
      timestamp: Date.now()
    });

    // Update concepts count
    if (task === 'concepts') {
      await updateConceptsCount();
    }

    showNotification('Processing complete! 🎉', 'success');

  } catch (error) {
    hideLoading();
    console.error('Processing error:', error);

    // Provide helpful error messages and retry option
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('api key')) {
      notificationManager.showNotification(
        'API key issue detected. Please check your settings and try again.',
        'warning',
        8000,
        [
          {
            text: 'Open Settings',
            handler: () => chrome.runtime.openOptionsPage()
          },
          {
            text: 'Retry',
            handler: () => processContent(task, loadingMessage)
          }
        ]
      );
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      notificationManager.showNotification(
        'Rate limit exceeded. Please wait a moment and try again.',
        'warning',
        6000,
        [
          {
            text: 'Retry',
            handler: () => {
              setTimeout(() => processContent(task, loadingMessage), 2000);
            }
          }
        ]
      );
    } else if (errorMessage.includes('server error') || errorMessage.includes('500')) {
      if (retryCount < 2) {
        notificationManager.showNotification(
          `Google AI server error. Retrying... (${retryCount + 1}/3)`,
          'warning',
          3000
        );
        setTimeout(() => processContent(task, loadingMessage, retryCount + 1), 2000);
      } else {
        notificationManager.showNotification(
          'Server error after multiple attempts. Please try again later.',
          'error',
          0,
          [
            {
              text: 'Try Again',
              handler: () => processContent(task, loadingMessage)
            }
          ]
        );
      }
    } else {
      // Generic error with retry option
      notificationManager.showRetryMessage(
        error.message,
        () => processContent(task, loadingMessage)
      );
    }
  }
}

// Display processed result
function displayProcessedResult(result, task) {
  const resultContainer = document.getElementById('process-result');

  // Format result based on task type
  let formattedResult = '';

  if (task === 'concepts') {
    let structured = null;

    if (result && typeof result === 'object') {
      structured = result;
    } else {
      structured = normalizeConceptStructure(result, state.currentMetadata?.title);
      if (structured) {
        state.parsedResults.concepts = structured;
      }
    }

    if (!structured && state.parsedResults.concepts) {
      structured = state.parsedResults.concepts;
    }

    if (structured) {
      formattedResult = formatConceptsAsHierarchy(structured);
    } else {
      formattedResult = `<pre class="result-text">${escapeHtml(typeof result === 'string' ? result : JSON.stringify(result, null, 2))}</pre>`;
    }
  } else {
    formattedResult = `<div class="result-text">${formatMarkdown(result)}</div>`;
  }

  resultContainer.innerHTML = `
    <div class="result-header">
      <h3 class="result-title">${getTaskTitle(task)}</h3>
      <button class="copy-btn" onclick="copyToClipboard('${task}')">
        <span>📋</span> Copy
      </button>
    </div>
    <div class="result-body">
      ${formattedResult}
    </div>
  `;
}

// Format concepts as hierarchy
function formatConceptsAsHierarchy(data) {
  const structured = data?.keyConcepts ? data : normalizeConceptStructure(data, state.currentMetadata?.title);

  if (!structured || !structured.keyConcepts || !structured.keyConcepts.length) {
    return '<p>No structured concepts found</p>';
  }

  state.parsedResults.concepts = structured;

  let html = `<div class="concepts-hierarchy">`;
  html += `<div class="concepts-main-topic">`;
  html += `<h4>${escapeHtml(structured.mainTopic)}</h4>`;
  if (structured.mainTopicSummary) {
    html += `<p class="concepts-topic-summary">${escapeHtml(structured.mainTopicSummary)}</p>`;
  }
  html += `</div>`;

  html += `<div class="concepts-grid">`;

  structured.keyConcepts.forEach(concept => {
    html += `<div class="concept-card">`;
    html += `<div class="concept-card-header">`;
    html += `<h5>${escapeHtml(concept.name)}</h5>`;
    if (concept.summary) {
      html += `<p class="concept-summary">${escapeHtml(concept.summary)}</p>`;
    }
    html += `</div>`;

    if (concept.subconcepts && concept.subconcepts.length > 0) {
      html += `<div class="concept-section">`;
      html += `<span class="concept-section-title">Key Ideas</span>`;
      html += `<ul class="concept-subconcepts">`;
      concept.subconcepts.forEach(sub => {
        const title = escapeHtml(sub.title || '');
        const insight = sub.insight ? `<span class="concept-subconcept-insight">${escapeHtml(sub.insight)}</span>` : '';
        html += `<li><span class="concept-subconcept-title">${title}</span>${insight}</li>`;
      });
      html += `</ul>`;
      html += `</div>`;
    }

    if (concept.connections && concept.connections.length > 0) {
      html += `<div class="concept-section">`;
      html += `<span class="concept-section-title">Connected To</span>`;
      html += `<div class="concept-chips">${concept.connections.map(connection => `<span class="concept-chip">${escapeHtml(connection)}</span>`).join('')}</div>`;
      html += `</div>`;
    }

    if (concept.memoryHook) {
      html += `<div class="concept-highlight">🧠 ${escapeHtml(concept.memoryHook)}</div>`;
    }

    if (concept.actionStep) {
      html += `<div class="concept-action"><strong>Apply it:</strong> ${escapeHtml(concept.actionStep)}</div>`;
    }

    html += `</div>`;
  });

  html += `</div></div>`;
  return html;
}

// Simple markdown formatter
function formatMarkdown(text) {
  // Headers
  text = text.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  text = text.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^# (.*$)/gim, '<h2>$1</h2>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Lists
  text = text.replace(/^\- (.*$)/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  text = '<p>' + text + '</p>';

  return text;
}

function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function getTaskTitle(task) {
  const titles = {
    summarize: 'Content Summary',
    concepts: 'Key Concepts',
    simplify: 'Simplified Content',
    patterns: 'Learning Patterns',
    quiz: 'Quiz Questions'
  };
  return titles[task] || 'Result';
}

// Aggregate sources
async function aggregateSources() {
  if (!state.currentContent) {
    showNotification('No content loaded. Please analyze a page first.', 'error');
    return;
  }

  showLoading('Finding related learning materials...');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'AGGREGATE_SOURCES',
      data: {
        topic: state.currentMetadata.title || 'Learning Topic',
        currentContent: state.currentContent.substring(0, 2000) // Send sample
      }
    });

    hideLoading();

    if (response.error) {
      throw new Error(response.error);
    }

    const leads = Array.isArray(response.keyConcepts) ? response.keyConcepts : [];

    const resultContainer = document.getElementById('process-result');

    if (!leads.length) {
      resultContainer.innerHTML = `
        <div class="result-header">
          <h3 class="result-title">Related Learning Materials</h3>
        </div>
        <div class="result-body">
          <p>No research leads were generated. Try summarizing the content first or refining the topic.</p>
        </div>
      `;
      showNotification('Try again with a more detailed section.', 'warning');
      return;
    }

    const cardsHtml = leads.map(lead => {
      const insight = lead.uniqueInsight ? `<p class="related-insight">${escapeHtml(lead.uniqueInsight)}</p>` : '';
      const action = lead.actionStep ? `<p class="related-action"><strong>Next step:</strong> ${escapeHtml(lead.actionStep)}</p>` : '';
      const tags = Array.isArray(lead.searchPhrases) && lead.searchPhrases.length
        ? `<div class="related-tags">${lead.searchPhrases.map(tag => `<span class="related-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
        : '';

      return `
        <div class="related-card">
          <h4>${escapeHtml(lead.concept)}</h4>
          ${insight}
          ${tags}
          ${action}
        </div>
      `;
    }).join('');

    resultContainer.innerHTML = `
      <div class="result-header">
        <h3 class="result-title">Research Leads</h3>
      </div>
      <div class="result-body">
        <p class="result-note">Use these curated directions to broaden your study. Each entry includes suggested search phrases you can use across your preferred learning platforms.</p>
        <div class="related-grid">${cardsHtml}</div>
      </div>
    `;

    state.parsedResults.relatedLeads = leads;
    state.processedResults.relatedLeads = JSON.stringify(leads, null, 2);

    showNotification('Research leads ready to explore!', 'success');
  } catch (error) {
    hideLoading();
    console.error('Aggregation error:', error);
    showNotification(error.message, 'error');
  }
}

// Visual Controls
function initializeVisualControls() {
  const visualTypeBtns = document.querySelectorAll('.visual-type-btn');

  visualTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      visualTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.visualizationType = btn.getAttribute('data-type');
    });
  });
}

// Generate visualization
async function generateVisualization() {
  if (!state.currentContent && !state.processedResults.concepts) {
    showNotification('Please extract key concepts first', 'error');
    return;
  }

  showLoading('Generating visualization...');

  try {
    // Use concepts if available, otherwise extract first
    let conceptsData = state.processedResults.concepts;
    let structuredConcepts = state.parsedResults.concepts;

    if (!conceptsData) {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_WITH_GEMINI',
        data: {
          content: state.currentContent,
          task: 'concepts'
        }
      });

      if (response.error) throw new Error(response.error);
      conceptsData = response.result;
      state.processedResults.concepts = conceptsData;
      structuredConcepts = normalizeConceptStructure(conceptsData, state.currentMetadata?.title);
      if (structuredConcepts) {
        state.parsedResults.concepts = structuredConcepts;
      }
    }

    if (!structuredConcepts) {
      structuredConcepts = normalizeConceptStructure(conceptsData, state.currentMetadata?.title);
      if (structuredConcepts) {
        state.parsedResults.concepts = structuredConcepts;
      }
    }

    if (!structuredConcepts) {
      throw new Error('Concepts are not structured enough for visualization. Please re-run concept extraction.');
    }

    // Generate based on type
    if (state.visualizationType === 'mindmap') {
      await generateMindMap(structuredConcepts);
    } else if (state.visualizationType === 'diagram') {
      await generateFlowDiagram(structuredConcepts);
    } else if (state.visualizationType === 'infographic') {
      await generateInfographic(structuredConcepts);
    }

    hideLoading();
    showNotification('Visualization generated!', 'success');
  } catch (error) {
    hideLoading();
    console.error('Visualization error:', error);
    showNotification(error.message, 'error');
  }
}

// Generate mind map (SVG-based)
async function generateMindMap(conceptsData) {
  const vizArea = document.getElementById('visualization-area');

  try {
    const data = conceptsData?.keyConcepts ? conceptsData : normalizeConceptStructure(conceptsData, state.currentMetadata?.title);

    if (!data || !data.keyConcepts || !data.keyConcepts.length) {
      throw new Error('Concept data is not available for visualization.');
    }

    const mindMapSVG = createMindMapSVG(data);
    vizArea.innerHTML = mindMapSVG;
  } catch (error) {
    console.error('Mind map generation failed:', error);
    vizArea.innerHTML = `
      <div class="simple-mindmap">
        <p>Mind map requires structured concepts. Re-run concept extraction to refresh the data.</p>
      </div>
    `;
  }
}

// Create SVG Mind Map
function createMindMapSVG(data) {
  const width = 600;
  const height = 500;

  let svg = `<svg width="${width}" height="${height}" class="mindmap-svg" style="background: #faf8f3; border: 2px solid #8b7355;">`;

  // Central node
  const centerX = width / 2;
  const centerY = height / 2;

  svg += `
    <circle cx="${centerX}" cy="${centerY}" r="60" fill="#d4a574" stroke="#8b7355" stroke-width="3"/>
    <text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" fill="#2c1810" font-family="serif" font-size="14" font-weight="bold">
      ${truncate(data.mainTopic || data.main_topic || 'Topic', 15)}
    </text>
  `;

  const concepts = Array.isArray(data.keyConcepts) && data.keyConcepts.length
    ? data.keyConcepts
    : Array.isArray(data.key_concepts) ? data.key_concepts : [];

  // Branch nodes
  if (concepts.length) {
    const limited = concepts.slice(0, Math.min(concepts.length, 8));
    const angleStep = (2 * Math.PI) / limited.length;

    limited.forEach((concept, i) => {
      const angle = i * angleStep;
      const branchX = centerX + Math.cos(angle) * 200;
      const branchY = centerY + Math.sin(angle) * 180;

      // Connection line
      svg += `<line x1="${centerX}" y1="${centerY}" x2="${branchX}" y2="${branchY}" stroke="#c9b897" stroke-width="2"/>`;

      // Branch node
      svg += `
        <circle cx="${branchX}" cy="${branchY}" r="40" fill="#f5f0e8" stroke="#8b7355" stroke-width="2"/>
        <text x="${branchX}" y="${branchY - 5}" text-anchor="middle" fill="#4a3228" font-family="serif" font-size="11">
          ${truncate(concept.name, 14)}
        </text>
      `;

      if (concept.summary) {
        svg += `
          <text x="${branchX}" y="${branchY + 12}" text-anchor="middle" fill="#6b5544" font-family="serif" font-size="9">
            ${truncate(concept.summary, 30)}
          </text>
        `;
      }
    });
  }

  svg += '</svg>';

  return svg;
}

function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// Generate flow diagram
async function generateFlowDiagram(conceptsData) {
  const vizArea = document.getElementById('visualization-area');
  const data = conceptsData?.keyConcepts ? conceptsData : normalizeConceptStructure(conceptsData, state.currentMetadata?.title);

  if (!data || !data.keyConcepts || !data.keyConcepts.length) {
    vizArea.innerHTML = '<p>Flow diagram requires structured concepts. Extract concepts first.</p>';
    return;
  }

  const steps = data.keyConcepts.map((concept, index) => `
    <div class="flow-step">
      <div class="flow-step-number">${index + 1}</div>
      <div class="flow-step-body">
        <h5>${escapeHtml(concept.name)}</h5>
        ${concept.summary ? `<p>${escapeHtml(concept.summary)}</p>` : ''}
      </div>
    </div>
  `).join('<div class="flow-connector">➔</div>');

  vizArea.innerHTML = `
    <div class="flow-diagram">
      ${steps}
    </div>
  `;
}

// Generate infographic
async function generateInfographic(conceptsData) {
  // Get current provider settings to show in UI
  const settings = await chrome.storage.sync.get(['provider', 'openRouterImageModel', 'openRouterTextModel']);
  const provider = settings.provider || 'google';
  
  const loadingMessage = provider === 'openrouter' 
    ? `Generating infographic with OpenRouter (${settings.openRouterImageModel || 'default model'})...`
    : `Generating infographic with Google AI...`;
    
  showLoading(loadingMessage);

  try {
    const data = conceptsData?.keyConcepts ? conceptsData : normalizeConceptStructure(conceptsData, state.currentMetadata?.title);
    const keyHighlights = data?.keyConcepts?.slice(0, 4)
      .map(concept => `${concept.name}: ${concept.summary || 'focus on practical application'}`)
      .join(' | ');

    const prompt = `Create a vintage academic infographic summarizing "${state.currentMetadata?.title || 'the core topic'}" with a library-inspired palette.
Focus on these pillars: ${keyHighlights || 'Core ideas, Practical takeaways, Memory aids'}.
Use clean typography, subtle paper textures, and clear headings so learners can review at a glance.

Provider Info: ${provider === 'openrouter' ? 'OpenRouter API - ' + (settings.openRouterImageModel || 'model not set') : 'Google Imagen API'}`;

    console.log('🎨 Infographic Generation:', {
      provider,
      model: provider === 'openrouter' ? settings.openRouterImageModel : 'Google Imagen',
      prompt: prompt?.substring(0, 100) + '...'
    });

    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_VISUAL',
      data: {
        prompt: prompt,
        type: 'infographic'
      }
    });

    if (response.error) {
      console.error('❌ Visual generation error:', response.error);
      throw new Error(response.error);
    }

    console.log('✅ Visual generation response:', {
      success: response.success,
      hasImages: !!response.images,
      imageCount: response.images?.length || 0,
      firstImageType: response.images?.[0]?.startsWith('http') ? 'URL' : response.images?.[0]?.startsWith('data:') ? 'Base64' : 'Unknown'
    });

    const vizArea = document.getElementById('visualization-area');
    if (response.images && response.images.length > 0) {
      vizArea.innerHTML = `<img src="${response.images[0]}" alt="Generated Infographic" style="max-width: 100%; border-radius: 4px;"/>`;
    } else {
      vizArea.innerHTML = `<p>Imagen did not return an image. Please try again in a moment.</p>`;
    }
  } catch (error) {
    const vizArea = document.getElementById('visualization-area');
    vizArea.innerHTML = `<p>Infographic generation requires Imagen API configuration. Error: ${error.message}</p>`;
  }

  hideLoading();
}

// Export visualization
function exportVisualization() {
  const vizArea = document.getElementById('visualization-area');
  const svg = vizArea.querySelector('svg');

  if (svg) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.svg';
    a.click();

    showNotification('Mind map exported!', 'success');
  } else {
    showNotification('No visualization to export', 'error');
  }
}

// Generate quiz
async function generateQuiz() {
  if (!state.currentContent) {
    showNotification('No content loaded', 'error');
    return;
  }

  showLoading('Generating quiz questions...');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'PROCESS_WITH_GEMINI',
      data: {
        content: state.currentContent,
        task: 'quiz'
      }
    });

    hideLoading();

    if (response.error) {
      throw new Error(response.error);
    }

    // Parse and display quiz
    displayQuiz(response.result);

    showNotification('Quiz generated!', 'success');
  } catch (error) {
    hideLoading();
    console.error('Quiz generation error:', error);
    showNotification(error.message, 'error');
  }
}

// Display quiz
function displayQuiz(quizData) {
  const quizContainer = document.getElementById('quiz-container');

  quizContainer.innerHTML = `
    <div class="quiz-content">
      <p class="quiz-intro">Test your understanding with these questions:</p>
      <pre class="quiz-data">${escapeHtml(quizData)}</pre>
      <p class="quiz-note">Interactive quiz UI coming soon!</p>
    </div>
  `;
}

// Library functions
function initializeLibraryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      filterLibraryItems(filter);
    });
  });
}

async function loadLibraryItems() {
  const { library = [] } = await chrome.storage.local.get('library');
  state.libraryItems = library;
  displayLibraryItems(library);
}

function displayLibraryItems(items) {
  const container = document.getElementById('library-items');

  if (items.length === 0) {
    container.innerHTML = `
      <div class="library-empty">
        <p>Your learning library is empty</p>
        <p class="library-empty-sub">Processed materials will appear here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="library-item" data-type="${item.type}">
      <h4>${item.title}</h4>
      <p class="library-item-meta">${item.type} • ${new Date(item.timestamp).toLocaleDateString()}</p>
      <p class="library-item-preview">${truncate(item.content, 100)}</p>
    </div>
  `).join('');
}

function filterLibraryItems(filter) {
  if (filter === 'all') {
    displayLibraryItems(state.libraryItems);
  } else {
    const filtered = state.libraryItems.filter(item => item.type === filter);
    displayLibraryItems(filtered);
  }
}

async function saveToLibrary(item) {
  const { library = [] } = await chrome.storage.local.get('library');
  library.unshift(item); // Add to beginning

  // Keep only last 50 items
  if (library.length > 50) {
    library.length = 50;
  }

  await chrome.storage.local.set({ library });
  state.libraryItems = library;
}

async function updateConceptsCount() {
  const { conceptsLearned = 0 } = await chrome.storage.local.get('conceptsLearned');
  await chrome.storage.local.set({ conceptsLearned: conceptsLearned + 5 }); // Increment by 5 per extraction
}

// Enhanced Loading and Notification System
class NotificationManager {
  constructor() {
    this.activeNotification = null;
    this.loadingOverlay = null;
    this.progressInterval = null;
  }

  showLoading(message, showProgress = false) {
    console.log('=== SHOW LOADING CALLED ===', { message, showProgress });
    
    this.hideLoading(); // Clear any existing loading
    
    const overlay = document.getElementById('loading-overlay');
    console.log('Loading overlay element:', overlay);
    
    if (!overlay) {
      console.error('❌ Loading overlay element not found!');
      // Create fallback overlay
      this.createFallbackOverlay(message, showProgress);
      return;
    }
    
    const text = overlay.querySelector('.loading-text');
    const progressBar = overlay.querySelector('.progress-bar');
    console.log('Loading elements:', { text, progressBar });
    
    // Set content
    if (text) text.textContent = message;
    
    // Configure progress bar
    if (showProgress && progressBar) {
      progressBar.style.display = 'block';
      this.animateProgress(progressBar);
    } else if (progressBar) {
      progressBar.style.display = 'none';
    }
    
    // Force overlay visibility
    this.forceOverlayVisibility(overlay);
    
    console.log('✅ Loading overlay should now be visible');
  }
  
  forceOverlayVisibility(overlay) {
    try {
      // Try CSS class approach
      overlay.classList.add('active');
      
      // Force apply styles directly as backup
      const computedStyle = window.getComputedStyle(overlay);
      console.log('Current overlay display:', computedStyle.display);
      
      // If still not visible, force it
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        console.log('⚠️ Overlay still hidden, forcing visibility...');
        overlay.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(44, 24, 16, 0.85) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 1000 !important;
          backdrop-filter: blur(4px) !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
        
        // Force reflow
        overlay.offsetHeight;
        
        console.log('✅ Overlay forced visible');
      }
      
      this.loadingOverlay = overlay;
    } catch (error) {
      console.error('Error forcing overlay visibility:', error);
    }
  }
  
  createFallbackOverlay(message, showProgress) {
    console.log('Creating fallback overlay...');
    
    const overlay = document.createElement('div');
    overlay.id = 'fallback-loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">${message}</p>
        <div class="progress-container" style="display: ${showProgress ? 'block' : 'none'}">
          <div class="progress-bar" id="fallback-progress-bar"></div>
        </div>
        <p class="loading-subtext">This may take a moment</p>
      </div>
    `;
    
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(44, 24, 16, 0.85) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 10000 !important;
      backdrop-filter: blur(4px) !important;
    `;
    
    // Add content styling
    const content = overlay.querySelector('.loading-content');
    if (content) {
      content.style.cssText = `
        text-align: center;
        color: #f5f0e8;
      `;
    }
    
    // Add spinner styling
    const spinner = overlay.querySelector('.loading-spinner');
    if (spinner) {
      spinner.style.cssText = `
        width: 60px;
        height: 60px;
        border: 4px solid #c9b897;
        border-top-color: #d4a574;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      `;
    }
    
    // Add text styling
    const text = overlay.querySelector('.loading-text');
    if (text) {
      text.style.cssText = `
        font-family: 'Crimson Text', serif;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #d4a574;
      `;
    }
    
    // Add progress styling if showing progress
    if (showProgress) {
      const progressContainer = overlay.querySelector('.progress-container');
      const progressBar = overlay.querySelector('.progress-bar');
      
      if (progressContainer) {
        progressContainer.style.cssText = `
          width: 200px;
          height: 6px;
          background: rgba(44, 24, 16, 0.6);
          border-radius: 3px;
          margin: 12px auto;
          overflow: hidden;
          border: 1px solid rgba(212, 165, 116, 0.3);
        `;
      }
      
      if (progressBar) {
        progressBar.style.cssText = `
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #d4a574, #c9b897);
          border-radius: 3px;
          transition: width 0.1s ease;
          box-shadow: 0 0 8px rgba(212, 165, 116, 0.5);
        `;
        
        // Animate progress
        this.animateProgress(progressBar);
      }
    }
    
    document.body.appendChild(overlay);
    this.loadingOverlay = overlay;
    
    // Add CSS animation if not already present
    if (!document.querySelector('#loading-spinner-animation')) {
      const style = document.createElement('style');
      style.id = 'loading-spinner-animation';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    console.log('✅ Fallback overlay created and visible');
  }

  hideLoading() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    
    // Try to close the main overlay
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      const progressBar = overlay.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.display = 'none';
        progressBar.style.width = '0%';
      }
    }
    
    // Also close fallback overlay if it exists
    const fallbackOverlay = document.getElementById('fallback-loading-overlay');
    if (fallbackOverlay) {
      fallbackOverlay.remove();
    }
    
    this.loadingOverlay = null;
    console.log('✅ Loading overlays hidden');
  }

  showNotification(message, type = 'info', duration = 5000, actions = null) {
    // Remove existing notification
    if (this.activeNotification) {
      this.activeNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Create notification content
    const content = document.createElement('div');
    content.className = 'notification-content';
    content.textContent = message;
    
    // Add action buttons if provided
    let buttonContainer = null;
    if (actions && actions.length > 0) {
      buttonContainer = document.createElement('div');
      buttonContainer.className = 'notification-actions';
      
      actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'notification-action-btn';
        button.textContent = action.text;
        button.onclick = action.handler;
        buttonContainer.appendChild(button);
      });
    }

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.hideNotification();

    // Assemble notification
    notification.appendChild(content);
    if (buttonContainer) notification.appendChild(buttonContainer);
    notification.appendChild(closeBtn);

    // Style the notification
    const colors = {
      error: { bg: '#8b4545', border: '#6b3434' },
      success: { bg: '#6b8b45', border: '#5a7a3a' },
      warning: { bg: '#b8860b', border: '#9a7409' },
      info: { bg: '#8b7355', border: '#6b5a44' }
    };
    
    const color = colors[type] || colors.info;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color.bg};
      color: #f5f0e8;
      padding: 16px 20px;
      border-radius: 8px;
      border: 2px solid ${color.border};
      box-shadow: 0 6px 20px rgba(0,0,0,0.4);
      font-family: 'Georgia', serif;
      font-size: 14px;
      z-index: 10000;
      max-width: 350px;
      min-width: 250px;
      animation: slideIn 0.3s ease-out;
      position: relative;
    `;

    // Add action button styles if present
    if (buttonContainer) {
      buttonContainer.style.cssText = `
        margin-top: 12px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      `;
      
      const buttons = buttonContainer.querySelectorAll('.notification-action-btn');
      buttons.forEach(btn => {
        btn.style.cssText = `
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        `;
        btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.3)';
        btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.2)';
      });
    }

    // Style close button
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #f5f0e8;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';

    document.body.appendChild(notification);
    this.activeNotification = notification;

    // Auto-hide after duration
    setTimeout(() => this.hideNotification(), duration);
  }

  hideNotification() {
    if (this.activeNotification) {
      this.activeNotification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (this.activeNotification) {
          this.activeNotification.remove();
          this.activeNotification = null;
        }
      }, 300);
    }
  }

  animateProgress(progressBar) {
    let width = 0;
    const maxProgress = 90; // Stop at 90% to indicate ongoing process
    const increment = 2;
    
    this.progressInterval = setInterval(() => {
      if (width < maxProgress) {
        width += increment;
        progressBar.style.width = `${width}%`;
      } else {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
    }, 100);
  }

  showRetryMessage(originalError, retryCallback) {
    this.showNotification(
      `Processing failed: ${originalError}`,
      'error',
      0, // Don't auto-hide
      [
        {
          text: 'Retry',
          handler: () => {
            this.hideNotification();
            retryCallback();
          }
        },
        {
          text: 'Dismiss',
          handler: () => this.hideNotification()
        }
      ]
    );
  }
}

// Create global notification manager instance
const notificationManager = new NotificationManager();

// Legacy compatibility functions
function showLoading(message, showProgress = false) {
  notificationManager.showLoading(message, showProgress);
}

function hideLoading() {
  notificationManager.hideLoading();
}

function showNotification(message, type = 'info', duration, actions) {
  notificationManager.showNotification(message, type, duration, actions);
}

// Add required CSS animations
const notificationStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
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
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;

// Inject styles if not already present
if (!document.querySelector('#notification-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'notification-styles';
  styleSheet.textContent = notificationStyles;
  document.head.appendChild(styleSheet);
}

// Enhanced Real-Time Learning Functions

// Load user profile for contextual assistance
async function loadUserProfile() {
  try {
    const data = await chrome.storage.sync.get(['userProfile', 'realTimeLearningEnabled']);
    state.userProfile = data.userProfile || { expertise: 'intermediate', topics: [], learningGoals: [] };
    state.realTimeLearningEnabled = data.realTimeLearningEnabled || false;
    
    if (state.realTimeLearningEnabled) {
      state.learningSession.startTime = Date.now();
      console.log('Real-time learning session started');
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Initialize real-time features
function initializeRealTimeFeatures() {
  // Listen for real-time updates from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CONTEXTUAL_SUGGESTIONS_UPDATE') {
      updateContextualSuggestions(request.suggestions);
    } else if (request.type === 'QUICK_CLARIFICATION_RESULT') {
      displayQuickClarification(request.clarification);
    } else if (request.type === 'REALTIME_STATUS_CHANGE') {
      updateRealTimeStatus(request.enabled);
    }
  });

  // Add real-time toggle to process tab
  addRealTimeControls();
  
  // Check for stored contextual suggestions
  loadStoredSuggestions();
}

// Add real-time learning controls to the process tab
function addRealTimeControls() {
  const processTab = document.getElementById('tab-process');
  if (!processTab) return;

  // Find a good place to insert the real-time controls
  const actionButtons = processTab.querySelector('.action-buttons');
  if (!actionButtons) return;

  // Create real-time control section
  const realtimeSection = document.createElement('div');
  realtimeSection.className = 'realtime-controls';
  realtimeSection.innerHTML = `
    <div class="realtime-header">
      <h3 class="realtime-title">
        <span>⚡</span>
        Real-Time Learning Assistant
      </h3>
      <div class="realtime-status">
        <span class="status-indicator ${state.realTimeLearningEnabled ? 'status-active' : 'status-inactive'}"></span>
        <span class="status-text">${state.realTimeLearningEnabled ? 'Active' : 'Paused'}</span>
      </div>
    </div>
    <div class="realtime-controls-row">
      <button class="realtime-toggle-btn ${state.realTimeLearningEnabled ? 'active' : ''}" id="btn-realtime-toggle">
        <span class="btn-icon">${state.realTimeLearningEnabled ? '⏸️' : '▶️'}</span>
        <span class="btn-text">${state.realTimeLearningEnabled ? 'Pause Assistant' : 'Start Assistant'}</span>
      </button>
      <button class="quick-clarify-btn" id="btn-quick-clarify">
        <span class="btn-icon">💡</span>
        <span class="btn-text">Quick Question</span>
      </button>
      <button class="profile-settings-btn" id="btn-profile-settings">
        <span class="btn-icon">⚙️</span>
        <span class="btn-text">My Profile</span>
      </button>
    </div>
    <div class="contextual-suggestions" id="contextual-suggestions" style="display: none;">
      <h4 class="suggestions-title">💭 Contextual Insights</h4>
      <div class="suggestions-list" id="suggestions-list"></div>
    </div>
  `;

  // Insert before the existing action buttons
  actionButtons.parentNode.insertBefore(realtimeSection, actionButtons);

  // Add event listeners
  document.getElementById('btn-realtime-toggle').addEventListener('click', toggleRealTimeLearning);
  document.getElementById('btn-quick-clarify').addEventListener('click', openQuickClarify);
  document.getElementById('btn-profile-settings').addEventListener('click', openProfileSettings);
}

// Toggle real-time learning
async function toggleRealTimeLearning() {
  const enabled = !state.realTimeLearningEnabled;
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'REALTIME_TOGGLE',
      data: { enabled }
    });

    if (response.success) {
      state.realTimeLearningEnabled = enabled;
      updateRealTimeStatus(enabled);
      
      if (enabled) {
        state.learningSession.startTime = Date.now();
        showNotification('🧠 Real-Time Assistant activated! I\'ll provide insights as you browse.', 'success');
      } else {
        showNotification('Real-Time Assistant paused', 'info');
      }
    }
  } catch (error) {
    console.error('Error toggling real-time learning:', error);
    showNotification('Failed to toggle real-time learning', 'error');
  }
}

// Open quick clarify interface
async function openQuickClarify() {
  const question = prompt('What would you like clarified right now? (e.g., "Explain this concept" or "What does this mean?")');
  
  if (question && question.trim()) {
    try {
      showLoading('Getting clarification...', true);
      
      const response = await chrome.runtime.sendMessage({
        type: 'QUICK_CLARIFY',
        data: {
          question: question.trim(),
          url: state.currentMetadata?.url || window.location.href
        }
      });

      hideLoading();

      if (response.success) {
        showNotification('✅ Answer ready! Check below for clarification.', 'success');
        // The clarification will be displayed via callback
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      hideLoading();
      console.error('Quick clarify error:', error);
      showNotification('Failed to get clarification: ' + error.message, 'error');
    }
  }
}

// Open profile settings
async function openProfileSettings() {
  const modal = document.createElement('div');
  modal.className = 'profile-modal';
  modal.innerHTML = `
    <div class="profile-modal-content">
      <div class="profile-modal-header">
        <h3>⚙️ Your Learning Profile</h3>
        <button class="close-modal" id="close-profile-modal">×</button>
      </div>
      <div class="profile-modal-body">
        <div class="profile-section">
          <label>Expertise Level</label>
          <select id="expertise-level">
            <option value="beginner" ${state.userProfile.expertise === 'beginner' ? 'selected' : ''}>Beginner</option>
            <option value="intermediate" ${state.userProfile.expertise === 'intermediate' ? 'selected' : ''}>Intermediate</option>
            <option value="advanced" ${state.userProfile.expertise === 'advanced' ? 'selected' : ''}>Advanced</option>
            <option value="expert" ${state.userProfile.expertise === 'expert' ? 'selected' : ''}>Expert</option>
          </select>
        </div>
        <div class="profile-section">
          <label>Topics of Interest</label>
          <input type="text" id="topics-input" placeholder="e.g., programming, biology, history"
                 value="${state.userProfile.topics.join(', ')}">
          <small>Separate topics with commas</small>
        </div>
        <div class="profile-section">
          <label>Learning Goals</label>
          <textarea id="goals-input" placeholder="What do you want to learn?" rows="3">${state.userProfile.learningGoals.join('\n')}</textarea>
        </div>
        <div class="profile-section">
          <label>Preferred Complexity</label>
          <select id="complexity-level">
            <option value="simple" ${state.userProfile.preferredComplexity === 'simple' ? 'selected' : ''}>Simple & Clear</option>
            <option value="moderate" ${state.userProfile.preferredComplexity === 'moderate' ? 'selected' : ''}>Moderate Detail</option>
            <option value="advanced" ${state.userProfile.preferredComplexity === 'advanced' ? 'selected' : ''}>Advanced Detail</option>
          </select>
        </div>
      </div>
      <div class="profile-modal-footer">
        <button class="save-profile-btn" id="save-profile-btn">Save Profile</button>
        <button class="cancel-btn" id="cancel-profile-btn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal function
  const closeModal = () => {
    modal.classList.remove('modal-visible');
    setTimeout(() => modal.remove(), 300);
  };

  // Add event listeners
  document.getElementById('close-profile-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-profile-btn').addEventListener('click', closeModal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Save profile button
  document.getElementById('save-profile-btn').addEventListener('click', async () => {
    try {
      const expertise = document.getElementById('expertise-level').value;
      const topicsText = document.getElementById('topics-input').value;
      const goalsText = document.getElementById('goals-input').value;
      const complexity = document.getElementById('complexity-level').value;

      const profile = {
        expertise,
        topics: topicsText.split(',').map(t => t.trim()).filter(t => t),
        learningGoals: goalsText.split('\n').map(g => g.trim()).filter(g => g),
        preferredComplexity: complexity
      };

      console.log('Saving profile:', profile);

      const response = await chrome.runtime.sendMessage({
        type: 'USER_PROFILE_UPDATE',
        data: { profile }
      });

      if (response.success) {
        state.userProfile = response.profile;
        closeModal();
        showNotification('✅ Profile updated successfully!', 'success');
      } else {
        throw new Error(response.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to save profile: ' + error.message, 'error');
    }
  });

  setTimeout(() => modal.classList.add('modal-visible'), 10);
}

// Update contextual suggestions display
function updateContextualSuggestions(suggestions) {
  state.contextualSuggestions = suggestions;
  displayContextualSuggestions();
}

// Display contextual suggestions in sidepanel
function displayContextualSuggestions() {
  const container = document.getElementById('contextual-suggestions');
  const list = document.getElementById('suggestions-list');
  
  if (!container || !list) return;

  if (state.contextualSuggestions.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  list.innerHTML = state.contextualSuggestions.map(suggestion => `
    <div class="suggestion-item ${suggestion.priority}">
      <div class="suggestion-type">${getSuggestionIcon(suggestion.type)} ${suggestion.type}</div>
      <div class="suggestion-content">${suggestion.content}</div>
      <button class="suggestion-action" onclick="exploreSuggestion('${encodeURIComponent(JSON.stringify(suggestion))}')">
        Explore →
      </button>
    </div>
  `).join('');
}

// Get suggestion icon based on type
function getSuggestionIcon(type) {
  const icons = {
    concept: '💡',
    connection: '🔗',
    question: '❓',
    application: '⚡',
    exploration: '🔍'
  };
  return icons[type] || '💭';
}

// Explore suggestion (make global)
window.exploreSuggestion = async (encodedSuggestion) => {
  try {
    const suggestion = JSON.parse(decodeURIComponent(encodedSuggestion));
    
    // Create content for processing based on suggestion type
    let task = '';
    switch (suggestion.type) {
      case 'concept':
        task = 'concepts';
        break;
      case 'connection':
        task = 'patterns';
        break;
      case 'question':
        task = 'simplify';
        break;
      case 'application':
        task = 'patterns';
        break;
      case 'exploration':
        task = 'summarize';
        break;
      default:
        task = 'summarize';
    }

    await processContent(task, 'Exploring: ' + suggestion.content);
  } catch (error) {
    console.error('Error exploring suggestion:', error);
    showNotification('Failed to explore suggestion', 'error');
  }
};

// Check for quick clarifications on load
async function checkForQuickClarifications() {
  try {
    const data = await chrome.storage.local.get(['quickClarification']);
    if (data.quickClarification) {
      displayQuickClarification(data.quickClarification);
      // Clear after displaying
      await chrome.storage.local.remove('quickClarification');
    }
  } catch (error) {
    console.error('Error checking clarifications:', error);
  }
}

// Display quick clarification result
function displayQuickClarification(clarification) {
  const resultContainer = document.getElementById('process-result');
  if (!resultContainer) return;

  state.quickClarifications.unshift(clarification);
  if (state.quickClarifications.length > 5) {
    state.quickClarifications = state.quickClarifications.slice(0, 5);
  }

  const clarificationHTML = `
    <div class="clarification-result">
      <div class="clarification-header">
        <h3 class="clarification-title">💬 Quick Clarification</h3>
        <div class="clarification-meta">
          <span class="question">Q: ${clarification.question}</span>
          <span class="timestamp">${new Date(clarification.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
      <div class="clarification-body">
        <div class="clarification-answer">${formatMarkdown(clarification.answer)}</div>
      </div>
      <div class="clarification-actions">
        <button class="action-btn secondary" onclick="askFollowUpQuestion()">
          <span>🔄</span> Follow Up
        </button>
        <button class="action-btn secondary" onclick="copyToClipboard('clarification')">
          <span>📋</span> Copy
        </button>
      </div>
    </div>
  `;

  resultContainer.innerHTML = clarificationHTML;
  
  // Switch to process tab if not already there
  if (state.currentTab !== 'process') {
    switchTab('process');
  }

  state.learningSession.questionsAsked++;
}

// Ask follow-up question (make global)
window.askFollowUpQuestion = async () => {
  const lastClarification = state.quickClarifications[0];
  if (!lastClarification) return;

  const followUp = prompt('Ask a follow-up question (optional):');
  if (followUp && followUp.trim()) {
    await openQuickClarify();
    // Append follow-up context to next question
  }
};

// Load stored suggestions
async function loadStoredSuggestions() {
  try {
    const data = await chrome.storage.local.get(['contextualSuggestions']);
    if (data.contextualSuggestions && Array.isArray(data.contextualSuggestions)) {
      state.contextualSuggestions = data.contextualSuggestions;
      displayContextualSuggestions();
    }
  } catch (error) {
    console.error('Error loading stored suggestions:', error);
  }
}

// Update real-time status display
function updateRealTimeStatus(enabled) {
  const statusText = document.querySelector('.status-text');
  const statusIndicator = document.querySelector('.status-indicator');
  const toggleBtn = document.getElementById('btn-realtime-toggle');
  
  if (statusText) statusText.textContent = enabled ? 'Active' : 'Paused';
  if (statusIndicator) {
    statusIndicator.className = `status-indicator ${enabled ? 'status-active' : 'status-inactive'}`;
  }
  if (toggleBtn) {
    toggleBtn.className = `realtime-toggle-btn ${enabled ? 'active' : ''}`;
    const icon = toggleBtn.querySelector('.btn-icon');
    const text = toggleBtn.querySelector('.btn-text');
    if (icon) icon.textContent = enabled ? '⏸️' : '▶️';
    if (text) text.textContent = enabled ? 'Pause Assistant' : 'Start Assistant';
  }
}

// Copy to clipboard (enhanced for clarifications)
window.copyToClipboard = function(task) {
  let text = '';
  
  if (task === 'clarification') {
    const clarification = state.quickClarifications[0];
    if (clarification) {
      text = `Q: ${clarification.question}\n\nA: ${clarification.answer}`;
    }
  } else {
    text = state.processedResults[task];
  }
  
  if (text) {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  }
};
