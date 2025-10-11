# Learn with DeepMind

> Transform traditional learning into visual, AI-powered experiences. Learn faster, retain more, pass certifications efficiently.

*"The mind is like a map - the more connections you draw, the deeper your understanding becomes."*

*"Visual learning transforms complex information into memorable patterns that last a lifetime."*

## 🎓 Overview

**Learn with DeepMind** is a Chrome extension that revolutionizes how you learn by harnessing the power of cutting-edge AI. Whether you're using Google's Gemini models or accessing Claude, GPT-4, and dozens of other AI models through OpenRouter, this tool transforms dense learning materials into visual, memorable experiences.

Inspired by visual learning principles and pattern recognition, this extension helps you:

- **Learn Faster**: Turn 10-hour courses into 1-hour focused learning sessions
- **Retain More**: Build visual mind maps, spot patterns, and organize concepts that stick
- **Pass Exams Easily**: Generate custom quizzes and automatically identify what matters most
- **Understand Better**: Break down complex content with AI-powered explanations tailored to your level

## ✨ Features

### 🤖 AI-Powered Content Processing
- **Smart Summarization**: Extract key points from lengthy learning materials
- **Concept Extraction**: Identify and organize main ideas hierarchically
- **Language Simplification**: Make content accessible for non-native speakers
- **Pattern Recognition**: Discover learning frameworks and mental models

### 🎨 Visual Learning Tools
- **Mind Maps**: Auto-generate hierarchical concept visualizations
- **Flow Diagrams**: Create process and relationship diagrams
- **Infographics**: Generate visual learning aids with Imagen AI
- **Interactive Visuals**: Export and save your learning materials

### 📚 Multi-Source Learning
- **Content Aggregation**: Find and synthesize related learning materials
- **Pattern Connection**: Link concepts across different sources
- **Comprehensive Understanding**: Build knowledge from multiple perspectives

### 🎯 Interactive Learning
- **AI-Generated Quizzes**: Test understanding with auto-created questions
- **Flashcards**: Create study materials from content (coming soon)
- **Progress Tracking**: Monitor materials processed and concepts learned

### 📖 Learning Library
- **Save Everything**: Store summaries, mind maps, and quizzes
- **Easy Access**: Browse your processed learning materials
- **Export Data**: Backup your entire learning library

## 🎨 Design Philosophy

**Learn with DeepMind** features a unique **old-school academic design** inspired by vintage textbooks and traditional learning environments:

- Classic serif typography (Crimson Text, EB Garamond)
- Warm paper textures and sepia tones
- Vintage ornaments and decorative elements
- Library/study hall aesthetic
- Nostalgic yet modern experience

This design creates a focused, serious learning atmosphere while incorporating cutting-edge AI technology.

## 🚀 Installation

### Prerequisites
1. Chrome or Edge browser (Manifest V3 compatible)
2. **Choose your AI provider:**
   - **Google Gemini API** ([Get free key here](https://makersuite.google.com/app/apikey)) - Simple setup, great for getting started
   - **OpenRouter** ([Sign up here](https://openrouter.ai/)) - Access to 100+ models including Claude, GPT-4, Mistral, and more
3. (Optional) Image generation API for creating visual infographics

### Setup Instructions

1. **Clone or Download** this repository
   ```bash
   git clone https://github.com/the-ai-entrepreneur-ai-hub/learnfasterwithai.git
   cd learnfasterwithai
   ```

2. **Load the Extension**
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Flip on "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `learnfasterwithai` folder

3. **Configure Your AI Provider**
   - Click the extension icon in your browser
   - Hit the Settings button (⚙️)
   - **For Google Gemini:**
     - Select "Google AI" as provider
     - Paste your Gemini API key
     - Choose your preferred model
   - **For OpenRouter:**
     - Select "OpenRouter" as provider
     - Paste your OpenRouter API key
     - Pick from models like Claude 3.5 Sonnet, GPT-4, or any other supported model
     - (Optional) Add an image model for visual generation
   - Click "Save Settings"

4. **Start Learning!**
   - Head to any learning resource (article, docs, course page)
   - Click the floating AI button (bottom-right corner)
   - Or click the extension icon and choose "Analyze This Page"

## 📖 How to Use

### Analyzing Content

1. **Web Pages**: Navigate to any article or documentation page, click the FAB button
2. **Upload Documents**: Click extension icon → "Upload Document" → Select PDF/TXT file
3. **Video Transcripts**: Works on YouTube and learning platforms (auto-detects)

### Processing Content

In the side panel, you can:

- **Summarize**: Get comprehensive yet concise summaries
- **Extract Concepts**: Identify key ideas and relationships
- **Simplify Language**: Make content easier to understand
- **Find Patterns**: Discover frameworks and mental models
- **Aggregate Sources**: Find related learning materials

### Creating Visualizations

1. Go to the "Visualize" tab
2. Choose visualization type (Mind Map, Diagram, Infographic)
3. Click "Generate Visualization"
4. Export or regenerate as needed

### Taking Quizzes

1. Go to the "Quiz" tab
2. Click "Generate Quiz"
3. Answer questions to test your understanding

### Managing Library

1. Go to the "Library" tab
2. Browse saved materials
3. Filter by type (Summaries, Mind Maps, Quizzes)
4. Export your library from Settings

## 🛠️ Technical Architecture

### File Structure
```
learnfasterwithai/
├── manifest.json                 # Extension configuration
├── src/
│   ├── background/
│   │   └── service-worker.js    # API orchestration, message routing
│   ├── content/
│   │   └── content-script.js    # Content extraction from pages
│   ├── popup/
│   │   ├── popup.html           # Quick actions popup
│   │   ├── popup.css
│   │   └── popup.js
│   ├── sidepanel/
│   │   ├── sidepanel.html       # Main learning interface
│   │   ├── sidepanel.css
│   │   └── sidepanel.js
│   └── options/
│       ├── options.html         # Settings page
│       ├── options.css
│       └── options.js
├── styles/
│   └── content.css              # Content script styles
├── assets/
│   └── icons/                   # Extension icons
└── README.md
```

### Key Technologies
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI Providers**:
  - **Google Gemini API**: Fast, reliable text processing with multiple Gemini models
  - **OpenRouter**: Multi-model hub with access to Claude, GPT-4, Llama, Mistral, and 100+ other models
  - **Image Generation**: Support for Google Imagen, Stable Diffusion, DALL-E, and other image models
- **Storage**: Chrome Storage API (sync + local)
- **Manifest**: V3 (latest Chrome extension standard)

### AI Integration

The extension gives you flexibility in choosing your AI backend:

1. **Google Gemini** (Direct API):
   - Multiple Gemini models (Pro, Flash, etc.)
   - Content analysis, summarization, concept extraction
   - Image generation via Imagen

2. **OpenRouter** (Multi-Model Hub):
   - **Text Models**: Claude 3.5 Sonnet, GPT-4, Mistral, Llama 3, and more
   - **Image Models**: Stable Diffusion XL, DALL-E, Flux, and others
   - Switch between models based on your needs and budget
   - Pay-as-you-go pricing with credits

All processing happens client-side with direct API calls - no backend server needed, no data collection, and your API keys stay secure in Chrome's encrypted storage.

## 🎯 Use Cases

### For Certification Students
- AWS, Azure, GCP certification preparation
- CompTIA, Cisco, and other IT certifications
- Professional certifications (PMP, CPA, etc.)

### For Academic Learning
- University course materials
- Online courses (Coursera, Udemy, edX)
- Research papers and documentation

### For Professional Development
- Technical documentation
- Industry reports and whitepapers
- Training materials

## 🔐 Privacy & Security

- **No data collection**: All processing happens locally
- **API keys stored securely**: Chrome's encrypted sync storage
- **No tracking**: Zero analytics or telemetry
- **Open source**: Full transparency in code

Your learning data stays private. The extension only sends content to Google's APIs for processing based on your explicit actions.

## 🚧 Future Enhancements

- [ ] PDF.js integration for better PDF processing
- [ ] Advanced quiz UI with scoring and analytics
- [ ] Spaced repetition system for long-term retention
- [ ] Flashcard mode with active recall
- [ ] Collaborative learning (share and remix mind maps)
- [ ] Additional AI providers (Anthropic Direct, Cohere, etc.)
- [ ] Enhanced video transcript extraction
- [ ] Mobile companion app
- [ ] Offline mode for previously processed content

## 🤝 Contributing

We'd love your help making this extension even better! Whether you're fixing bugs, adding features, or improving documentation, every contribution helps students learn more effectively.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test them thoroughly
4. Commit your changes with clear messages
5. Push to your branch
6. Open a pull request and describe what you've built

Ideas for contributions:
- New visualization types
- Additional AI provider integrations
- Improved quiz generation algorithms
- Better content extraction for specific platforms
- Translations and internationalization

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- **Visual Learning Pioneers**: For proving that the brain thinks in patterns and pictures
- **Google**: For making Gemini and Imagen accessible to developers
- **OpenRouter**: For democratizing access to cutting-edge AI models
- **Open Source Community**: For building tools that help the world learn better

## 📞 Support

- **Issues & Bug Reports**: [GitHub Issues](https://github.com/the-ai-entrepreneur-ai-hub/learnfasterwithai/issues)
- **Feature Requests**: Open an issue with your ideas!
- **Documentation**: This README + inline code comments
- **API Keys**:
  - [Google AI Studio](https://makersuite.google.com/app/apikey) for Gemini
  - [OpenRouter](https://openrouter.ai/keys) for multi-model access

---

**Made with ❤️ for learners worldwide**

*Learn Faster • Retain More • Pass Exams Easily*
