// Background Service Worker - AI Learning Accelerator
// Handles API orchestration, message routing, and state management

console.log('AI Learning Accelerator - Service Worker Initialized');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed - Opening options page');
    chrome.runtime.openOptionsPage();
  }
});

// Enhanced Message Handler for Real-Time Learning Assistant
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Enhanced message received:', request.type);

  switch (request.type) {
    case 'EXTRACT_CONTENT':
      handleContentExtraction(request.data, sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Indicates async response

    case 'PROCESS_WITH_GEMINI':
      handleGeminiProcessing(request.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'GENERATE_VISUAL':
      handleVisualGeneration(request.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'AGGREGATE_SOURCES':
      handleMultiSourceAggregation(request.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    // NEW: Real-Time Learning Features
    case 'CONTEXT_ANALYSIS':
      handleContextAnalysis(request.data, sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'QUICK_CLARIFY':
      handleQuickClarify(request.data, sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'REALTIME_TOGGLE':
      handleRealTimeToggle(request.data, sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'USER_PROFILE_UPDATE':
      handleUserProfileUpdate(request.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'LEARNING_SUGGESTIONS':
      handleLearningSuggestions(request.data, sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'OPEN_SIDEPANEL':
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
      sendResponse({ success: true });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

async function getProviderSettings() {
  const settings = await chrome.storage.sync.get([
    'provider',
    'apiKey',
    'geminiModel',
    'imagenApiKey',
    'openRouterKey',
    'openRouterTextModel',
    'openRouterImageModel'
  ]);

  return {
    provider: settings.provider || 'google',
    apiKey: settings.apiKey,
    geminiModel: settings.geminiModel || 'gemini-1.5-flash',
    imagenApiKey: settings.imagenApiKey,
    openRouterKey: settings.openRouterKey,
    openRouterTextModel: settings.openRouterTextModel || 'anthropic/claude-3.5-sonnet',
    openRouterImageModel: settings.openRouterImageModel || ''
  };
}

async function callTextGeneration({ prompt, systemPrompt = '', temperature = 0.7, maxTokens = 2048, topK = 40, topP = 0.95, taskName = 'general', requestId }) {
  const settings = await getProviderSettings();

  console.log('Dispatching text generation request', {
    provider: settings.provider,
    taskName,
    requestId
  });

  const mergedSystemPrompt = systemPrompt || buildSystemPrompt(taskName, settings.provider);

  if (settings.provider === 'openrouter') {
    return await callOpenRouterChat({
      prompt,
      systemPrompt: mergedSystemPrompt,
      temperature,
      maxTokens,
      model: settings.openRouterTextModel || 'anthropic/claude-3.5-sonnet',
      apiKey: settings.openRouterKey,
      taskName,
      requestId
    });
  }

  return await callGoogleGenerateContent({
    prompt,
    systemPrompt: mergedSystemPrompt,
    temperature,
    maxTokens,
    topK,
    topP,
    model: settings.geminiModel || 'gemini-1.5-flash',
    apiKey: settings.apiKey,
    taskName,
    requestId
  });
}

function buildSystemPrompt(taskName, provider) {
  const base = `You are Learn with DeepMind, a vintage-inspired study companion that transforms dense technical material into elegant, memorable insights. Always respond with warmth, clarity, and structure that helps learners see patterns quickly.`;

  const taskDirectives = {
    summarize: 'Deliver a graceful summary that highlights 3–5 anchors, clarifies relationships, and ends with a motivating next action.',
    concepts: 'Extract a well-organized hierarchy of concepts with succinct summaries, memory hooks, and practical action steps for each point.',
    simplify: 'Rephrase the material with friendly language while preserving technical accuracy and adding relatable analogies.',
    patterns: 'Spot reusable learning patterns or frameworks and explain how the learner can reuse them elsewhere.',
    quiz: 'Author exam-ready questions that test application, not recall, and provide concise rationales for each correct answer.',
    aggregation: 'Generate research leads: each entry needs a unique insight, targeted search phrases, and a concrete next action.',
    'context-analysis': 'Surface real-time insights that keep the learner focused: emphasize key ideas, comprehension checks, and practical next steps.',
    'quick-clarify': 'Respond as a supportive mentor: give a direct answer, a memorable insight, and a link back to the broader study goal.',
    'learning-suggestions': 'Propose diverse, achievable activities that align with the learner’s stated goals and expertise level.'
  };

  const providerNote = provider === 'openrouter'
    ? 'The response should avoid provider-specific formatting quirks and remain model-agnostic so it feels consistent across engines.'
    : 'Keep the tone cohesive with enlightened academic prose and stay within safe, policy-compliant boundaries.';

  return [base, taskDirectives[taskName] || '', providerNote].filter(Boolean).join(' ');
}

async function callGoogleGenerateContent({ prompt, systemPrompt, temperature, maxTokens, topK, topP, model, apiKey, taskName, requestId }) {
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set it in options.');
  }

  const combinedPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const maxRetries = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Learn-with-DeepMind/${taskName || 'general'}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: combinedPrompt
            }]
          }],
          generationConfig: {
            temperature,
            topK,
            topP,
            maxOutputTokens: maxTokens,
            candidateCount: 1
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }),
        signal: AbortSignal.timeout(60000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini API error (${response.status}): ${errorText || response.statusText}`);
        if (response.status >= 500 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw lastError;
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];
      const generatedText = candidate?.content?.parts?.[0]?.text || '';

      if (!generatedText.trim()) {
        throw new Error('Empty response received from Gemini API.');
      }

      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Content was filtered for safety. Please try with different content.');
      }

      if (candidate.finishReason === 'MAX_TOKENS') {
        throw new Error('Response too long. Please try with shorter content.');
      }

      return generatedText;
    } catch (error) {
      lastError = error;
      console.error(`Gemini call attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw lastError;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError || new Error('Gemini request failed.');
}

async function callOpenRouterChat({ prompt, systemPrompt, temperature, maxTokens, model, apiKey, taskName, requestId }) {
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please set it in options.');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Title': 'Learn with DeepMind Extension',
      'HTTP-Referer': 'https://learnwithdeepmind.extension'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();
  console.log('OpenRouter response received', {
    taskName,
    requestId,
    model
  });

  if (result.error) {
    throw new Error(result.error?.message || 'OpenRouter returned an error response.');
  }

  const message = result.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error('Empty response received from OpenRouter.');
  }

  if (Array.isArray(message)) {
    return message.map(part => (typeof part === 'string' ? part : part?.text || '')).join('\n').trim();
  }

  return message.toString().trim();
}

// Content Extraction Handler
async function handleContentExtraction(data, tabId) {
  try {
    const { content, metadata, contentType, url, autoProcess } = data;

    const metadataToStore = metadata || {
      title: 'Untitled Content',
      url,
      type: contentType || 'webpage',
      timestamp: new Date().toISOString()
    };

    // Store current content and metadata for sidepanel
    await chrome.storage.local.set({
      currentContent: content,
      currentMetadata: metadataToStore,
      lastProcessed: Date.now()
    });

    // Update local stats snapshot
    const existingStats = await chrome.storage.local.get(['materialsProcessed', 'library', 'conceptsLearned']);
    const materialsProcessed = existingStats.materialsProcessed || 0;
    await chrome.storage.local.set({ materialsProcessed: materialsProcessed + 1 });

    let autoProcessPayload = null;

    if (autoProcess) {
      try {
        const processed = await handleGeminiProcessing({
          content,
          task: autoProcess
        });

        const libraryEntry = {
          type: autoProcess,
          title: metadataToStore.title || 'Untitled',
          content: processed.result,
          source: metadataToStore.url || url,
          timestamp: Date.now()
        };

        const library = Array.isArray(existingStats.library)
          ? [...existingStats.library, libraryEntry]
          : [libraryEntry];

        const storageUpdates = {
          library,
          lastAutoProcess: {
            task: autoProcess,
            result: processed.result,
            title: metadataToStore.title || 'Untitled',
            url: metadataToStore.url || url,
            timestamp: Date.now(),
            success: true
          }
        };

        if (autoProcess === 'concepts') {
          const conceptsLearned = existingStats.conceptsLearned || 0;
          storageUpdates.conceptsLearned = conceptsLearned + 1;
        }

        await chrome.storage.local.set(storageUpdates);

        autoProcessPayload = {
          success: true,
          task: autoProcess,
          result: processed.result
        };
      } catch (error) {
        console.error('Auto process error:', error);
        await chrome.storage.local.set({
          lastAutoProcess: {
            task: autoProcess,
            error: error.message,
            timestamp: Date.now(),
            success: false
          }
        });

        autoProcessPayload = {
          success: false,
          task: autoProcess,
          error: error.message
        };
      }
    } else {
      await chrome.storage.local.remove('lastAutoProcess');
    }

    console.log('Content extracted and stored successfully:', {
      contentLength: content?.length || 0,
      contentType,
      url,
      autoProcess
    });

    return {
      success: true,
      message: 'Content extraction completed',
      autoProcess: autoProcessPayload
    };
  } catch (error) {
    console.error('Content extraction error:', error);
    throw new Error(`Content extraction failed: ${error.message}`);
  }
}

// Enhanced Gemini API Processing Handler with Error Handling & Retry
async function handleGeminiProcessing(data) {
  const { content, task } = data;

  if (!content || content.trim().length === 0) {
    throw new Error('No content provided for processing');
  }

  if (!task) {
    throw new Error('No processing task specified');
  }

  console.log('Starting model processing:', { task, contentLength: content.length });

  const prompt = createPrompt(task, content);
  const result = await callTextGeneration({
    prompt,
    temperature: 0.7,
    maxTokens: 2048,
    taskName: task
  });

  const normalizedResult = typeof result === 'string' ? result.trim() : result;

  console.log('Processing successful:', { task, responseLength: normalizedResult?.length || 0 });

  return { success: true, result: normalizedResult };
}

// Visual Generation Handler (Imagen API)
async function handleVisualGeneration(data) {
  const settings = await getProviderSettings();

  if (settings.provider === 'openrouter') {
    return await generateImageWithOpenRouter(data, settings);
  }

  return await generateImageWithImagen(data, settings);
}

async function generateImageWithImagen(data, settings) {
  try {
    const { imagenApiKey } = settings;

    if (!imagenApiKey) {
      throw new Error('Imagen API key not configured. Please set it in options.');
    }

    const { prompt } = data;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-2:generateImage?key=${imagenApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${prompt}. Style: vintage educational illustration, old-school textbook style, retro academic design`,
        numberOfImages: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Imagen API error: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, images: result.images };
  } catch (error) {
    throw new Error(`Visual generation failed: ${error.message}`);
  }
}

async function generateImageWithOpenRouter(data, settings) {
  const { openRouterKey, openRouterImageModel } = settings;

  if (!openRouterKey) {
    console.error('❌ OpenRouter API KEYS NOT CONFIGURED!');
    throw new Error('OpenRouter API key not configured. Please set it in options. User selected OpenRouter provider but no key found.');
  }

  if (!openRouterImageModel) {
    console.error('❌ OpenRouter IMAGE MODEL NOT CONFIGURED!');
    throw new Error('OpenRouter image model not configured! Please go to Settings → OpenRouter → Select an image model before generating visuals.');
  }
  
  console.log('✅ OpenRouter Configuration Valid:', {
    hasKey: !!openRouterKey,
    hasImageModel: !!openRouterImageModel,
    model: openRouterImageModel
  });

  const { prompt } = data;
  console.log('🎨 OpenRouter Image Generation Started:', { model: openRouterImageModel, prompt: prompt?.substring(0, 100) + '...' });


  try {
    // Try the standard OpenRouter images endpoint first
    let response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'X-Title': 'Learn with DeepMind Extension',
        'HTTP-Referer': 'https://learnwithdeepmind.extension'
      },
      body: JSON.stringify({
        model: openRouterImageModel,
        prompt: `${prompt}. Style: vintage educational illustration, old-school textbook style, retro academic design, clean typography, subtle paper textures`,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      })
    });

    console.log('🎨 OpenRouter API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error Details:', errorText);
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('🎨 OpenRouter API Response:', { dataLength: result?.data?.length || 0, hasData: !!result?.data });

    // Handle different response formats
    if (result?.data && result.data.length > 0) {
      const imageData = result.data[0];
      
      // If URL is provided directly
      if (imageData.url) {
        console.log('✅ OpenRouter image URL generated:', imageData.url);
        return { success: true, images: [imageData.url] };
      }
      
      // If base64 image is provided
      if (imageData.b64_json) {
        console.log('✅ OpenRouter base64 image generated');
        const dataUrl = `data:image/png;base64,${imageData.b64_json}`;
        return { success: true, images: [dataUrl] };
      }
      
      // If image object with different structure
      if (imageData.image && typeof imageData.image === 'string') {
        if (imageData.image.startsWith('data:image/') || imageData.image.startsWith('http')) {
          console.log('✅ OpenRouter image object generated');
          return { success: true, images: [imageData.image] };
        }
      }
    }

    console.error('❌ OpenRouter response structure:', result);
    throw new Error('OpenRouter image generation returned no usable image data. Response structure might have changed.');
    
  } catch (error) {
    console.error('🎨 OpenRouter image generation error:', error);
    throw new Error(`OpenRouter image generation failed: ${error.message}`);
  }
}

// Multi-Source Aggregation Handler
async function handleMultiSourceAggregation(data) {
  try {
    const { topic, currentContent } = data;
    const conceptsPrompt = `You are a research librarian helping a learner deepen their understanding of the following material.

CONTENT SUMMARY:
${optimizeContentForPrompt(currentContent).slice(0, 4000)}

Identify the 3-5 most leverageable concepts to research next.

Return STRICT JSON (no markdown, no comments) as an array where each item looks like:
{
  "concept": "Concept title",
  "uniqueInsight": "Why this concept matters right now",
  "searchPhrases": ["keyword 1", "keyword 2"],
  "actionStep": "Specific action the learner should take"
}`;

    const rawText = await callTextGeneration({
      prompt: conceptsPrompt,
      temperature: 0.6,
      maxTokens: 800,
      taskName: 'aggregation'
    });

    const keyConcepts = normalizeAggregationConcepts(rawText);

    return {
      success: true,
      keyConcepts,
      message: keyConcepts.length
        ? 'Multi-source aggregation completed. Review these research leads.'
        : 'Aggregation completed. Try refining the content for better leads.'
    };
  } catch (error) {
    throw new Error(`Multi-source aggregation failed: ${error.message}`);
  }
}

// Enhanced Prompt Creator with Content Optimization
function createPrompt(task, content) {
  // Handle content length and quality issues
  const processedContent = optimizeContentForPrompt(content);
  
  const prompts = {
    summarize: `You are an expert learning accelerator. Analyze this educational content and create a comprehensive yet concise summary.

IMPORTANT REQUIREMENTS:
1. Extract the 3-5 most important concepts
2. Use clear, accessible language (avoid jargon)
3. Structure information for maximum retention
4. Include key relationships between ideas
5. Keep summary under 300 words for optimal learning

CONTENT TO ANALYZE:
${processedContent}

FORMAT YOUR RESPONSE:
## Main Topic
[Brief one-sentence description]

## Key Concepts
- **Concept 1**: [Clear explanation]
- **Concept 2**: [Clear explanation]
- **Concept 3**: [Clear explanation]

## Important Relationships
[Explain how the concepts connect]

## Takeaway
[Brief, memorable conclusion]`,

    concepts: `You are an expert learning accelerator. Extract and organize concepts for a mind map visualization.

REQUIREMENTS:
1. Identify 3-7 main concepts (not too many!)
2. Group related sub-concepts logically
3. Show clear relationships between concepts
4. Use simple, memorable names
5. Ensure hierarchical structure makes sense
6. Include a short, professional summary and practical action step for each concept

CONTENT TO ANALYZE:
${processedContent}

RETURN ONLY VALID JSON in this exact format:
{
  "main_topic": "Clear, concise main topic",
  "main_topic_summary": "One sentence context for the topic",
  "key_concepts": [
    {
      "name": "Concept Name",
      "summary": "One-sentence explanation that is clear and professional",
      "subconcepts": [
        {
          "title": "Sub-concept 1",
          "insight": "Quick insight learners should know"
        }
      ],
      "connections": ["Related concept 1", "Related concept 2"],
      "memory_hook": "Short mnemonic or visual cue",
      "action_step": "Practical next step to apply this concept"
    }
  ]
}`,

    quiz: `You are an expert learning accelerator. Create a meaningful quiz to test understanding.

REQUIREMENTS:
1. Create 5 multiple-choice questions
2. Each question should test application, not just memorization
3. Include 4 clear options (A, B, C, D)
4. Mark correct answer with ✓
5. Provide brief explanations for learning

CONTENT BASE FOR QUIZ:
${processedContent}

RETURN ONLY VALID JSON:
[
  {
    "question": "Clear question text",
    "options": {
      "A": "Option A",
      "B": "Option B", 
      "C": "Option C ✓",
      "D": "Option D"
    },
    "explanation": "Brief explanation of why this is correct"
  }
]`,

    simplify: `You are an expert learning accelerator. Simplify this content for optimal learning.

REQUIREMENTS:
1. Use simple, everyday language (grade 8-10 level)
2. Break complex ideas into smaller steps
3. Use helpful analogies and examples
4. Maintain accuracy while improving clarity
5. Remove unnecessary jargon and complexity
6. Keep paragraphs short (2-3 sentences max)

ORIGINAL CONTENT:
${processedContent}

SIMPLIFIED VERSION:
[Start writing your simplified version here]`,

    patterns: `You are an expert learning accelerator. Identify learning patterns and frameworks.

REQUIREMENTS:
1. Find 2-3 key patterns or mental models
2. Explain each pattern simply
3. Show practical applications
4. Include memory aids or mnemonics
5. Connect to real-world examples

CONTENT TO ANALYZE:
${processedContent}

FOR EACH PATTERN:
## Pattern Name
**How it works**: [Simple explanation]
**Why it matters**: [Practical importance]
**Memory aid**: [Easy way to remember]
**Example**: [Real-world application]`
  };

  return prompts[task] || `Please analyze this content for learning: ${processedContent}`;
}

// Content optimization for better AI processing
function optimizeContentForPrompt(content) {
  if (!content || typeof content !== 'string') {
    return 'No content available for analysis.';
  }

  // Remove excessive whitespace
  let optimized = content.replace(/\s+/g, ' ').trim();
  
  // Limit content length for API token limits (keep it reasonable)
  if (optimized.length > 8000) {
    optimized = optimized.substring(0, 8000) + '... [content truncated for processing]';
  }
  
  // Ensure minimum content
  if (optimized.length < 100) {
    return optimized + ' [Note: Limited content available for analysis]';
  }
  
  return optimized;
}

// Enhanced Real-Time Learning Handler Functions

// Context Analysis for Real-Time Learning
async function handleContextAnalysis(data, tabId) {
  try {
    const { content, url, scrollPosition, userProfile } = data;
    
    console.log('Starting context analysis for real-time learning');

    // Create contextual analysis prompt
    const contextualPrompt = createContextualPrompt(content, userProfile, scrollPosition);

    const contextualInsights = await callTextGeneration({
      prompt: contextualPrompt,
      temperature: 0.55,
      maxTokens: 700,
      taskName: 'context-analysis'
    });

    // Parse and store suggestions
    const suggestions = parseContextualSuggestions(contextualInsights);

    // Send suggestions to content script
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'UPDATE_SUGGESTIONS',
        suggestions: suggestions
      });
    } catch (error) {
      console.log('Content script not available, storing suggestions');
      await chrome.storage.local.set({
        contextualSuggestions: suggestions,
        lastContextAnalysis: Date.now()
      });
    }

    return { 
      success: true, 
      insights: contextualInsights,
      suggestions: suggestions,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Context analysis error:', error);
    throw new Error(`Context analysis failed: ${error.message}`);
  }
}

// Quick Clarify Handler
async function handleQuickClarify(data, tabId) {
  try {
    const { question, url } = data;
    
    // Get current content context
    const { currentContent, currentMetadata } = await chrome.storage.local.get(['currentContent', 'currentMetadata']);
    
    if (!currentContent) {
      throw new Error('No content available for clarification');
    }

    // Get user profile for contextual responses
    const { userProfile } = await chrome.storage.sync.get(['userProfile']);

    // Create context-aware clarification prompt
    const clarificationPrompt = `
You are an expert learning assistant providing quick clarifications. Analyze this context and answer the user's question clearly and concisely.

CONTEXT: ${currentContent.substring(0, 2000)}...

USER QUESTION: ${question}

USER EXPERTISE LEVEL: ${userProfile?.expertise || 'intermediate'}

Requirements:
1. Provide a clear, direct answer to the question
2. Keep response under 150 words for quick understanding
3. Adapt complexity to user's expertise level
4. Include 1-2 key insights that help with deeper understanding
5. Use simple, accessible language

Format your response as a direct explanation:
**Answer:** [Your direct answer]
**Key Insight:** [Important related insight]
**Connection:** [How this relates to the broader context]
`;

    // Process with Gemini
    const clarification = await callTextGeneration({
      prompt: clarificationPrompt,
      temperature: 0.4,
      maxTokens: 600,
      taskName: 'quick-clarify'
    });

    // Store for sidepanel access
    await chrome.storage.local.set({
      quickClarification: {
        question,
        answer: clarification,
        timestamp: Date.now(),
        url
      }
    });

    // Open sidepanel to show result
    try {
      await chrome.sidePanel.open({ windowId: (await chrome.tabs.get(tabId)).windowId });
    } catch (error) {
      console.log('Could not open sidepanel, clarification stored');
    }

    return { success: true, clarification };

  } catch (error) {
    console.error('Quick clarify error:', error);
    throw new Error(`Clarification failed: ${error.message}`);
  }
}

// Real-Time Toggle Handler
async function handleRealTimeToggle(data, tabId) {
  try {
    const { enabled } = data;

    // Store real-time learning state
    await chrome.storage.local.set({
      realTimeLearningEnabled: enabled,
      realTimeSessionStart: enabled ? Date.now() : null
    });

    // Notify content script of state change
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'REALTIME_STATE_CHANGED',
        enabled,
        timestamp: Date.now()
      });
    } catch (error) {
      console.log('Could not notify content script');
    }

    return { success: true, enabled };

  } catch (error) {
    console.error('Real-time toggle error:', error);
    throw new Error(`Real-time toggle failed: ${error.message}`);
  }
}

// User Profile Update Handler
async function handleUserProfileUpdate(data) {
  try {
    const { profile } = data;

    // Validate and enhance profile
    const enhancedProfile = {
      expertise: profile.expertise || 'intermediate',
      topics: profile.topics || [],
      learningGoals: profile.learningGoals || [],
      preferredComplexity: profile.preferredComplexity || 'moderate',
      updatedAt: Date.now(),
      sessionId: generateSessionId()
    };

    await chrome.storage.sync.set({ userProfile: enhancedProfile });

    console.log('User profile updated successfully');
    return { success: true, profile: enhancedProfile };

  } catch (error) {
    console.error('Profile update error:', error);
    throw new Error(`Profile update failed: ${error.message}`);
  }
}

// Learning Suggestions Handler
async function handleLearningSuggestions(data, tabId) {
  try {
    const { learningObjectives, currentProgress } = data;

    // Get user's learning history and preferences
    const { userProfile, learningHistory } = await chrome.storage.sync.get(['userProfile', 'learningHistory']);

    // Create personalized learning suggestions
    const suggestionsPrompt = `
You are an expert learning coach. Based on this user's profile and current progress, suggest 3-5 personalized learning activities.

USER PROFILE:
- Expertise Level: ${userProfile?.expertise || 'intermediate'}
- Learning Goals: ${userProfile?.learningGoals?.join(', ') || 'Not specified'}
- Preferred Topics: ${userProfile?.topics?.join(', ') || 'None specified'}

CURRENT PROGRESS:
${JSON.stringify(currentProgress)}

LEARNING OBJECTIVES:
${JSON.stringify(learningObjectives)}

Provide specific, actionable suggestions that:
1. Match their expertise level
2. Address their learning objectives
3. Are appropriate for their current progress
4. Include different learning modalities (reading, practice, discussion, etc.)
5. Can be implemented immediately

Format as JSON array:
[
  {
    "title": "Suggestion title",
    "description": "What to do",
    "benefit": "Why this helps",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedTime": "time estimate",
    "modality": "reading|practice|discussion|visual|interactive"
  }
]
`;

    // Process with Gemini
    const suggestionsText = await callTextGeneration({
      prompt: suggestionsPrompt,
      temperature: 0.65,
      maxTokens: 1200,
      taskName: 'learning-suggestions'
    });

    let suggestions;
    try {
      suggestions = JSON.parse(suggestionsText);
    } catch (e) {
      // Fallback: parse as structured text
      suggestions = parseSuggestionsFallback(suggestionsText);
    }

    return { success: true, suggestions };

  } catch (error) {
    console.error('Learning suggestions error:', error);
    throw new Error(`Suggestions generation failed: ${error.message}`);
  }
}

// Helper functions for real-time learning

function createContextualPrompt(content, userProfile, scrollPosition) {
  const expertise = userProfile?.expertise || 'intermediate';
  const topics = userProfile?.topics || [];

  return `You are a real-time learning assistant. Analyze this content section and provide immediate learning insights.

CONTENT SECTION:
${content.substring(0, 1500)}...

USER CONTEXT:
- Expertise Level: ${expertise}
- Topics of Interest: ${topics.join(', ')}
- Reading Position: ${scrollPosition}

Provide 3-5 specific learning insights:
1. Key concepts the user should understand
2. Connections to previous learning (if any)
3. Questions to test understanding
4. Related topics for deeper exploration
5. Practical applications or examples

Format JSON:
{
  "insights": [
    {
      "type": "concept|connection|question|application|exploration",
      "content": "specific insight",
      "priority": "high|medium|low"
    }
  ]
}

Focus on insights that are immediately actionable and enhance real-time understanding.`;
}

function parseContextualSuggestions(insightsText) {
  try {
    const parsed = JSON.parse(insightsText);
    return parsed.insights || [];
  } catch (e) {
    // Fallback parsing logic
    return parseTextAsInsights(insightsText);
  }
}

function parseTextAsInsights(text) {
  // Simple fallback parsing for non-JSON responses
  const insights = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('concept:')) {
      insights.push({ type: 'concept', content: line.split(':')[1]?.trim(), priority: 'high' });
    } else if (line.includes('connection:')) {
      insights.push({ type: 'connection', content: line.split(':')[1]?.trim(), priority: 'medium' });
    } else if (line.includes('question:')) {
      insights.push({ type: 'question', content: line.split(':')[1]?.trim(), priority: 'high' });
    }
  });

  return insights.slice(0, 5); // Limit to 5 insights
}

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function parseSuggestionsFallback(text) {
  // Simple fallback for suggestions parsing
  const suggestions = [];
  const sections = text.split(/\d+\./);
  
  sections.forEach(section => {
    if (section.trim().length > 20) {
      suggestions.push({
        title: section.substring(0, 50) + '...',
        description: section.substring(0, 200),
        benefit: 'Enhanced understanding',
        difficulty: 'intermediate',
        estimatedTime: '10-15 minutes',
        modality: 'reading'
      });
    }
  });

  return suggestions.slice(0, 3);
}

function sanitizeGeminiJson(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, '');
  cleaned = cleaned.replace(/```$/i, '');
  cleaned = cleaned.replace(/```/g, '');
  return cleaned.trim();
}

function tryParseGeminiJson(text) {
  if (!text) return null;
  const cleaned = sanitizeGeminiJson(text);

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

  const openingChar = cleaned[start];
  const closingChar = openingChar === '[' ? ']' : '}';
  const end = cleaned.lastIndexOf(closingChar);
  if (start === -1 || end === -1) {
    return null;
  }

  const candidate = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    console.warn('Gemini JSON parse failed, returning null:', error);
    return null;
  }
}

function normalizeAggregationConcepts(rawText) {
  const parsed = tryParseGeminiJson(rawText);
  const normalized = [];

  if (Array.isArray(parsed)) {
    parsed.forEach((item, index) => {
      normalized.push(normalizeAggregationItem(item, index));
    });
  } else if (parsed && Array.isArray(parsed.keyConcepts)) {
    parsed.keyConcepts.forEach((item, index) => {
      normalized.push(normalizeAggregationItem(item, index));
    });
  } else if (parsed && typeof parsed === 'object') {
    normalized.push(normalizeAggregationItem(parsed, 0));
  } else if (typeof rawText === 'string') {
    // Fallback: split by newline or comma
    const parts = rawText.split(/[\n,]/).map(part => part.trim()).filter(Boolean);
    parts.forEach((concept, index) => {
      normalized.push({
        concept,
        uniqueInsight: 'Explore how this concept links to your core topic.',
        searchPhrases: [concept],
        actionStep: 'Search for a recent article or tutorial that expands on this idea.'
      });
    });
  }

  return normalized.filter(Boolean).slice(0, 5);
}

function normalizeAggregationItem(item, index) {
  if (!item) return null;
  const concept = item.concept || item.name || item.title || `Concept ${index + 1}`;
  let uniqueInsight = item.uniqueInsight || item.summary || item.explanation || item.why || '';
  let actionStep = item.actionStep || item.nextStep || item.recommendation || '';
  let searchPhrases = item.searchPhrases || item.search_terms || item.keywords || item.searchTerms || [];

  if (typeof uniqueInsight !== 'string') {
    uniqueInsight = '';
  }
  if (typeof actionStep !== 'string') {
    actionStep = '';
  }
  if (typeof searchPhrases === 'string') {
    searchPhrases = searchPhrases.split(/[,;\n]/).map(str => str.trim()).filter(Boolean);
  }
  if (!Array.isArray(searchPhrases)) {
    searchPhrases = [];
  }

  if (!uniqueInsight) {
    uniqueInsight = `Deepen your understanding of "${concept}" to strengthen mastery of the main topic.`;
  }

  if (!actionStep) {
    actionStep = 'Review a trusted article or documentation section and capture two practical takeaways.';
  }

  if (!searchPhrases.length) {
    searchPhrases = [concept];
  }

  return {
    concept: concept.trim(),
    uniqueInsight: uniqueInsight.trim(),
    searchPhrases,
    actionStep: actionStep.trim()
  };
}

// Keep service worker alive
let keepAlive;
chrome.runtime.onStartup.addListener(() => {
  keepAlive = setInterval(() => {
    console.log('Enhanced service worker keepalive ping - Real-Time Learning Active');
  }, 20000);
});
