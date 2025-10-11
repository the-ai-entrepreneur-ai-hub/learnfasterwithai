# 🔧 Troubleshooting Guide - Learn with DeepMind

## 🎯 Vision Reminder

**Learn with DeepMind** replaces traditional learning with AI-powered visual learning:
- ✅ Reduce 10-hour courses to 1-hour focused sessions
- ✅ Transform dense technical material into memorable visual patterns
- ✅ Generate accurate summaries, mind maps, and quizzes
- ✅ Eliminate traditional rote learning → Replace with pattern recognition

---

## 🐛 Issue: "Summarize Content" Does Nothing

### Symptoms:
- Click "Summarize Content" button
- ❌ No loading popup appears
- ❌ Nothing happens
- ❌ No error messages

### Step-by-Step Debugging:

#### **Step 1: Open Browser Console**
```bash
1. Open sidepanel
2. Press F12 (or Ctrl+Shift+I)
3. Go to "Console" tab
4. Keep it open while testing
```

#### **Step 2: Click "Summarize Content" and Check Logs**

You should see these console logs in order:
```javascript
=== SUMMARIZE BUTTON CLICKED ===
Current state: {hasContent: true/false, contentLength: 0, metadata: {...}}
processContent called: {task: 'summarize', hasContent: true, ...}
=== SHOW LOADING CALLED === {message: 'Generating comprehensive summary...', showProgress: true}
Loading overlay element: <div...>
Loading elements: {text: <p...>, progressBar: <div...>}
Adding active class to overlay
Loading overlay should now be visible
Processing content - Task: summarize, Attempt: 1
```

#### **Step 3: Diagnose Based on Console Output**

**Scenario A: No logs at all**
```
Problem: Event listener not attached
Fix:
1. Reload extension: chrome://extensions/ → Click reload
2. Close and reopen sidepanel
3. Try again
```

**Scenario B: Logs show `hasContent: false`**
```
Problem: No content extracted from page
Error message: "No content loaded. Please click the floating AI button..."

Fix:
1. Go to a webpage (e.g., Wikipedia)
2. Click the floating AI button (bottom-right corner)
3. Sidepanel opens with content loaded
4. Try "Summarize Content" again
```

**Scenario C: Loading logs appear but overlay doesn't show**
```
Problem: CSS issue with loading overlay

Fix 1 - Check if overlay exists:
document.getElementById('loading-overlay')
// Should return: <div class="loading-overlay">...</div>

Fix 2 - Force show overlay manually:
document.getElementById('loading-overlay').classList.add('active')
// Overlay should appear

Fix 3 - Check CSS:
const overlay = document.getElementById('loading-overlay');
console.log(window.getComputedStyle(overlay).display);
// Should be: "flex" when active

If still not showing:
1. Clear browser cache: Ctrl+Shift+Delete
2. Reload extension
3. Hard refresh sidepanel: Ctrl+F5
```

**Scenario D: Logs show API error**
```
Problem: OpenRouter/Gemini API issue

Check for these errors:
- "API key not configured"
- "OpenRouter API key not configured"
- "Invalid API key format"
- "Rate limit exceeded"

Fix:
1. Go to Settings
2. Verify provider is selected (Google AI or OpenRouter)
3. Verify API key is entered correctly
4. Click "Test Connection"
5. Should see "✓ Connection Successful!"
6. Click "Save Settings"
7. Try processing again
```

---

## 🔍 OpenRouter Specific Debugging

### Verify OpenRouter Configuration:

#### **Step 1: Check Settings**
```bash
1. Open Settings
2. Provider should show "OpenRouter" selected
3. OpenRouter API Key should be filled
4. Text Model should be selected (e.g., anthropic/claude-3.5-sonnet)
5. Image Model (optional) can be selected for visuals
```

#### **Step 2: Test Connection**
```bash
1. Click "Test OpenRouter" button
2. Wait 5-10 seconds
3. Should see: "✓ Connection Successful! [model] is ready."

If fails:
- Check API key is correct
- Check you have credits on OpenRouter
- Try different model
- Check https://openrouter.ai/keys for quota
```

#### **Step 3: Verify Storage**
```bash
Open console and run:
chrome.storage.sync.get(['provider', 'openRouterKey', 'openRouterTextModel'], (data) => {
  console.log('Stored settings:', data);
});

Should show:
{
  provider: "openrouter",
  openRouterKey: "sk-or-v1-...",
  openRouterTextModel: "anthropic/claude-3.5-sonnet"
}
```

---

## 📊 Complete Test Flow

### End-to-End Test (5 minutes):

```bash
=== STEP 1: Setup (1 min) ===
1. Reload extension: chrome://extensions/
2. Click extension icon
3. Click "⚙ Settings"

=== STEP 2: Configure OpenRouter (2 min) ===
1. Select "OpenRouter (Multi-model Hub)" provider
2. Enter OpenRouter API key
3. Click 🔄 next to "Text Model"
4. Wait for models to load
5. Select: anthropic/claude-3.5-sonnet
6. Click "Test OpenRouter"
7. Should see: "✓ Connection Successful!"
8. Click "Save Settings"

=== STEP 3: Extract Content (30 sec) ===
1. Open new tab
2. Go to: https://en.wikipedia.org/wiki/Artificial_intelligence
3. Wait for page to load
4. Click floating AI button (bottom-right)
5. Sidepanel opens
6. Console should show: "Content extracted and stored"

=== STEP 4: Test Summarize (1 min) ===
1. Open browser console (F12)
2. Click "Summarize Content"
3. Watch console logs
4. Loading overlay should appear
5. Wait 20-30 seconds
6. Summary should display
7. Console should show: "Processing successful"

=== STEP 5: Test All Features (1 min) ===
Try each button:
- Extract Key Concepts → Concept cards appear
- Simplify Language → Simplified text appears
- Identify Patterns → Patterns list appears
- Find Related Materials → Research leads appear
```

---

## 🎨 Visual Generation Testing

### Test Mind Map Generation:

```bash
1. First extract concepts (button in Process tab)
2. Go to "Visualize" tab
3. Select "Mind Map"
4. Click "Generate Visualization"
5. SVG mind map should appear
6. Shows central topic + branch concepts
7. Click "Export" to download SVG
```

### Test with OpenRouter Image Model:

```bash
1. Go to Settings
2. Under OpenRouter section
3. Select Image Model (e.g., stabilityai/stable-diffusion-xl)
4. Save settings
5. Go to Visualize tab
6. Select "Infographic"
7. Click "Generate Visualization"
8. Wait 30-60 seconds
9. AI-generated infographic appears
```

---

## 💡 Common Issues & Solutions

### Issue 1: Button Click Does Nothing
```
Symptoms: Click button, absolutely nothing happens, no logs

Diagnosis:
console.log(document.getElementById('btn-summarize'));
// Should return button element, not null

Solution:
1. Check if sidepanel.html has id="btn-summarize"
2. Check if sidepanel.js is loaded
3. Reload extension
4. Clear browser cache
```

### Issue 2: Loading Overlay Exists But Doesn't Show
```
Symptoms: Element exists in DOM but stays invisible

Diagnosis:
const overlay = document.getElementById('loading-overlay');
console.log(overlay.classList.contains('active')); // Should be true when loading
console.log(window.getComputedStyle(overlay).display); // Should be 'flex'

Solution:
Check CSS for .loading-overlay.active:
- display: flex
- z-index: 1000
- position: fixed

If CSS missing:
1. Check sidepanel.css is loaded
2. Hard refresh: Ctrl+F5
3. Check for CSS syntax errors
```

### Issue 3: API Calls Fail Silently
```
Symptoms: Loading appears then disappears, no result

Diagnosis:
Check console for errors:
- "Failed to fetch"
- "Network error"
- "CORS error"
- "API key invalid"

Solution:
1. Check internet connection
2. Verify API key is valid
3. Check API quota/credits
4. Try different model
5. Check firewall/proxy settings
```

### Issue 4: Content Not Extracting
```
Symptoms: Floating button appears but clicking does nothing

Diagnosis:
Check console for:
- "Content extraction initiated"
- "Content extracted and stored"

If missing:
1. Check if content-script.js is injected
2. Check page permissions
3. Try different webpage
4. Check manifest.json host_permissions
```

---

## 🔬 Advanced Debugging

### Enable Verbose Logging:

Add to console:
```javascript
// Enable all logs
localStorage.setItem('debug', 'true');

// Check service worker logs
chrome.runtime.getBackgroundPage((bg) => {
  console.log('Background logs:', bg.console);
});

// Check storage
chrome.storage.sync.get(null, (data) => {
  console.log('All sync storage:', data);
});

chrome.storage.local.get(null, (data) => {
  console.log('All local storage:', data);
});
```

### Test Individual Components:

```javascript
// Test loading overlay manually
const overlay = document.getElementById('loading-overlay');
overlay.classList.add('active');
setTimeout(() => overlay.classList.remove('active'), 3000);

// Test notification system
notificationManager.showNotification('Test message', 'success', 5000);

// Test API call manually
chrome.runtime.sendMessage({
  type: 'PROCESS_WITH_GEMINI',
  data: {
    content: 'Test content for processing',
    task: 'summarize'
  }
}, (response) => {
  console.log('Manual API test response:', response);
});
```

---

## 📋 Diagnostic Checklist

Before reporting issues, verify:

**Configuration:**
- [ ] Extension loaded in chrome://extensions/
- [ ] Provider selected (Google AI or OpenRouter)
- [ ] API key entered and saved
- [ ] Model selected
- [ ] Connection tested successfully

**Content Extraction:**
- [ ] Floating button visible on webpages
- [ ] Button clickable
- [ ] Sidepanel opens when clicked
- [ ] Content info shows word count > 0

**Processing:**
- [ ] Browser console open
- [ ] Logs appear when button clicked
- [ ] Loading overlay appears
- [ ] No error messages in console
- [ ] Result displays after processing

**OpenRouter Specific:**
- [ ] OpenRouter provider selected
- [ ] Valid API key (starts with sk-or-v1-)
- [ ] Text model selected from dropdown
- [ ] Test connection successful
- [ ] Credits available on OpenRouter account

---

## 🆘 Still Not Working?

### Collect Debug Info:

```bash
1. Open console (F12)
2. Click "Summarize Content"
3. Copy all console logs
4. Run these commands and copy output:

chrome.storage.sync.get(null, console.log);
chrome.storage.local.get(['currentContent', 'currentMetadata'], console.log);
document.getElementById('loading-overlay').classList;
window.getComputedStyle(document.getElementById('loading-overlay')).display;
```

### Create Bug Report With:
1. Browser version
2. Extension version
3. Provider used (Google AI / OpenRouter)
4. Console logs
5. Storage output
6. Steps to reproduce
7. Expected vs actual behavior

---

## ✅ Success Indicators

When everything works correctly:

**Console Logs:**
```javascript
=== SUMMARIZE BUTTON CLICKED ===
Current state: {hasContent: true, contentLength: 15234, metadata: {...}}
processContent called: {task: 'summarize', hasContent: true, ...}
=== SHOW LOADING CALLED ===
Loading overlay element: <div...>
Adding active class to overlay
Loading overlay should now be visible
Processing content - Task: summarize, Attempt: 1
Processing response received: {hasError: false, hasResult: true, resultLength: 2456}
Processing successful: {task: 'summarize', responseLength: 2456}
```

**Visual Indicators:**
- ✅ Loading overlay appears (dark background with spinner)
- ✅ Progress bar animates
- ✅ "Generating comprehensive summary..." text visible
- ✅ After 20-30 seconds, result appears
- ✅ Success notification: "Processing complete! 🎉"

**Result Quality:**
- ✅ Summary is well-structured with sections
- ✅ Key concepts are highlighted
- ✅ Relationships between concepts explained
- ✅ Actionable takeaways provided
- ✅ Content is accurate and relevant

---

## 🎉 System Working Perfectly

Your extension is functioning correctly when:
1. ✅ All buttons respond immediately
2. ✅ Loading overlays appear and animate
3. ✅ Results appear within 30 seconds
4. ✅ Content is accurate and well-formatted
5. ✅ No errors in console
6. ✅ All features accessible and working

**Ready to revolutionize learning!** 🚀
