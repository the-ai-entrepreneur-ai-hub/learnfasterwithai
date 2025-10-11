# Installation Guide - AI Learning Accelerator

This guide will walk you through installing and setting up the AI Learning Accelerator extension.

## Prerequisites

Before you begin, make sure you have:

1. **Chrome or Edge Browser** (latest version recommended)
2. **Google Gemini API Key** (required)
   - Free tier available
   - Get it at: https://makersuite.google.com/app/apikey
3. **Google Imagen API Key** (optional, for visual generation)
   - Available through Google Cloud
   - Info: https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key (you'll need this later)
5. Keep it secure - don't share it publicly

**Note**: The free tier includes generous limits suitable for personal learning use.

## Step 2: Download the Extension

### Option A: Clone with Git
```bash
git clone https://github.com/yourusername/ai-learning-accelerator.git
cd ai-learning-accelerator
```

### Option B: Download ZIP
1. Download the repository as ZIP
2. Extract to a folder on your computer
3. Remember the folder location

## Step 3: Load Extension in Chrome

1. Open Chrome or Edge browser
2. Navigate to the extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`

3. **Enable Developer Mode**:
   - Look for the toggle in the top-right corner
   - Turn it ON

4. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to the folder where you extracted/cloned the extension
   - Select the `learnfasterwithai` folder (the one containing `manifest.json`)
   - Click "Select Folder"

5. **Verify Installation**:
   - You should see "AI Learning Accelerator" in your extensions list
   - The extension icon should appear in your browser toolbar
   - Status should show "Enabled"

## Step 4: Configure API Keys

1. **Open Settings**:
   - Click the AI Learning Accelerator icon in your browser toolbar
   - Click the "⚙ Settings" button at the bottom
   - OR right-click the extension icon → "Options"

2. **Enter Gemini API Key**:
   - Paste your Gemini API key in the first field
   - Click the eye icon (👁️) to verify you entered it correctly
   - This is **required** for the extension to work

3. **Enter Imagen API Key** (Optional):
   - If you have an Imagen API key, paste it in the second field
   - This enables AI-generated infographics
   - You can skip this and add it later

4. **Configure Preferences**:
   - **Content Complexity**: Choose how simplified you want explanations
     - Simple: Maximum simplification
     - Moderate: Balanced (recommended)
     - Advanced: Preserve technical depth

   - **Visualization Density**: Control mind map detail level
     - Slide to adjust (5 is default)

   - **Default Language**: Select your preferred language
     - English is default

5. **Save Settings**:
   - Click the "💾 Save Settings" button
   - Wait for confirmation message
   - The extension will test your API key automatically

## Step 5: First Use

1. **Navigate to a Learning Resource**:
   - Open any article, blog post, or documentation page
   - Examples:
     - Wikipedia article
     - Medium blog post
     - AWS documentation
     - Course material page

2. **Activate the Extension**:
   - Look for the floating action button in the bottom-right corner
   - It's a circular button with "AI" text
   - Click it to analyze the current page

3. **Wait for Processing**:
   - The extension extracts content from the page
   - A side panel will open with the learning interface

4. **Start Learning**:
   - Try clicking "Summarize Content"
   - Explore other features in different tabs
   - All processed content is saved to your library

## Troubleshooting

### Extension Not Loading

**Problem**: Extension doesn't appear after loading
- **Solution**:
  - Make sure you selected the correct folder (containing manifest.json)
  - Check for errors in the extensions page
  - Try refreshing the extensions page

### API Key Errors

**Problem**: "API key not configured" error
- **Solution**:
  - Open Settings and verify your API key is entered
  - Make sure there are no extra spaces
  - Try generating a new API key from Google AI Studio

**Problem**: "Gemini API error" message
- **Solution**:
  - Check your API key is valid
  - Verify you haven't exceeded the free tier limit
  - Check your internet connection
  - Try again in a few minutes

### Content Not Extracting

**Problem**: "Could not extract content" error
- **Solution**:
  - Refresh the page and try again
  - Some pages block content extraction
  - Try a different page or upload a document instead

### Floating Button Not Appearing

**Problem**: Can't see the FAB button on pages
- **Solution**:
  - Refresh the page after installing the extension
  - Make sure the extension is enabled
  - Try clicking the extension icon instead

### Side Panel Not Opening

**Problem**: Side panel doesn't open when clicking FAB
- **Solution**:
  - Make sure your browser supports side panels (Chrome 114+)
  - Try using the popup instead (click extension icon)
  - Restart your browser

## Updating the Extension

When new versions are released:

1. Navigate to `chrome://extensions/`
2. Find AI Learning Accelerator
3. Click the refresh/update button
4. Or download the new version and reload

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find AI Learning Accelerator
3. Click "Remove"
4. Confirm removal

**Note**: This will delete all local data including your library. Export your data first if you want to keep it.

## Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review the README** for feature documentation
3. **Open an issue** on GitHub with:
   - Browser version
   - Error messages
   - Steps to reproduce

## Next Steps

Now that you're set up:

- Read the [README.md](README.md) for feature details
- Try processing different types of content
- Experiment with visualizations
- Build your learning library
- Share feedback to help improve the extension!

---

**Happy Learning! 🎓**
