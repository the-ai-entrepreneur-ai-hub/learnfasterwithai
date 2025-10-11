# Learn with DeepMind

> Transform traditional learning into visual, AI-powered experiences. Learn faster, retain more, pass certifications efficiently.

*"The mind is like a map - the more connections you draw, the deeper your understanding becomes."*

*"Visual learning transforms complex information into memorable patterns that last a lifetime."*

## 🎓 Overview

**Learn with DeepMind** is a Chrome browser extension that revolutionizes how students learn by combining the power of Google's Gemini AI with visual learning techniques. Inspired by principles of visual learning and deep pattern recognition, this extension helps students:

- **Learn Faster**: Reduce 10-hour courses to 1-hour focused learning sessions
- **Retain More**: Use visual mind maps, patterns, and structured concepts
- **Pass Exams Easily**: Generate quizzes and identify key concepts automatically
- **Understand Better**: Simplify complex content with AI-powered explanations

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
2. Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
3. (Optional) Google Imagen API key for visual generation

### Setup Instructions

1. **Clone or Download** this repository
   ```bash
   git clone <repository-url>
   cd learnfasterwithai
   ```

2. **Load the Extension**
   - Open Chrome/Edge and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `learnfasterwithai` folder

3. **Configure API Keys**
   - Click the extension icon in your browser
   - Click "Settings" (⚙️ button)
   - Enter your Google Gemini API key (required)
   - Enter your Imagen API key (optional, for visual generation)
   - Click "Save Settings"

4. **Start Learning!**
   - Navigate to any learning resource (article, documentation, course page)
   - Click the floating action button (bottom-right)
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
- **APIs**:
  - Google Gemini Pro (text processing)
  - Google Imagen (image generation)
- **Storage**: Chrome Storage API (sync + local)
- **Manifest**: V3 (latest Chrome extension standard)

### API Integration

The extension uses Google's Generative AI APIs:

1. **Gemini Pro**: Content analysis, summarization, concept extraction
2. **Imagen**: Visual generation for infographics

All processing happens client-side with direct API calls - no backend server required.

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
- [ ] Advanced quiz UI with scoring
- [ ] Spaced repetition system
- [ ] Flashcard mode
- [ ] Collaborative learning (share mind maps)
- [ ] Multiple AI model support
- [ ] Video transcript extraction improvements
- [ ] Mobile companion app

## 🤝 Contributing

Contributions are welcome! This extension is built to help students worldwide learn better.

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- **Brian Tracy**: For visual learning principles
- **Google**: For Gemini and Imagen APIs
- **Open Source Community**: For inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-learning-accelerator/issues)
- **Documentation**: See this README
- **API Keys**: [Google AI Studio](https://makersuite.google.com/app/apikey)

---

**Made with ❤️ for learners worldwide**

*Learn Faster • Retain More • Pass Exams Easily*
