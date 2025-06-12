# 🚀 j1 Template

A production-ready fullstack mobile application template built for AI development tools like Claude Code, Cursor, and other LLM agents.

## 🎯 Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd fullstack-mobile-template

# 2. First-time setup (includes Convex configuration)
task init
```

### 3. Configure Environment Variables

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local`** with your Convex URL (from the init step):
   ```bash
   EXPO_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
   ```

### 4. Start Development

```bash
# Start everything (backend + mobile app)
task dev

# OR start separately for debugging:
task convex:dev  # Terminal 1
task app:dev     # Terminal 2
```

**🎉 That's it! You now have a fully functional mobile app with backend running.**

## 📋 What's Included

- **Backend**: [Convex](https://convex.dev) - Real-time database with serverless functions
- **Frontend**: React Native with [Expo](https://expo.dev) and file-based routing
- **UI**: [Tamagui](https://tamagui.dev) - Universal design system
- **Auth**: Built-in authentication system
- **TypeScript**: Full type safety across the stack
- **Testing**: Vitest for backend, Jest for frontend
- **Task Runner**: Taskfile.yml for easy command management

## 🏗 Project Structure

```
📁 Root
├── 📁 app/              # Mobile application (React Native + Expo)
│   ├── 📁 app/          # File-based routing (pages)
│   ├── 📁 common/       # Shared components, hooks, utilities
│   ├── 📁 services/     # Feature-specific modules
│   └── 📁 assets/       # Images, fonts, static files
├── 📁 convex/           # Backend (Convex serverless functions)
│   ├── 📁 src/          # Functions, schema, auth
│   └── 📁 tests/        # Backend tests
├── 📁 docs/             # Architecture and development guides
└── Taskfile.yml         # Task automation
```

## 🛠 Available Commands

| Command | Description |
|---------|-------------|
| `task init` | Initialize new project (first-time setup with Convex) |
| `task setup` | Setup project dependencies (without Convex config) |
| `task dev` | Start development environment (backend + app) |
| `task install` | Install all dependencies |
| `task convex:dev` | Start Convex backend only |
| `task app:dev` | Start mobile app only |
| `task app:ios` | Run on iOS simulator |
| `task app:android` | Run on Android emulator |
| `task test` | Run all tests |
| `task convex:sync-api` | Sync API types to frontend |
| `task clean` | Clean all build artifacts |

Run `task` to see all available commands.

## 📱 Mobile App Architecture

The mobile app follows a **service-oriented architecture**:

- **`app/`** - File-based routing for pages and navigation
- **`common/`** - Shared components, hooks, and utilities used across services
- **`services/`** - Feature-specific modules (auth, example service, etc.)

Each service contains:
- `components/` - UI components specific to this service
- `contexts/` - React contexts for state management
- `hooks/` - Custom hooks
- `types/` - TypeScript type definitions
- `lib/` - Utility functions

## 🔄 Backend-Frontend Integration

1. **Convex Functions**: Define your backend logic in `convex/src/`
2. **Auto-Generated Types**: Run `task convex:sync-api` to generate TypeScript types
3. **React Hooks**: Use `useQuery()` and `useMutation()` in your React components

```typescript
// In your React component
import { useQuery } from "convex/react";
import { api } from "@/common/lib/api";

function MyComponent() {
  const data = useQuery(api.myFunction.list);
  return <div>{/* Your UI */}</div>;
}
```

## 🧪 Testing

- **Backend Tests**: Located in `convex/tests/`
- **Frontend Tests**: Located alongside components
- **Run All Tests**: `task test`

## 📚 Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - System architecture and design decisions
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) - Development guidelines and best practices
- [`docs/API_PATTERNS.md`](docs/API_PATTERNS.md) - Backend patterns and conventions
- [`app/README.md`](app/README.md) - Mobile app specific documentation
- [`convex/README.md`](convex/README.md) - Backend specific documentation

## 🔧 Prerequisites

- **Node.js** 18+ 
- **Yarn** (for mobile app)
- **pnpm** (for backend)
- **Task** (install with `brew install go-task/tap/go-task` on macOS)
- **Expo CLI** (`npm install -g @expo/cli`)

## 🌟 Key Features

### 🔐 Authentication
Built-in authentication system with:
- Email/password login
- Session management
- Protected routes
- User profile management

### 📊 Real-time Data
Convex provides:
- Real-time subscriptions
- Optimistic updates
- Offline support
- Automatic sync

### 🎨 Design System
Tamagui offers:
- Cross-platform components
- Theme support (light/dark)
- Responsive design
- Animation system

### 🔄 Type Safety
End-to-end type safety:
- Shared types between backend and frontend
- Auto-generated API types
- TypeScript throughout

## 🤖 AI Development Ready

This template is specifically designed for AI coding assistants:

- **Clear Architecture**: Well-structured codebase with clear separation of concerns
- **Comprehensive Documentation**: Every part is documented for AI understanding
- **Type Safety**: Strong typing helps AI understand code relationships
- **Consistent Patterns**: Follows established patterns that AI can replicate
- **Task Automation**: Simple commands that AI can execute

## 🚀 Detailed Getting Started Guide

### Prerequisites Setup

1. **Install Required Tools**:
   ```bash
   # Node.js 18+ (check: node --version)
   # Install Task runner
   brew install go-task/tap/go-task  # macOS
   # or download from: https://taskfile.dev/installation/
   
   # Install global dependencies
   npm install -g convex @expo/cli pnpm
   ```

### Step 1: Project Setup

```bash
# Clone and initialize project
git clone <your-repo-url>
cd fullstack-mobile-template
task init
```

**Note**: The `task init` command handles Convex login and configuration automatically. If you need to do it manually:

1. **Create Convex Account**: Go to [convex.dev](https://convex.dev) and sign up
2. **Copy Your Deployment URL**: After the init process, you'll see output like:
   ```
   ✓ Convex functions ready! (convex dev is running)
   │ Your deployment URL: https://happy-animal-123.convex.cloud
   ```

### Step 2: Environment Configuration

1. **Create Environment File**:
   ```bash
   # From project root
   cp .env.example .env.local
   ```

2. **Configure `.env.local`**:
   ```bash
   # Replace with YOUR deployment URL from the init process
   EXPO_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud
   ```
   
   **⚠️ Important**: 
   - Use your actual deployment URL from Convex
   - The URL format is always `https://[unique-name].convex.cloud`
   - Don't include quotes around the URL

### Step 3: Start Development

```bash
# Option 1: Start everything together (recommended)
task dev

# Option 2: Start separately for debugging
task convex:dev  # Terminal 1 - Backend (if not already running)
task app:dev     # Terminal 2 - Mobile app
```

**What you'll see**:
- Convex terminal: Functions compilation and sync status
- Expo terminal: QR code and development server
- Mobile app: Running on simulator/device/web

### Step 4: Verify Everything Works

1. **Check Convex Dashboard**:
   - Go to [dashboard.convex.dev](https://dashboard.convex.dev)
   - You should see your project with the tasks schema
   - Data browser shows your database tables

2. **Test Mobile App**:
   - Scan QR code with Expo Go app, or
   - Press `i` for iOS simulator, or
   - Press `a` for Android emulator, or
   - Press `w` for web browser

3. **Initialize Example Service**:
   - The app includes a task management example
   - First run will create sample data automatically

### Step 5: Development Workflow

```bash
# Sync API types after backend changes
task convex:sync-api

# Run tests
task test

# Build for production
task build
```

### Troubleshooting

**Common Issues**:

1. **"EXPO_PUBLIC_CONVEX_URL is not defined"**:
   - Check `.env.local` exists and has correct URL
   - Restart Expo dev server: `task app:dev`

2. **"Authentication required" errors**:
   - Convex may need re-login: `npx convex login`
   - Check Convex dev server is running

3. **"Module not found" errors**:
   - Clear caches: `task clean && task install`
   - For Expo: `npx expo start --clear`

4. **API types out of sync**:
   - Run: `task convex:sync-api`
   - Restart development servers

**Getting Help**:
- Check the comprehensive docs in `docs/` folder
- Convex docs: [docs.convex.dev](https://docs.convex.dev)
- Expo docs: [docs.expo.dev](https://docs.expo.dev)

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Follow the development guidelines in `docs/DEVELOPMENT.md`
4. Submit a pull request

---

**Happy coding! 🎉**

*This template is optimized for AI-assisted development. Each component and pattern is designed to be easily understood and extended by AI coding assistants.*
