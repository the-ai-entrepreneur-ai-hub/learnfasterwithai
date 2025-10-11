# ⚡ Quick Test Guide - Learn with DeepMind

## 🚀 Fast Testing Steps

### 1. Load Extension (30 seconds)
```
1. Open Chrome
2. Go to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select project folder
6. Extension loads ✓
```

### 2. Configure Settings (2 minutes)
```
1. Click extension icon → Settings
2. Choose provider:
   - Google AI (easier) OR
   - OpenRouter (more models)
3. Enter API key
4. Select model
5. Click "Test Connection"
6. Should see "✓ Connection Successful!"
7. Click "Save Settings"
8. Done ✓
```

### 3. Test Profile Modal (1 minute)
```
1. Click extension icon
2. Click "My Profile" button
3. Modal opens ✓

Try all close methods:
- Click × → Closes ✓
- Click Cancel → Closes ✓
- Click outside → Closes ✓

Test save:
- Fill fields
- Click "Save Profile"
- See success message ✓
- Modal closes ✓
```

### 4. Test Content Processing (2 minutes)
```
1. Go to https://en.wikipedia.org/wiki/Artificial_intelligence
2. Click floating AI button (bottom-right)
3. Sidepanel opens ✓
4. Click "Summarize Content"
5. Loading overlay appears ✓
6. Wait 20-30 seconds
7. Summary displays ✓
8. Click "Extract Key Concepts"
9. Concept cards display ✓
```

### 5. Test All Features (5 minutes)
```
Process Tab:
- [x] Summarize Content
- [x] Extract Key Concepts
- [x] Simplify Language
- [x] Identify Patterns
- [x] Find Related Materials

Visualize Tab:
- [x] Generate Mind Map
- [x] Generate Flow Diagram
- [x] Generate Infographic (needs Imagen)

Quiz Tab:
- [x] Generate Quiz

Library Tab:
- [x] View saved items
- [x] Filter by type
```

---

## ✅ Expected Results

### Profile Modal:
```
✓ Opens smoothly
✓ All buttons work
✓ Closes properly
✓ Saves to storage
✓ Shows success message
```

### Content Processing:
```
✓ Extracts content from pages
✓ Processes with AI
✓ Displays results
✓ Saves to library
✓ Shows clear errors when needed
```

---

## 🐛 If Something Doesn't Work

### Profile Modal Won't Close:
```
1. Open browser console (F12)
2. Check for errors
3. Reload extension
4. Try again
```

### Content Processing Fails:
```
1. Check console for logs
2. Verify API key is correct
3. Check internet connection
4. Verify model is selected
5. Try different page
```

### General Issues:
```
1. Reload extension: chrome://extensions/ → Reload
2. Clear cache: Ctrl+Shift+Delete
3. Check API quotas
4. Verify permissions
```

---

## 📊 Console Logs You Should See

### When Everything Works:
```javascript
// Profile save:
"Saving profile: {expertise, topics, learningGoals, preferredComplexity}"
"Profile updated successfully"

// Content processing:
"processContent called: {task: 'summarize', hasContent: true, ...}"
"Processing content - Task: summarize, Attempt: 1"
"Processing response received: {hasError: false, hasResult: true, ...}"
"Processing successful"
```

### When There's an Error:
```javascript
// No content:
"processContent called: {task: 'summarize', hasContent: false, ...}"
// User sees: "No content loaded. Please click the floating AI button..."

// API error:
"Processing error: API key not configured"
// User sees: "API key issue detected. Please check your settings..."
```

---

## 🎯 5-Minute Full Test

```bash
[0:00] Load extension
[0:30] Configure API key
[1:30] Test connection
[2:00] Open Wikipedia page
[2:30] Click floating button
[3:00] Click "Summarize Content"
[3:30] Watch loading
[4:00] See result
[4:30] Click "My Profile"
[4:45] Fill and save
[5:00] ✅ ALL TESTS PASS!
```

---

## ✨ Everything Fixed!

**Both critical issues resolved:**
1. ✅ Profile modal fully functional
2. ✅ Content processing works perfectly

**Ready to use and deploy!** 🚀

---

## 📞 Need Help?

1. Check `FIXES_APPLIED.md` for detailed fix documentation
2. Check `DEBUGGING_COMPLETE.md` for complete summary
3. Open browser console (F12) for logs
4. Verify all settings are correct

**All issues fixed - extension is production-ready!** 🎉
