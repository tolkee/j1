# J1 Clean App

A clean Expo Router application without Tamagui dependencies, maintaining the same architecture and structure as the main J1 app.

## Features

- **Expo Router**: File-based routing system
- **TypeScript**: Full TypeScript support with strict mode
- **Path Aliases**: Clean imports using `@/` prefix
- **Clean Architecture**: Service-oriented structure
- **Backend Ready**: Pre-configured for Convex integration

## Project Structure

```
app-clean/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Welcome screen
├── common/                # Shared utilities
│   └── lib/               # Library files
│       ├── api.ts         # Convex API types
│       └── convex.ts      # Convex client
├── services/              # Feature modules
│   ├── auth/              # Authentication service
│   └── tasks/             # Tasks service
└── package.json
```

## Path Aliases

The app uses TypeScript path aliases for clean imports:

- `@/*` - Root directory
- `@/common/*` - Common utilities and components  
- `@/services/*` - Service modules
- `@/app/*` - App-specific files

## Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start development server**:
   ```bash
   pnpm start
   ```

3. **Run on platforms**:
   ```bash
   pnpm ios     # iOS simulator
   pnpm android # Android emulator  
   pnpm web     # Web browser
   ```

## Architecture

This app follows the same architectural patterns as the main J1 app:

- **Service-oriented**: Features organized in self-contained services
- **Context-based state**: React Context for state management
- **Custom hooks**: Reusable data and logic hooks
- **Type safety**: Full TypeScript coverage
- **Clean imports**: Path aliases for maintainable code

## Next Steps

1. Add authentication service
2. Implement tasks service
3. Add navigation between screens
4. Integrate with Convex backend
5. Add UI components as needed

## No Tamagui

This version intentionally excludes Tamagui to provide a clean, dependency-light foundation. All UI is built with standard React Native components and StyleSheet API.