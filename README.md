# 🚀 Fullstack Mobile Template

A production-ready fullstack mobile application template built for AI development tools like Claude Code, Cursor, and other LLM agents.

## 🎯 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd fullstack-mobile-template

# Setup everything in one command
task setup

# Start development
task dev
```

That's it! You now have a fully functional mobile app with backend running.

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
| `task setup` | Complete project setup from scratch |
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
- **npm** (for backend)
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

## 🚀 Getting Started Guide

### 1. Initial Setup
```bash
# Clone and setup
git clone <your-repo>
cd fullstack-mobile-template
task setup
```

### 2. Configure Convex
```bash
# Login to Convex (first time only)
cd convex && npx convex login

# Initialize your project
npx convex dev --configure
```

### 3. Start Developing
```bash
# Start everything
task dev

# Or start separately
task convex:dev  # Terminal 1
task app:dev     # Terminal 2
```

### 4. Add Your First Feature
1. Define your data schema in `convex/src/schema.ts`
2. Create backend functions in `convex/src/`
3. Sync API types: `task convex:sync-api`
4. Build your UI in `app/`

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