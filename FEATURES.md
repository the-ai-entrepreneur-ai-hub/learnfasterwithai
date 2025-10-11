# Feature Documentation - AI Learning Accelerator

Comprehensive guide to all features and capabilities.

## 🎯 Core Features

### 1. Content Processing

#### Summarization
**What it does**: Condenses long learning materials into concise summaries

**How it works**:
- Extracts key points and main ideas
- Preserves important details
- Organized into clear sections
- Typically 10-20% of original length

**Best for**:
- Long articles and blog posts
- Documentation pages
- Course materials
- Research papers

**Usage**:
1. Analyze a page
2. Click "Summarize Content"
3. Wait for processing
4. Read structured summary

#### Key Concepts Extraction
**What it does**: Identifies and organizes main concepts hierarchically

**How it works**:
- Finds central topics and subtopics
- Creates concept relationships
- Organizes in parent-child structure
- Perfect for mind map generation

**Best for**:
- Complex topics with multiple concepts
- Preparing for exams
- Creating study guides
- Understanding relationships

**Output format**: JSON structure with main topic, key concepts, subconcepts, and connections

#### Language Simplification
**What it does**: Rewrites content in clearer, simpler language

**How it works**:
- Breaks down complex sentences
- Uses simpler vocabulary
- Adds analogies and examples
- Maintains accuracy

**Best for**:
- Non-native English speakers
- Complex technical content
- Quick understanding
- Teaching others

#### Pattern Identification
**What it does**: Discovers learning frameworks and mental models

**How it works**:
- Identifies recurring themes
- Finds structural patterns
- Creates memorable frameworks
- Shows pattern connections

**Best for**:
- Deep understanding
- Long-term retention
- Exam preparation
- Expert-level learning

### 2. Visual Learning Tools

#### Mind Maps
**What it does**: Creates hierarchical visual concept maps

**Features**:
- SVG-based visualization
- Central topic with branches
- Color-coded relationships
- Exportable format

**Best for**:
- Visual learners
- Concept relationships
- Quick review
- Study materials

**Customization**:
- Adjust density in Settings
- Choose complexity level
- Export as SVG

#### Flow Diagrams
**What it does**: Visualizes processes and relationships (Coming Soon)

**Planned features**:
- Process flows
- Decision trees
- Relationship diagrams
- Sequential learning paths

#### Infographics
**What it does**: Generates visual learning materials with Imagen API

**Requirements**:
- Imagen API key (optional)
- Processed concepts available

**Features**:
- AI-generated visuals
- Vintage educational style
- Custom prompts
- High-quality output

### 3. Interactive Learning

#### Quiz Generation
**What it does**: Creates practice questions from content

**Features**:
- Multiple choice questions
- Understanding-focused (not just memorization)
- Correct answers included
- Brief explanations

**Best for**:
- Exam preparation
- Self-assessment
- Active recall practice
- Spaced repetition

**Planned enhancements**:
- Interactive UI with scoring
- True/false questions
- Fill-in-the-blank
- Progress tracking

#### Flashcards (Coming Soon)
**Planned features**:
- Auto-generated from concepts
- Spaced repetition algorithm
- Progress tracking
- Export to Anki format

### 4. Multi-Source Learning

#### Content Aggregation
**What it does**: Finds related learning materials on the same topic

**How it works**:
- Analyzes current content
- Extracts key search terms
- Identifies concepts for exploration
- Provides search recommendations

**Best for**:
- Comprehensive understanding
- Multiple perspectives
- Filling knowledge gaps
- Research

**Output**: List of key concepts to search for across platforms

### 5. Learning Library

#### Save & Organize
**Features**:
- Auto-save all processed content
- Categorized by type
- Searchable and filterable
- Date stamped

**Storage limit**: 50 most recent items (configurable)

#### Filter Options
- All items
- Summaries only
- Mind maps only
- Quizzes only

#### Export Functionality
**What you can export**:
- Entire library as JSON
- Individual items
- Statistics
- Mind maps as SVG

**Use cases**:
- Backup your learning
- Share with others
- Import to other tools
- Portfolio building

## ⚙️ Settings & Customization

### API Configuration

#### Gemini API Key
- **Required**: Yes
- **Purpose**: All AI processing
- **Get it**: https://makersuite.google.com/app/apikey
- **Free tier**: Yes, generous limits

#### Imagen API Key
- **Required**: No
- **Purpose**: Visual generation
- **Get it**: Google Cloud Vertex AI
- **Free tier**: Limited

### Learning Preferences

#### Content Complexity
**Simple**:
- Maximum simplification
- Basic vocabulary
- Lots of examples
- Best for beginners

**Moderate** (Recommended):
- Balanced approach
- Some technical terms explained
- Clear but comprehensive
- Best for most users

**Advanced**:
- Preserves technical depth
- Assumes background knowledge
- Detailed and precise
- Best for experts

#### Visualization Density
- Scale: 1-10
- Default: 5
- Low: Minimal concepts only
- High: Maximum detail

**Affects**:
- Mind map node count
- Subconcept inclusion
- Visual complexity

#### Default Language
**Supported**:
- English
- Spanish
- French
- German
- Portuguese
- Chinese
- Japanese
- Arabic

**Effect**: Language for simplified explanations

### Data Management

#### Statistics Tracked
- Materials processed
- Concepts learned
- Library items count
- Last processed date

#### Clear Library
- Removes all saved items
- Resets statistics
- Cannot be undone
- Export first recommended

## 🎨 User Interface

### Popup (Extension Icon)
**Quick actions**:
- Analyze current page
- Upload document
- Open library
- Open settings

**Always accessible**: Click extension icon anytime

### Side Panel (Main Interface)
**Tabs**:
1. Process - Content analysis
2. Visualize - Mind maps & diagrams
3. Quiz - Practice questions
4. Library - Saved materials

**Features**:
- Resizable
- Persistent
- Tab memory
- Auto-save

### Floating Action Button (FAB)
**Location**: Bottom-right of pages

**Function**: Quick access to analyze current page

**Design**: Vintage bronze aesthetic

**Behavior**:
- Appears on all pages
- Hover effect
- One-click activation

### Options Page
**Access**: Right-click extension → Options

**Sections**:
- API Configuration
- Learning Preferences
- Data Management

**Features**:
- Auto-save
- Validation
- Help links

## 🔄 Workflow Examples

### Preparing for a Certification Exam

1. Find study material (article/course page)
2. Click FAB button
3. Extract key concepts
4. Generate mind map
5. Create quiz questions
6. Save to library
7. Review library before exam

### Understanding Complex Documentation

1. Open documentation page
2. Analyze with extension
3. Simplify language
4. Identify patterns
5. Find related materials
6. Create visual diagram
7. Export for reference

### Learning from Multiple Sources

1. Process first article
2. Note key concepts
3. Find related materials
4. Process each source
5. Compare in library
6. Create comprehensive mind map
7. Generate final quiz

## 📊 Performance & Limits

### Processing Times
- Summarization: 10-30 seconds
- Concepts: 15-40 seconds
- Simplification: 10-25 seconds
- Patterns: 20-45 seconds
- Mind maps: 5-15 seconds
- Quizzes: 15-35 seconds

**Factors affecting speed**:
- Content length
- API response time
- Internet connection
- Gemini API load

### Content Limits
- **Minimum**: ~200 words for best results
- **Maximum**: ~10,000 words per processing
- **Optimal**: 1,000-3,000 words

### API Rate Limits
**Gemini Free Tier**:
- 60 requests per minute
- More than enough for personal use

**If exceeded**:
- Wait a minute
- Upgrade to paid tier
- Process shorter content

## 🔒 Privacy & Data

### What's Stored Locally
- API keys (encrypted sync storage)
- Processed content (local storage)
- Library items (local storage)
- Settings (sync storage)

### What's Sent to APIs
- Content you choose to process
- Your API requests
- No personal data
- No tracking

### What's NOT Collected
- No analytics
- No usage tracking
- No personal information
- No browsing history

## 🐛 Known Limitations

### Current Limitations
1. PDF processing requires manual upload (PDF.js integration planned)
2. Quiz questions are text-only (interactive UI coming)
3. Video transcript extraction limited to YouTube
4. No collaborative features yet
5. Library limited to 50 items

### Planned Improvements
- Advanced PDF support
- Better video integration
- Collaborative learning
- Mobile companion
- More visualization types
- Enhanced quiz interface

---

For more information, see:
- [README.md](README.md) - Overview
- [INSTALLATION.md](INSTALLATION.md) - Setup guide
- [QUICKSTART.md](QUICKSTART.md) - Get started fast
