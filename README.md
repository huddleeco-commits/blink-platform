# Module Assembler UI

A beautiful React UI for assembling full-stack projects from your module library.

## 📁 Save These Files To:

```
C:\Users\huddl\OneDrive\Desktop\module-library\assembler-ui\
├── index.html
├── package.json
├── vite.config.js
├── server.cjs
├── README.md
└── src\
    ├── main.jsx
    └── App.jsx
```

## 🚀 Quick Setup

### Step 1: Create the folder
```powershell
mkdir "C:\Users\huddl\OneDrive\Desktop\module-library\assembler-ui"
mkdir "C:\Users\huddl\OneDrive\Desktop\module-library\assembler-ui\src"
```

### Step 2: Save all the files to their locations (download from Claude)

### Step 3: Install dependencies
```powershell
cd "C:\Users\huddl\OneDrive\Desktop\module-library\assembler-ui"
npm install
```

### Step 4: Start the backend server (Terminal 1)
```powershell
cd "C:\Users\huddl\OneDrive\Desktop\module-library\assembler-ui"
node server.cjs
```

### Step 5: Start the frontend (Terminal 2)
```powershell
cd "C:\Users\huddl\OneDrive\Desktop\module-library\assembler-ui"
npm run dev
```

### Step 6: Open in browser
```
http://localhost:5173
```

## 🎯 What It Does

1. **Path Selection** - Choose INSTANT (industry presets) or CUSTOM (pick bundles)
2. **Industry/Bundle Selection** - Pick your configuration
3. **Project Name** - Name your project
4. **Real-time Generation** - Watch progress as modules are copied
5. **Complete** - Open folder, copy path, or create another

## 📊 Features

- **Real Progress**: Shows actual file copying progress (not fake!)
- **7 Industry Presets**: Restaurant, Healthcare, E-commerce, Collectibles, Sports, SaaS, Family
- **9 Bundles**: Core, Dashboard, Commerce, Social, Collectibles, Sports, Healthcare, Family, Gamification
- **54 Modules**: 34 backend + 20 frontend
- **Server Integration**: Calls your actual assemble-project.cjs script
- **Demo Mode**: Works without server for testing

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                    http://localhost:5173                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express Server)                    │
│                    http://localhost:3001                     │
│                                                              │
│  Endpoints:                                                  │
│  - POST /api/assemble     → Runs assemble-project.cjs       │
│  - GET  /api/bundles      → Returns bundle definitions       │
│  - GET  /api/industries   → Returns industry presets         │
│  - GET  /api/projects     → Lists generated projects         │
│  - POST /api/open-folder  → Opens folder in explorer         │
│  - POST /api/open-vscode  → Opens folder in VS Code          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Spawns
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               assemble-project.cjs                          │
│    C:\...\module-library\scripts\assemble-project.cjs      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Copies to
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Generated Projects                            │
│    C:\...\Desktop\generated-projects\{ProjectName}\        │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Screenshots

### Path Selection
```
┌─────────────────────────────────────────────────────────────┐
│   How do you want to build?                                 │
│                                                             │
│   ┌─────────────┐     ┌─────────────┐                       │
│   │     ⚡      │     │     🔧      │                       │
│   │   INSTANT   │     │   CUSTOM    │                       │
│   │  Industry   │     │   Bundles   │                       │
│   │  Presets    │     │   Pick your │                       │
│   │  ~10 sec    │     │   ~30 sec   │                       │
│   └─────────────┘     └─────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Industry Selection
```
┌─────────────────────────────────────────────────────────────┐
│   Pick your industry                                        │
│                                                             │
│   🍽️ Restaurant        🏥 Healthcare       🛒 E-commerce    │
│   🃏 Collectibles      🎮 Sports           🏢 SaaS          │
│   👨‍👩‍👧‍👦 Family                                              │
└─────────────────────────────────────────────────────────────┘
```

### Generation Progress
```
┌─────────────────────────────────────────────────────────────┐
│   ⚡ Assembling MyApp...                                    │
│                                                             │
│   [████████████████░░░░░░░░░░░░░] 55%                       │
│   Copying frontend: collection-grid...                      │
│                                                             │
│   📦 Copying 15 backend modules...                          │
│     ✅ auth                                                 │
│     ✅ stripe-payments                                      │
│     ✅ ai-scanner                                           │
│     ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Complete
```
┌─────────────────────────────────────────────────────────────┐
│   ✅ MyApp Created!                                         │
│                                                             │
│   📁 C:\...\generated-projects\MyApp                        │
│   🔧 15 backend modules                                     │
│   🎨 18 frontend modules                                    │
│                                                             │
│   [📂 Open Folder]  [📋 Copy Path]  [+ Create Another]     │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 API Reference

### POST /api/assemble
Create a new project.

**Request:**
```json
{
  "name": "MyProject",
  "industry": "collectibles"
}
```
OR
```json
{
  "name": "MyProject",
  "bundles": ["core", "commerce", "dashboard"]
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "name": "MyProject",
    "path": "C:\\...\\generated-projects\\MyProject",
    "manifest": { ... }
  }
}
```

## 📝 Notes

- The frontend works in "demo mode" without the backend (shows simulated progress)
- Backend server must be running to actually create projects
- Projects are created in `C:\Users\huddl\OneDrive\Desktop\generated-projects\`
- Progress bar shows REAL progress based on actual module copying
